import { NextResponse } from 'next/server';

/**
 * CMS BFF proxy to finnep-accounting-service.
 * Validates FEB session; requires admin, accountant role, or canAccessAccounting.
 */

export const runtime = 'nodejs';

const FETCH_TIMEOUT_MS = Number(process.env.ACCOUNTING_BFF_TIMEOUT_MS || 15000);

function stripTrailingSlash(u) {
  return (u || '').replace(/\/+$/, '');
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`Upstream timeout after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function backendSessionBase() {
  return stripTrailingSlash(
    process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
  );
}

async function validateAccountingSession(authHeader) {
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return { ok: false, reason: 'missing_bearer' };
  }
  const base = backendSessionBase();
  if (!base) {
    return { ok: false, reason: 'missing_backend_url' };
  }
  const r = await fetchWithTimeout(`${base}/auth/user/session`, {
    headers: { Authorization: authHeader },
    cache: 'no-store',
  });
  if (!r.ok) {
    return { ok: false, reason: 'session_rejected', status: r.status };
  }
  const user = await r.json().catch(() => ({}));
  const role = user?.role || user?.data?.role;
  const canAccess =
    role === 'admin' ||
    role === 'superAdmin' ||
    role === 'accountant' ||
    user?.canAccessAccounting === true ||
    user?.data?.canAccessAccounting === true;
  if (!canAccess) {
    return { ok: false, reason: 'forbidden' };
  }
  return { ok: true };
}

async function proxyRequest(request, pathSegments) {
  const auth = request.headers.get('authorization');
  const session = await validateAccountingSession(auth);
  if (!session.ok) {
    const status = session.reason === 'forbidden' ? 403 : 401;
    return NextResponse.json({ error: 'Unauthorized', code: session.reason }, { status });
  }

  const accountingBase = stripTrailingSlash(process.env.ACCOUNTING_SERVICE_URL || 'http://127.0.0.1:3010');
  const headerName = process.env.ACCOUNTING_AUTH_HEADER || 'X-Accounting-Key';
  const secret = process.env.ACCOUNTING_AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const targetPath = `/api/${pathSegments.join('/')}`;
  const reqUrl = new URL(request.url);
  const targetUrl = `${accountingBase}${targetPath}${reqUrl.search}`;

  const forwardHeaders = { [headerName]: secret };
  const contentType = request.headers.get('content-type');
  const init = { method: request.method, headers: forwardHeaders, cache: 'no-store' };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.text();
    if (body) {
      init.body = body;
      if (contentType) forwardHeaders['Content-Type'] = contentType;
    }
  } else if (contentType) {
    forwardHeaders['Content-Type'] = contentType;
  }

  let res;
  try {
    res = await fetchWithTimeout(targetUrl, init);
  } catch (err) {
    const message = err?.message || 'Accounting service unavailable';
    const status = message.includes('timeout') ? 504 : 502;
    return NextResponse.json({ error: message }, { status });
  }
  const bodyBuffer = await res.arrayBuffer();
  const out = new Headers();
  const ct = res.headers.get('content-type');
  if (ct) out.set('Content-Type', ct);
  else out.set('Content-Type', 'application/json');
  const cd = res.headers.get('content-disposition');
  if (cd) out.set('Content-Disposition', cd);
  return new NextResponse(bodyBuffer, { status: res.status, headers: out });
}

export async function GET(request, context) {
  const path = context?.params?.path || [];
  return proxyRequest(request, path);
}

export async function POST(request, context) {
  const path = context?.params?.path || [];
  return proxyRequest(request, path);
}

export async function PATCH(request, context) {
  const path = context?.params?.path || [];
  return proxyRequest(request, path);
}

export async function DELETE(request, context) {
  const path = context?.params?.path || [];
  return proxyRequest(request, path);
}
