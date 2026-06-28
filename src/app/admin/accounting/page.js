'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const h = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function accountingFetch(path, options = {}) {
  const hasBody = options.body != null && options.body !== '';
  const headers = {
    ...authHeaders(),
    ...(options.headers || {}),
  };
  if (hasBody && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`/api/accounting/${path}`, {
    ...options,
    headers,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

async function openAccountingPdf(path) {
  const res = await fetch(`/api/accounting/${path}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
    throw new Error(data?.error || data?.code || `Request failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

const EMPTY_STATEMENT_FORM = {
  platformMerchantId: '',
  currency: '',
  periodStart: '',
  periodEnd: '',
  timezone: 'Europe/Helsinki',
  force: false,
};

const EMPTY_INVOICE_FORM = {
  statementId: '',
  dueDate: '',
  reverseVat: false,
};

const EMPTY_ADJUSTMENT_FORM = {
  platformMerchantId: '',
  adjustmentType: 'correction',
  reasonCode: '',
  reasonNote: '',
  linkedExternalRef: '',
  amountCents: '',
  currency: 'eur',
};

const EMPTY_SETTLEMENT_FORM = {
  ledgerEntryId: '',
  settlementReference: '',
};

const EMPTY_CREDIT_NOTE_FORM = {
  invoiceId: '',
  amountCents: '',
  reasonCode: '',
  reasonNote: '',
};

function statementFeesDueCents(statement) {
  return Number(statement?.platform_fee_cents || 0) - Number(statement?.platform_fee_reversed_cents || 0);
}

function formatMoney(cents, currency = 'eur') {
  return `${(Number(cents || 0) / 100).toFixed(2)} ${String(currency || 'eur').toUpperCase()}`;
}

function formatLedgerDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

function entryTypeLabel(type) {
  const labels = { payment: 'Payment', refund: 'Refund', adjustment: 'Adjustment' };
  return labels[String(type || '').toLowerCase()] || type || '—';
}

function entryTypeChipColor(type) {
  const t = String(type || '').toLowerCase();
  if (t === 'refund') return 'warning';
  if (t === 'adjustment') return 'info';
  return 'success';
}

function paymentMethodLabel(method) {
  const labels = {
    stripe: 'Stripe',
    paytrail: 'Paytrail',
    nabil: 'Nabil',
    free: 'Free',
    manual: 'Manual',
    external: 'External',
  };
  return labels[String(method || '').toLowerCase()] || method || '—';
}

function formatExternalRef(ref) {
  if (!ref) return '—';
  const s = String(ref);
  if (s.startsWith('ticket:')) {
    const id = s.slice(7);
    return id.length > 12 ? `Ticket …${id.slice(-8)}` : `Ticket ${id}`;
  }
  if (s.startsWith('pi_')) return `Stripe PI …${s.slice(-8)}`;
  if (s.startsWith('ch_')) return `Stripe charge …${s.slice(-8)}`;
  if (s.startsWith('ext-sale:')) return 'External sale';
  if (s.length > 24) return `…${s.slice(-12)}`;
  return s;
}

function shortUuid(id) {
  if (!id) return '—';
  const s = String(id);
  return s.length > 12 ? `${s.slice(0, 8)}…` : s;
}

function merchantDisplayName(row) {
  return row.merchant_legal_name || row.legal_name || shortUuid(row.platform_merchant_id);
}

function merchantSelectLabel(m) {
  const name = m.legal_name || 'Unnamed merchant';
  const region = m.region ? ` · ${String(m.region).toUpperCase()}` : '';
  return `${name}${region}`;
}

function settlementLabel(status) {
  const labels = {
    auto: 'Auto',
    pending_manual: 'Pending',
    settled: 'Settled',
    manual: 'Manual',
  };
  return labels[String(status || '').toLowerCase()] || status || '—';
}

function toDateOnlyString(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function formatPeriodDate(value) {
  const dateOnly = toDateOnlyString(value);
  if (!dateOnly) return '—';
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatStatementPeriod(start, end) {
  const from = formatPeriodDate(start);
  const to = formatPeriodDate(end);
  if (from === '—' || to === '—') return '—';
  return `${from} – ${to}`;
}

function statementStatusLabel(status) {
  const labels = { draft: 'Draft', finalized: 'Finalized' };
  return labels[String(status || '').toLowerCase()] || status || '—';
}

function statementStatusChipColor(status) {
  return String(status || '').toLowerCase() === 'finalized' ? 'success' : 'warning';
}

function statementSelectLabel(s) {
  const fees = statementFeesDueCents(s);
  const merchant = merchantDisplayName(s);
  const period = formatStatementPeriod(s.period_start, s.period_end);
  const status = statementStatusLabel(s.status);
  return `${merchant} · ${period} · ${formatMoney(fees, s.currency)} fees · ${status}`;
}

function statementInvoiceBlockReason(s, invoicedStatementIds) {
  if (invoicedStatementIds.has(s.id)) return 'already invoiced';
  if (statementFeesDueCents(s) <= 0) return 'no platform fees on ledger for this period';
  if (String(s.status || '').toLowerCase() !== 'finalized') return 'not finalized';
  return null;
}

function invoiceStatusLabel(status) {
  const labels = { draft: 'Draft (internal)', sent: 'Sent', paid: 'Paid' };
  return labels[String(status || '').toLowerCase()] || status || '—';
}

function invoiceStatusChipColor(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'paid') return 'success';
  if (s === 'sent') return 'info';
  return 'default';
}

export default function AccountingAdminPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ledger, setLedger] = useState([]);
  const [recon, setRecon] = useState(null);
  const [kpi, setKpi] = useState(null);
  const [driftRows, setDriftRows] = useState([]);
  const [statements, setStatements] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [statementForm, setStatementForm] = useState(EMPTY_STATEMENT_FORM);
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE_FORM);
  const [invoiceDeliveryFilter, setInvoiceDeliveryFilter] = useState('all');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  const [creditNoteForm, setCreditNoteForm] = useState(EMPTY_CREDIT_NOTE_FORM);
  const [adjustmentForm, setAdjustmentForm] = useState(EMPTY_ADJUSTMENT_FORM);
  const [settlementForm, setSettlementForm] = useState(EMPTY_SETTLEMENT_FORM);
  const [merchantLedgerCurrencies, setMerchantLedgerCurrencies] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const invoiceQuery = new URLSearchParams();
      if (invoiceDeliveryFilter !== 'all') invoiceQuery.set('emailDeliveryStatus', invoiceDeliveryFilter);
      if (invoiceStatusFilter !== 'all') invoiceQuery.set('status', invoiceStatusFilter);
      const [ledgerRows, reconSummary, stmtRows, merchantRows, invRows, drift, kpiRes, cnRows] = await Promise.all([
        accountingFetch('ledger?limit=50'),
        accountingFetch('reconciliation/summary'),
        accountingFetch('statements'),
        accountingFetch('merchants'),
        accountingFetch(`invoices${invoiceQuery.toString() ? `?${invoiceQuery.toString()}` : ''}`),
        accountingFetch('reconciliation/drift?grouped=true&limit=100'),
        accountingFetch('kpi/platform-fees'),
        accountingFetch('credit-notes?limit=50'),
      ]);
      setLedger(Array.isArray(ledgerRows) ? ledgerRows : []);
      setRecon(reconSummary);
      setStatements(Array.isArray(stmtRows) ? stmtRows : []);
      setMerchants(Array.isArray(merchantRows) ? merchantRows : []);
      setInvoices(Array.isArray(invRows) ? invRows : []);
      setDriftRows(Array.isArray(drift) ? drift : []);
      setKpi(kpiRes || null);
      setCreditNotes(Array.isArray(cnRows) ? cnRows : []);
    } catch (err) {
      setError(err.message || 'Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  }, [invoiceDeliveryFilter, invoiceStatusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMerchantLedgerCurrencies = async (platformMerchantId) => {
    if (!platformMerchantId) {
      setMerchantLedgerCurrencies([]);
      return [];
    }
    try {
      const res = await accountingFetch(`merchants/${platformMerchantId}/ledger-currencies`);
      const currencies = Array.isArray(res?.currencies) ? res.currencies : [];
      setMerchantLedgerCurrencies(currencies);
      return currencies;
    } catch {
      setMerchantLedgerCurrencies([]);
      return [];
    }
  };

  const runReconciliation = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await accountingFetch('reconciliation/run', { method: 'POST' });
      await load();
      setSuccess('Reconciliation run completed.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const runAction = async (action, successMessage) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await action();
      await load();
      if (successMessage != null) {
        setSuccess(successMessage);
      } else if (typeof result === 'string' && result) {
        setSuccess(result);
      }
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openInvoicePdf = async (invoiceId) => {
    setActionLoading(true);
    setError('');
    try {
      await openAccountingPdf(`invoices/${invoiceId}/pdf`);
    } catch (err) {
      setError(err.message || 'Failed to open PDF');
    } finally {
      setActionLoading(false);
    }
  };

  const updateForm = (setter, key) => (event) => {
    const value = event.target.value;
    setter((prev) => ({ ...prev, [key]: value }));
  };

  if (loading && !ledger.length) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  const invoicedStatementIds = new Set(invoices.map((inv) => inv.statement_id).filter(Boolean));
  const selectedStatement = statements.find((s) => s.id === invoiceForm.statementId) || null;
  const statementsWithFees = statements.filter((s) => statementFeesDueCents(s) > 0);
  const invoiceableStatements = statements.filter((s) => !statementInvoiceBlockReason(s, invoicedStatementIds));
  const statementsForPicker = [...statements].sort(
    (a, b) => new Date(b.period_start) - new Date(a.period_start)
  );

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Accounting</Typography>
        <Button variant="contained" onClick={runReconciliation} disabled={loading || actionLoading}>
          Run Stripe reconciliation
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {recon && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">Reconciliation</Typography>
            <Typography variant="body2">
              Open drift: {recon.openDriftGroups ?? recon.open_drift_groups ?? 0} issue{(recon.openDriftGroups ?? recon.open_drift_groups ?? 0) === 1 ? '' : 's'}
              {(recon.openDrift ?? recon.open_drift ?? 0) > (recon.openDriftGroups ?? recon.open_drift_groups ?? 0)
                ? ` (${recon.openDrift ?? recon.open_drift} rows)`
                : ''}
              {' · '}
              Critical: {recon.openCriticalDrift ?? recon.openCritical ?? recon.open_critical ?? 0}
              {' · '}
              Runs: {recon.totalRuns ?? recon.total_runs ?? 0}
            </Typography>
            {kpi && (
              <Typography variant="caption" color="text.secondary">
                {kpi.goLiveDate
                  ? `Platform fees after cutover: ${(Number(kpi.afterGoLivePlatformFeesCents || 0) / 100).toFixed(2)} · before cutover: ${(Number(kpi.beforeGoLivePlatformFeesCents || 0) / 100).toFixed(2)}`
                  : `Platform fees total (no cutover date configured): ${(Number(kpi.afterGoLivePlatformFeesCents || 0) / 100).toFixed(2)}`}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Ledger" />
        <Tab label="Statements" />
        <Tab label="Invoices" />
        <Tab label="Operations" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent>
            {ledger.length === 0 ? (
              <Typography color="text.secondary">No ledger entries yet.</Typography>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Recent ticket payments, refunds, and adjustments — newest first.
                </Typography>
                <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Merchant</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell align="right">Gross</TableCell>
                        <TableCell align="right">Platform fee</TableCell>
                        <TableCell>Reference</TableCell>
                        <TableCell>Settlement</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ledger.slice(0, 50).map((row) => {
                        const gross = Number(row.gross_cents || 0);
                        const fee = Number(row.platform_fee_cents || 0) - Number(row.platform_fee_reversed_cents || 0);
                        return (
                          <TableRow key={row.id} hover>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Tooltip title={row.occurred_at || ''}>
                                <span>{formatLedgerDate(row.occurred_at)}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={entryTypeLabel(row.entry_type)}
                                color={entryTypeChipColor(row.entry_type)}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title={row.platform_merchant_id || ''}>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                                  {merchantDisplayName(row)}
                                </Typography>
                              </Tooltip>
                              {row.merchant_region && (
                                <Typography variant="caption" color="text.secondary">
                                  {String(row.merchant_region).toUpperCase()}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={paymentMethodLabel(row.payment_method)} variant="outlined" />
                            </TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: gross < 0 ? 'error.main' : 'inherit' }}>
                              {formatMoney(gross, row.currency)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: fee > 0 ? 'success.main' : 'text.secondary' }}>
                              {fee > 0 ? formatMoney(fee, row.currency) : '—'}
                            </TableCell>
                            <TableCell>
                              <Tooltip title={[row.external_ref, row.ticket_id && `Ticket ID: ${row.ticket_id}`, row.event_id && `Event: ${row.event_id}`].filter(Boolean).join(' · ')}>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                                  {formatExternalRef(row.external_ref)}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={settlementLabel(row.settlement_status)}
                                variant={row.settlement_status === 'pending_manual' ? 'filled' : 'outlined'}
                                color={row.settlement_status === 'settled' ? 'success' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={1}>Generate statement</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Select a merchant and billing period to generate a draft statement.
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap">
                <TextField
                  select
                  label="Merchant"
                  value={statementForm.platformMerchantId}
                  onChange={async (event) => {
                    const id = event.target.value;
                    const m = merchants.find((row) => row.platform_merchant_id === id);
                    const currencies = id ? await loadMerchantLedgerCurrencies(id) : [];
                    setStatementForm((prev) => ({
                      ...prev,
                      platformMerchantId: id,
                      timezone: m?.timezone || prev.timezone,
                      currency: currencies[0] || '',
                    }));
                  }}
                  size="small"
                  sx={{ minWidth: { xs: '100%', md: 280 } }}
                  helperText={
                    merchants.length === 0
                      ? 'No merchants synced yet — FAS merchant sync job runs on startup'
                      : `${merchants.length} merchants in accounting DB`
                  }
                >
                  <MenuItem value="">
                    <em>Select merchant…</em>
                  </MenuItem>
                  {merchants.map((m) => (
                    <MenuItem key={m.platform_merchant_id} value={m.platform_merchant_id}>
                      {merchantSelectLabel(m)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Currency"
                  value={statementForm.currency}
                  onChange={updateForm(setStatementForm, 'currency')}
                  size="small"
                  sx={{ width: 120 }}
                  disabled={!statementForm.platformMerchantId}
                  helperText={
                    !statementForm.platformMerchantId
                      ? 'Select a merchant first'
                      : merchantLedgerCurrencies.length > 0
                        ? `From ledger: ${merchantLedgerCurrencies.map((c) => c.toUpperCase()).join(', ')}`
                        : 'No ledger activity for this merchant yet'
                  }
                >
                  {merchantLedgerCurrencies.length === 0 ? (
                    <MenuItem value="">
                      <em>No currencies</em>
                    </MenuItem>
                  ) : (
                    merchantLedgerCurrencies.map((currency) => (
                      <MenuItem key={currency} value={currency}>
                        {currency.toUpperCase()}
                      </MenuItem>
                    ))
                  )}
                </TextField>
                <TextField type="date" label="Period start" value={statementForm.periodStart} onChange={updateForm(setStatementForm, 'periodStart')} size="small" InputLabelProps={{ shrink: true }} />
                <TextField
                  type="date"
                  label="Period end"
                  value={statementForm.periodEnd}
                  onChange={updateForm(setStatementForm, 'periodEnd')}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  helperText="Inclusive"
                />
                <TextField label="Timezone" value={statementForm.timezone} onChange={updateForm(setStatementForm, 'timezone')} size="small" sx={{ width: 180 }} />
                <FormControlLabel
                  control={(
                    <Checkbox
                      checked={Boolean(statementForm.force)}
                      onChange={(event) => setStatementForm((prev) => ({ ...prev, force: event.target.checked }))}
                    />
                  )}
                  label="Force (ignore open critical drift)"
                />
              </Stack>
              <Box mt={1.5}>
                <Button
                  variant="contained"
                  disabled={actionLoading || !statementForm.platformMerchantId || !statementForm.currency}
                  onClick={() => runAction(
                    () => accountingFetch('statements/generate', {
                      method: 'POST',
                      body: JSON.stringify(statementForm),
                    }),
                    'Statement generated.'
                  )}
                >
                  Generate
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              {statements.length === 0 ? (
                <Typography color="text.secondary">No statements yet.</Typography>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Monthly merchant summaries — gross sales, refunds, and platform fees for each period.
                    {' '}<strong>Use for invoice</strong> needs platform fees &gt; €0 (finalized alone is not enough).
                  </Typography>
                  <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Period</TableCell>
                          <TableCell>Merchant</TableCell>
                          <TableCell>Currency</TableCell>
                          <TableCell align="right">Gross</TableCell>
                          <TableCell align="right">Refunds</TableCell>
                          <TableCell align="right">Platform fees</TableCell>
                          <TableCell align="right">Net</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {statements.map((s) => {
                          const feesDue = statementFeesDueCents(s);
                          const canInvoice = feesDue > 0;
                          const hasInvoice = invoicedStatementIds.has(s.id);
                          return (
                            <TableRow key={s.id} hover>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Tooltip title={`Statement ${s.id}`}>
                                  <Typography variant="body2">
                                    {formatStatementPeriod(s.period_start, s.period_end)}
                                  </Typography>
                                </Tooltip>
                                {s.timezone && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {s.timezone}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Tooltip title={s.platform_merchant_id || ''}>
                                  <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                                    {merchantDisplayName(s)}
                                  </Typography>
                                </Tooltip>
                                {s.merchant_region && (
                                  <Typography variant="caption" color="text.secondary">
                                    {String(s.merchant_region).toUpperCase()}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>{String(s.currency || 'eur').toUpperCase()}</TableCell>
                              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatMoney(s.gross_cents, s.currency)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: Number(s.refund_cents) > 0 ? 'warning.main' : 'text.secondary' }}>
                                {Number(s.refund_cents) > 0 ? formatMoney(s.refund_cents, s.currency) : '—'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: feesDue > 0 ? 'success.main' : 'text.secondary' }}>
                                {feesDue > 0 ? formatMoney(feesDue, s.currency) : '—'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatMoney(s.net_cents, s.currency)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={statementStatusLabel(s.status)}
                                  color={statementStatusChipColor(s.status)}
                                  variant="outlined"
                                />
                                {s.finalized_at && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {formatLedgerDate(s.finalized_at)}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                                  {s.status !== 'finalized' && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={actionLoading}
                                      onClick={() => runAction(
                                        () => accountingFetch(`statements/${s.id}/finalize`, { method: 'POST' }),
                                        'Statement finalized.'
                                      )}
                                    >
                                      Finalize
                                    </Button>
                                  )}
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={actionLoading || !canInvoice}
                                    title={
                                      canInvoice
                                        ? 'Create an invoice for platform fees on this statement'
                                        : `Cannot invoice: platform fees are ${formatMoney(feesDue, s.currency)} (need > 0). Finalized status does not matter — fees come from Stripe Connect / Paytrail commission on ledger entries.`
                                    }
                                    onClick={() => {
                                      if (!canInvoice) return;
                                      setInvoiceForm((prev) => ({ ...prev, statementId: s.id }));
                                      setTab(2);
                                      setError('');
                                      setSuccess(`Statement selected (${formatStatementPeriod(s.period_start, s.period_end)}). Review and create the invoice below.`);
                                    }}
                                  >
                                    Use for invoice
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    disabled={actionLoading || hasInvoice}
                                    title={
                                      hasInvoice
                                        ? 'Cannot delete: an invoice is linked to this statement'
                                        : 'Delete this statement (line items are removed; ledger entries are kept)'
                                    }
                                    onClick={() => {
                                      if (hasInvoice) return;
                                      const period = formatStatementPeriod(s.period_start, s.period_end);
                                      if (!window.confirm(`Delete statement for ${period} (${merchantDisplayName(s)})? This cannot be undone.`)) {
                                        return;
                                      }
                                      runAction(async () => {
                                        await accountingFetch(`statements/${s.id}`, { method: 'DELETE' });
                                        if (invoiceForm.statementId === s.id) {
                                          setInvoiceForm((prev) => ({ ...prev, statementId: '' }));
                                        }
                                      }, 'Statement deleted.');
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Paper>
                </>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {tab === 2 && (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={1}>Create invoice from statement</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Invoices bill <strong>platform fees only</strong> — not gross ticket sales. A finalized statement with €0 fees cannot be invoiced yet.
              </Typography>
              {statements.length > 0 && invoiceableStatements.length === 0 && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  You have {statements.length} statement{statements.length === 1 ? '' : 's'} (including finalized), but{' '}
                  <strong>none have platform fees &gt; €0</strong> on the ledger. The dropdown lists them as disabled until fees are recorded
                  (new Stripe/Paytrail payments with commission, or a ledger fee backfill).
                </Alert>
              )}
              {selectedStatement && (
                <Alert
                  severity={statementInvoiceBlockReason(selectedStatement, invoicedStatementIds) ? 'warning' : 'info'}
                  sx={{ mb: 1.5 }}
                >
                  {statementInvoiceBlockReason(selectedStatement, invoicedStatementIds) ? (
                    <>
                      <strong>{merchantDisplayName(selectedStatement)}</strong> ·{' '}
                      {formatStatementPeriod(selectedStatement.period_start, selectedStatement.period_end)} —{' '}
                      cannot invoice: {statementInvoiceBlockReason(selectedStatement, invoicedStatementIds)}.
                    </>
                  ) : (
                    <>
                      Billing <strong>{merchantDisplayName(selectedStatement)}</strong> for{' '}
                      <strong>{formatStatementPeriod(selectedStatement.period_start, selectedStatement.period_end)}</strong>
                      {' '}· platform fees{' '}
                      <strong>{formatMoney(statementFeesDueCents(selectedStatement), selectedStatement.currency)}</strong>
                    </>
                  )}
                </Alert>
              )}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'flex-start' }}>
                <TextField
                  select
                  label="Statement"
                  value={invoiceForm.statementId}
                  onChange={(event) => setInvoiceForm((prev) => ({ ...prev, statementId: event.target.value }))}
                  size="small"
                  sx={{ minWidth: { xs: '100%', md: 360 } }}
                  helperText={
                    statements.length === 0
                      ? 'No statements yet — generate one on the Statements tab'
                      : invoiceableStatements.length === 0
                        ? `${statements.length} statement(s) exist but none are billable yet (see warning above)`
                        : `${invoiceableStatements.length} billable · ${statements.length - invoiceableStatements.length} disabled`
                  }
                >
                  <MenuItem value="">
                    <em>Select a statement…</em>
                  </MenuItem>
                  {statementsForPicker.map((s) => {
                    const blockReason = statementInvoiceBlockReason(s, invoicedStatementIds);
                    return (
                      <MenuItem key={s.id} value={s.id} disabled={Boolean(blockReason)}>
                        {statementSelectLabel(s)}{blockReason ? ` · ${blockReason}` : ''}
                      </MenuItem>
                    );
                  })}
                </TextField>
                <TextField type="date" label="Due date" value={invoiceForm.dueDate} onChange={updateForm(setInvoiceForm, 'dueDate')} size="small" InputLabelProps={{ shrink: true }} />
                <FormControlLabel
                  control={(
                    <Checkbox
                      checked={Boolean(invoiceForm.reverseVat)}
                      onChange={(event) => setInvoiceForm((prev) => ({ ...prev, reverseVat: event.target.checked }))}
                    />
                  )}
                  label="Reverse VAT (0%)"
                />
                <Button
                  variant="contained"
                  disabled={
                    actionLoading
                    || !invoiceForm.statementId
                    || Boolean(statementInvoiceBlockReason(selectedStatement, invoicedStatementIds))
                  }
                  onClick={() => runAction(
                    () => accountingFetch('invoices', {
                      method: 'POST',
                      body: JSON.stringify({
                        statementId: invoiceForm.statementId,
                        dueDate: invoiceForm.dueDate || null,
                        reverseVat: Boolean(invoiceForm.reverseVat),
                        vatRate: invoiceForm.reverseVat ? 0 : null,
                      }),
                    }),
                    'Invoice created.'
                  )}
                >
                  Create invoice
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" mb={1}>Issue credit note</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} mb={2}>
                <TextField label="Invoice id" value={creditNoteForm.invoiceId} onChange={updateForm(setCreditNoteForm, 'invoiceId')} size="small" />
                <TextField label="Amount (cents)" value={creditNoteForm.amountCents} onChange={updateForm(setCreditNoteForm, 'amountCents')} size="small" />
                <TextField label="Reason code" value={creditNoteForm.reasonCode} onChange={updateForm(setCreditNoteForm, 'reasonCode')} size="small" />
                <TextField label="Reason note" value={creditNoteForm.reasonNote} onChange={updateForm(setCreditNoteForm, 'reasonNote')} size="small" />
                <Button
                  variant="contained"
                  disabled={actionLoading || !creditNoteForm.invoiceId || !creditNoteForm.amountCents || !creditNoteForm.reasonCode}
                  onClick={() => runAction(
                    () => accountingFetch('credit-notes', {
                      method: 'POST',
                      body: JSON.stringify({
                        invoiceId: creditNoteForm.invoiceId,
                        amountCents: Number(creditNoteForm.amountCents),
                        reasonCode: creditNoteForm.reasonCode,
                        reasonNote: creditNoteForm.reasonNote || null,
                      }),
                    }),
                    'Credit note issued.'
                  )}
                >
                  Issue credit note
                </Button>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} mb={1.5} spacing={1}>
                <Typography variant="h6">Invoices</Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                  <TextField
                    select
                    size="small"
                    label="Invoice status"
                    value={invoiceStatusFilter}
                    onChange={(event) => setInvoiceStatusFilter(event.target.value)}
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value="all">all</MenuItem>
                    <MenuItem value="draft">draft</MenuItem>
                    <MenuItem value="sent">sent</MenuItem>
                    <MenuItem value="paid">paid</MenuItem>
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="Email delivery"
                    value={invoiceDeliveryFilter}
                    onChange={(event) => setInvoiceDeliveryFilter(event.target.value)}
                    sx={{ minWidth: 220 }}
                  >
                    <MenuItem value="all">all</MenuItem>
                    <MenuItem value="not_sent">not_sent</MenuItem>
                    <MenuItem value="sent">sent</MenuItem>
                    <MenuItem value="failed">failed</MenuItem>
                    <MenuItem value="skipped">skipped</MenuItem>
                  </TextField>
                </Stack>
              </Stack>
              {invoices.length === 0 ? (
                <Typography color="text.secondary">No invoices yet.</Typography>
              ) : (
                <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice</TableCell>
                        <TableCell>Statement</TableCell>
                        <TableCell>Merchant</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow key={inv.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {inv.invoice_number || shortUuid(inv.id)}
                            </Typography>
                            <Tooltip title={inv.id}>
                              <Typography variant="caption" color="text.secondary">
                                {formatLedgerDate(inv.created_at)}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {inv.statement_id ? (
                              <Tooltip title={`Statement ID: ${inv.statement_id}`}>
                                <Typography variant="body2">
                                  {inv.statement_period_start
                                    ? formatStatementPeriod(inv.statement_period_start, inv.statement_period_end)
                                    : shortUuid(inv.statement_id)}
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                              {inv.merchant_legal_name || shortUuid(inv.platform_merchant_id)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatMoney(inv.amount_inc_vat_cents, inv.currency)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={invoiceStatusLabel(inv.status)}
                              color={invoiceStatusChipColor(inv.status)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {inv.email_delivery_status || 'not_sent'}
                              {inv.email_delivered_to ? ` → ${inv.email_delivered_to}` : ''}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                              {String(inv.status || '').toLowerCase() !== 'paid' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  disabled={actionLoading}
                                  title="Delete this invoice (linked credit notes are removed; statements are kept)"
                                  onClick={() => {
                                    const label = inv.invoice_number || inv.id;
                                    if (!window.confirm(`Delete invoice ${label}? This cannot be undone.`)) {
                                      return;
                                    }
                                    runAction(async () => {
                                      await accountingFetch(`invoices/${inv.id}`, { method: 'DELETE' });
                                      if (creditNoteForm.invoiceId === inv.id) {
                                        setCreditNoteForm((prev) => ({ ...prev, invoiceId: '' }));
                                      }
                                    }, 'Invoice deleted.');
                                  }}
                                >
                                  Delete
                                </Button>
                              )}
                              {inv.status === 'draft' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={actionLoading}
                                  onClick={() => runAction(
                                    () => accountingFetch(`invoices/${inv.id}/send`, { method: 'PATCH' }),
                                    'Invoice marked as sent.'
                                  )}
                                >
                                  Mark sent
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={actionLoading}
                                onClick={() => openInvoicePdf(inv.id)}
                              >
                                PDF
                              </Button>
                              {inv.status !== 'paid' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={actionLoading}
                                  onClick={() => runAction(
                                    () => accountingFetch(`invoices/${inv.id}/paid`, { method: 'PATCH' }),
                                    'Invoice marked as paid.'
                                  )}
                                >
                                  Mark paid
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" mb={1}>Recent credit notes</Typography>
              {creditNotes.length === 0 ? (
                <Typography color="text.secondary">No credit notes yet.</Typography>
              ) : (
                creditNotes.map((cn) => (
                  <Box key={cn.id} py={1} borderBottom="1px solid #eee">
                    <Typography variant="body2">
                      {cn.credit_note_number || cn.id} · invoice: {cn.invoice_id} · {(Number(cn.amount_cents || 0) / 100).toFixed(2)} {cn.currency} · {cn.status}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      reason: {cn.reason_code}{cn.reason_note ? ` · ${cn.reason_note}` : ''}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {tab === 3 && (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={1}>Manual adjustment</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap">
                <Autocomplete
                  options={merchants}
                  getOptionLabel={(m) => m.legal_name || 'Unnamed'}
                  value={merchants.find((m) => m.platform_merchant_id === adjustmentForm.platformMerchantId) || null}
                  onChange={(_, merchant) => {
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      platformMerchantId: merchant?.platform_merchant_id || '',
                    }));
                  }}
                  renderInput={(params) => <TextField {...params} label="Merchant" size="small" />}
                  noOptionsText="No merchants found"
                  isOptionEqualToValue={(opt, val) => opt.platform_merchant_id === val.platform_merchant_id}
                  sx={{ minWidth: '200px' }}
                />
                <TextField select label="Type" value={adjustmentForm.adjustmentType} onChange={updateForm(setAdjustmentForm, 'adjustmentType')} size="small">
                  <MenuItem value="correction">correction</MenuItem>
                  <MenuItem value="refund">refund</MenuItem>
                  <MenuItem value="fee_correction">fee_correction</MenuItem>
                </TextField>
                <TextField label="Reason code" value={adjustmentForm.reasonCode} onChange={updateForm(setAdjustmentForm, 'reasonCode')} size="small" />
                <TextField label="Amount (cents)" value={adjustmentForm.amountCents} onChange={updateForm(setAdjustmentForm, 'amountCents')} size="small" />
                <TextField label="Currency" value={adjustmentForm.currency} onChange={updateForm(setAdjustmentForm, 'currency')} size="small" />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} mt={1.5}>
                <TextField label="Linked external ref (optional)" value={adjustmentForm.linkedExternalRef} onChange={updateForm(setAdjustmentForm, 'linkedExternalRef')} size="small" fullWidth />
                <TextField label="Reason note" value={adjustmentForm.reasonNote} onChange={updateForm(setAdjustmentForm, 'reasonNote')} size="small" fullWidth />
              </Stack>
              <Box mt={1.5}>
                <Button
                  variant="contained"
                  disabled={actionLoading || !adjustmentForm.platformMerchantId || !adjustmentForm.reasonCode || !adjustmentForm.amountCents}
                  onClick={() => runAction(
                    () => accountingFetch('adjustments', {
                      method: 'POST',
                      body: JSON.stringify({
                        ...adjustmentForm,
                        amountCents: Number(adjustmentForm.amountCents),
                      }),
                    }),
                    'Manual adjustment created.'
                  )}
                >
                  Create adjustment
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" mb={1}>Nabil settlement</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField label="Ledger entry id" value={settlementForm.ledgerEntryId} onChange={updateForm(setSettlementForm, 'ledgerEntryId')} size="small" fullWidth />
                <TextField label="Settlement reference" value={settlementForm.settlementReference} onChange={updateForm(setSettlementForm, 'settlementReference')} size="small" fullWidth />
                <Button
                  variant="contained"
                  disabled={actionLoading || !settlementForm.ledgerEntryId || !settlementForm.settlementReference}
                  onClick={() => runAction(
                    () => accountingFetch('nabil/settle', {
                      method: 'POST',
                      body: JSON.stringify(settlementForm),
                    }),
                    'Nabil settlement marked as settled.'
                  )}
                >
                  Mark settled
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Open reconciliation drift</Typography>
                <Button size="small" onClick={load} disabled={loading || actionLoading}>Refresh</Button>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {driftRows.length === 0 ? (
                <Typography color="text.secondary">No open drift rows.</Typography>
              ) : (
                driftRows.map((d) => (
                  <Box key={`${d.external_ref || d.id}-${d.drift_type}`} py={1} borderBottom="1px solid #eee">
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                      <Box>
                        <Stack direction="row" spacing={1} mb={0.5} flexWrap="wrap" useFlexGap>
                          <Chip label={d.severity} size="small" color={d.severity === 'critical' ? 'error' : 'warning'} />
                          <Chip label={d.drift_type || 'drift'} size="small" variant="outlined" />
                          {Number(d.row_count || 0) > 1 && (
                            <Chip label={`${d.row_count} duplicate rows`} size="small" variant="outlined" color="default" />
                          )}
                        </Stack>
                        <Typography variant="body2">
                          {d.external_ref || 'no-ref'} · ledger: {d.ledger_cents ?? 'n/a'} · stripe: {d.stripe_cents ?? 'n/a'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {d.message}
                        </Typography>
                      </Box>
                      {!d.resolved && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={actionLoading}
                          onClick={() => runAction(async () => {
                            const result = await accountingFetch(`reconciliation/drift/${d.id}/resolve`, { method: 'PATCH' });
                            const count = Number(result?.resolvedCount || 1);
                            return count > 1
                              ? `Resolved ${count} duplicate drift rows for ${d.external_ref || 'this issue'}.`
                              : 'Drift row marked as resolved.';
                          })}
                        >
                          Resolve
                        </Button>
                      )}
                    </Stack>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
