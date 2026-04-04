import { NextResponse } from 'next/server';

/**
 * Server-only BFF to finnep-ops-service (FOS).
 *
 * The browser always calls same-origin `/api/ops/api/dlq/...` (this CMS), not FOS directly — otherwise
 * the ops secret would have to live in the browser. This handler validates the CMS user, then proxies
 * to FOS with OPS_AUTH_SECRET (and optional static user headers matching FOS).
 *
 * Session check: GET {BACKEND_API_URL || NEXT_PUBLIC_API_URL}/auth/user/session on finnep-eventapp-backend.
 * Prefer BACKEND_API_URL in Docker/production when the server must reach FEB on a different base URL
 * than the browser (e.g. http://127.0.0.1:3000/api).
 */

export const runtime = 'nodejs';

function stripTrailingSlash(u) {
  return (u || '').replace(/\/+$/, '');
}

function backendSessionBase() {
  return stripTrailingSlash(
    process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
  );
}

function isAllowedOpsPath(segments) {
  if (!segments.length) return false;
  const p = segments.join('/');
  if (p === 'api/status') return true;
  if (p.startsWith('api/dlq/')) return true;
  if (p === 'api/monitor/snapshot') return true;
  return false;
}

async function validateCmsSession(authHeader) {
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return { ok: false, reason: 'missing_bearer' };
  }
  const base = backendSessionBase();
  if (!base) {
    return { ok: false, reason: 'missing_backend_url' };
  }
  const sessionUrl = `${base}/auth/user/session`;
  const r = await fetch(sessionUrl, {
    headers: { Authorization: authHeader },
    cache: 'no-store'
  });
  if (!r.ok) {
    return { ok: false, reason: 'session_rejected', status: r.status };
  }
  return { ok: true };
}

async function proxyRequest(request, pathSegments) {
  if (!isAllowedOpsPath(pathSegments)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const auth = request.headers.get('authorization');
  const session = await validateCmsSession(auth);
  if (!session.ok) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        code: 'cms_session',
        detail:
          session.reason === 'missing_backend_url'
            ? 'Set BACKEND_API_URL or NEXT_PUBLIC_API_URL to the FEB /api base (e.g. http://127.0.0.1:3000/api)'
            : session.reason
      },
      { status: 401 }
    );
  }

  const opsBase = stripTrailingSlash(process.env.OPS_SERVICE_URL || 'http://127.0.0.1:3099');
  const opsHeaderName = process.env.OPS_AUTH_HEADER || 'X-Ops-Key';
  const opsSecret = process.env.OPS_AUTH_SECRET;
  if (!opsSecret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const targetPath = `/${pathSegments.join('/')}`;
  const reqUrl = new URL(request.url);
  const targetUrl = `${opsBase}${targetPath}${reqUrl.search}`;

  /** @type {Record<string, string>} */
  const forwardHeaders = {
    [opsHeaderName]: opsSecret
  };

  const staticUserHeader = process.env.OPS_STATIC_USER_HEADER || '';
  const staticUser = process.env.OPS_STATIC_USER || '';
  if (staticUserHeader && staticUser) {
    forwardHeaders[staticUserHeader] = staticUser;
  }

  const contentType = request.headers.get('content-type');
  if (contentType && request.method !== 'GET' && request.method !== 'HEAD') {
    forwardHeaders['Content-Type'] = contentType;
  }

  const init = {
    method: request.method,
    headers: forwardHeaders,
    cache: 'no-store'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.text();
    if (body) init.body = body;
  }

  const res = await fetch(targetUrl, init);
  const bodyText = await res.text();
  const out = new Headers();
  const ct = res.headers.get('content-type');
  if (ct) out.set('Content-Type', ct);
  else out.set('Content-Type', 'application/json');
  const cd = res.headers.get('content-disposition');
  if (cd) out.set('Content-Disposition', cd);
  return new NextResponse(bodyText, { status: res.status, headers: out });
}

export async function GET(request, context) {
  return proxyRequest(request, context.params.path || []);
}

export async function POST(request, context) {
  return proxyRequest(request, context.params.path || []);
}

export async function DELETE(request, context) {
  return proxyRequest(request, context.params.path || []);
}
