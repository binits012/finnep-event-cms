"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useDashboardSummary, setLastViewedNow } from "@/hooks/useDashboardSummary";
import {
  PRESET_REVENUE,
  getPresetDefinition,
  listPresets,
  loadDismissedAttentionIds,
  loadStoredPreset,
  saveDismissedAttentionIds,
  savePreset,
} from "./dashboardPresets";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

function parseJwtRole(token) {
  if (!token || typeof window === "undefined") return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    const p = JSON.parse(jsonPayload);
    return p.role || null;
  } catch {
    return null;
  }
}

function formatMoney(value, currency = "EUR") {
  if (value == null || Number.isNaN(Number(value))) return "—";
  try {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return String(value);
  }
}

function sentimentIcon(sentiment) {
  if (sentiment === "positive") return <TrendingUpIcon color="success" fontSize="small" />;
  if (sentiment === "watch") return <TrendingDownIcon color="warning" fontSize="small" />;
  return <TrendingFlatIcon color="action" fontSize="small" />;
}

export default function DashboardPage() {
  const [presetId, setPresetId] = useState(PRESET_REVENUE);
  const [dismissed, setDismissed] = useState([]);
  const [rangeMode, setRangeMode] = useState("rolling");
  const [customFrom, setCustomFrom] = useState(() => dayjs().subtract(7, "day"));
  const [customTo, setCustomTo] = useState(() => dayjs());

  useEffect(() => {
    setPresetId(loadStoredPreset());
    setDismissed(loadDismissedAttentionIds());
  }, []);

  useEffect(() => {
    return () => {
      setLastViewedNow();
    };
  }, []);

  const { rangeFromIso, rangeToIso, rangeValid } = useMemo(() => {
    const now = new Date();
    if (rangeMode === "rolling") {
      return { rangeFromIso: undefined, rangeToIso: undefined, rangeValid: true };
    }
    if (rangeMode === "7d") {
      return {
        rangeFromIso: new Date(now.getTime() - 7 * 86400000).toISOString(),
        rangeToIso: now.toISOString(),
        rangeValid: true,
      };
    }
    if (rangeMode === "30d") {
      return {
        rangeFromIso: new Date(now.getTime() - 30 * 86400000).toISOString(),
        rangeToIso: now.toISOString(),
        rangeValid: true,
      };
    }
    if (rangeMode === "custom" && customFrom && customTo) {
      if (customFrom.isAfter(customTo, "day")) {
        return { rangeFromIso: undefined, rangeToIso: undefined, rangeValid: false };
      }
      return {
        rangeFromIso: customFrom.startOf("day").toISOString(),
        rangeToIso: customTo.endOf("day").toISOString(),
        rangeValid: true,
      };
    }
    return { rangeFromIso: undefined, rangeToIso: undefined, rangeValid: false };
  }, [rangeMode, customFrom, customTo]);

  const preset = useMemo(() => getPresetDefinition(presetId), [presetId]);
  const { data, loading, refreshing, error, refreshedAt, refresh } = useDashboardSummary({
    include: preset.include,
    sendSince: true,
    from: rangeFromIso,
    to: rangeToIso,
    pollMs: 60000,
    enabled: rangeValid,
  });

  const periodShortLabel = useMemo(() => {
    const mode = data?.exportMeta?.reportRange?.mode;
    if (!mode || mode === "rolling24h") return "24h";
    return "period";
  }, [data]);

  /** Labels for KPI cards: revenue-first copy stays accurate for rolling vs custom ranges. */
  const kpiScope = useMemo(() => {
    if (data?.exportMeta?.reportRange?.mode === "rolling24h") return "last 24h";
    if (data?.exportMeta?.reportRange) return "reporting range";
    return rangeMode === "rolling" ? "last 24h" : "reporting range";
  }, [data, rangeMode]);

  const pulseGranularity = data?.pulse?.granularity || data?.exportMeta?.reportRange?.pulseGranularity || "hour";

  const adminRole = useMemo(() => {
    if (typeof window === "undefined") return false;
    const t = localStorage.getItem("accessToken");
    const r = parseJwtRole(t);
    return r === "admin" || r === "superAdmin";
  }, []);

  const handlePresetChange = (_e, v) => {
    if (!v) return;
    setPresetId(v);
    savePreset(v);
  };

  const dismissAttention = useCallback(
    (id) => {
      const next = [...new Set([...dismissed, id])];
      setDismissed(next);
      saveDismissedAttentionIds(next);
    },
    [dismissed]
  );

  const copyStory = useCallback(() => {
    if (!data) return;
    const lines = [];
    lines.push(`# Dashboard snapshot`);
    if (data.exportMeta?.generatedAt) lines.push(`Generated: ${data.exportMeta.generatedAt}`);
    if (data.brief?.headline) lines.push(`\n## Brief\n${data.brief.headline}`);
    const rr = data.exportMeta?.reportRange;
    if (rr?.from && rr?.to) {
      lines.push(`\n## Period\n${rr.from} → ${rr.to} (UTC)`);
    }
    if (data.revenue) {
      lines.push(
        `\n## Revenue\nCurrent: ${formatMoney(data.revenue.last24h)} (prior period: ${formatMoney(data.revenue.prior24h)})`
      );
    }
    if (data.kpis) {
      lines.push(`\n## KPIs`);
      const k = data.kpis;
      if (k.grossPaidRevenue24h) {
        lines.push(`Gross paid revenue (${kpiScope}): ${formatMoney(k.grossPaidRevenue24h.value)}`);
      }
      if (k.paidOrders24h) lines.push(`Paid orders (${kpiScope}): ${k.paidOrders24h.value}`);
      if (k.ticketsIssued24h) lines.push(`Tickets issued (${kpiScope}): ${k.ticketsIssued24h.value}`);
    }
    navigator.clipboard.writeText(lines.join("\n"));
  }, [data, kpiScope]);

  const visibleAttention = useMemo(() => {
    const list = data?.attention || [];
    return list.filter((a) => !dismissed.includes(a.id));
  }, [data, dismissed]);

  const pulseChartData = useMemo(() => {
    const labels = data?.pulse?.ticketsByHour?.labels || [];
    const tickets = data?.pulse?.ticketsByHour?.values || [];
    const revenue = data?.pulse?.revenueByHour?.values || [];
    const bench = data?.pulse?.benchmarkTicketsPerHour7d;
    const primary = preset.pulsePrimary === "revenue" ? "revenue" : "tickets";

    const unit = pulseGranularity === "day" ? "day" : "hour";
    const datasets = [
      {
        label: primary === "revenue" ? `Paid revenue / ${unit}` : `Tickets issued / ${unit}`,
        data: primary === "revenue" ? revenue : tickets,
        borderColor: primary === "revenue" ? "#7c3aed" : "#0d9488",
        backgroundColor:
          primary === "revenue" ? "rgba(124, 58, 237, 0.15)" : "rgba(13, 148, 136, 0.15)",
        fill: true,
        tension: 0.25,
        yAxisID: "y",
      },
    ];
    if (primary === "revenue" && tickets.length) {
      datasets.push({
        label: `Tickets / ${unit}`,
        data: tickets,
        borderColor: "#94a3b8",
        backgroundColor: "transparent",
        fill: false,
        tension: 0.2,
        yAxisID: "y1",
      });
    }
    if (bench != null && primary !== "revenue") {
      datasets.push({
        label: "7d avg tickets/hour",
        data: labels.map(() => bench),
        borderColor: "#f59e0b",
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
        yAxisID: "y",
      });
    }
    return { labels, datasets };
  }, [data, preset.pulsePrimary, pulseGranularity]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text:
            preset.pulsePrimary === "revenue"
              ? `Sales activity — paid revenue by ${pulseGranularity} (UTC)`
              : `Sales activity — tickets issued by ${pulseGranularity} (UTC)`,
        },
      },
      scales: {
        y: {
          type: "linear",
          display: true,
          position: "left",
        },
        y1: {
          type: "linear",
          display: preset.pulsePrimary === "revenue",
          position: "right",
          grid: { drawOnChartArea: false },
        },
      },
    }),
    [preset.pulsePrimary, pulseGranularity]
  );

  const widgetSet = useMemo(() => new Set(preset.widgetOrder), [preset.widgetOrder]);

  const show = (id) => widgetSet.has(id);

  const apiErrorMsg =
    error?.response?.data?.message || error?.message || "Could not load dashboard summary.";

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ pb: 4 }}>
        <CustomBreadcrumbs
          title="Dashboard"
          links={[{ path: "/dashboard", title: "Dashboard", active: true }]}
        />

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Report period
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            Revenue-first metrics use the window below (UTC). Compare period is the same length immediately
            before your start.
          </Typography>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ lg: "center" }} flexWrap="wrap">
            <ToggleButtonGroup
              exclusive
              size="small"
              value={rangeMode}
              onChange={(_e, v) => v && setRangeMode(v)}
              color="primary"
            >
              <ToggleButton value="rolling">Rolling 24h</ToggleButton>
              <ToggleButton value="7d">Last 7 days</ToggleButton>
              <ToggleButton value="30d">Last 30 days</ToggleButton>
              <ToggleButton value="custom">Custom range</ToggleButton>
            </ToggleButtonGroup>
            {rangeMode === "custom" && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                <DatePicker
                  label="From"
                  value={customFrom}
                  onChange={(v) => setCustomFrom(v)}
                  slotProps={{ textField: { size: "small" } }}
                />
                <DatePicker
                  label="To"
                  value={customTo}
                  onChange={(v) => setCustomTo(v)}
                  slotProps={{ textField: { size: "small" } }}
                />
              </Stack>
            )}
          </Stack>
          {data?.exportMeta?.reportRange && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
              Active window: {data.exportMeta.reportRange.from} → {data.exportMeta.reportRange.to} ·
              granularity: {data.exportMeta.reportRange.pulseGranularity}
            </Typography>
          )}
        </Paper>

        {!rangeValid && rangeMode === "custom" && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Choose a valid range: &quot;From&quot; must be on or before &quot;To&quot;.
          </Alert>
        )}

        {rangeValid && loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refresh()}>
                Retry
              </Button>
            }
          >
            {apiErrorMsg}
          </Alert>
        )}

        {!loading && !error && data && (
        <>
          {refreshing && (
            <LinearProgress
              sx={{ position: "sticky", top: 0, zIndex: 2, mb: 2 }}
              color="secondary"
            />
          )}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <ToggleButtonGroup
              exclusive
              value={presetId}
              onChange={handlePresetChange}
              size="small"
              color="primary"
            >
              {listPresets().map((p) => (
                <ToggleButton key={p.id} value={p.id}>
                  {p.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Stack direction="row" spacing={1} alignItems="center">
              {refreshedAt && (
                <Typography variant="caption" color="text.secondary">
                  Updated {new Date(refreshedAt).toLocaleTimeString()}
                </Typography>
              )}
              <Tooltip title="Refresh now">
                <IconButton onClick={() => refresh()} size="small" disabled={refreshing}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy brief + KPIs as Markdown">
                <IconButton onClick={copyStory} size="small">
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {preset.subtitle}
          </Typography>

          {adminRole && (
            <Paper
              variant="outlined"
              sx={{
                mb: 3,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                bgcolor: "action.hover",
              }}
            >
              <Typography variant="body2">
                Platform monitor (admin): detailed KPIs match backend monitor windows.
              </Typography>
              <Button
                component={Link}
                href="/admin/monitor"
                size="small"
                endIcon={<OpenInNewIcon fontSize="small" />}
              >
                Open monitor
              </Button>
            </Paper>
          )}

          {show("brief") && data.brief && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
                    : "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                {sentimentIcon(data.brief.sentiment)}
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Morning brief
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {data.brief.headline}
                  </Typography>
                  {(data.brief.bullets || []).length > 0 && (
                    <Box component="ul" sx={{ mt: 1.5, pl: 2, mb: 0 }}>
                      {data.brief.bullets.map((b, i) => (
                        <li key={i}>
                          <Typography variant="body2">{b}</Typography>
                        </li>
                      ))}
                    </Box>
                  )}
                </Box>
              </Stack>
            </Paper>
          )}

          <Grid container spacing={2}>
            {show("pulse") && data.pulse && (data.pulse.ticketsByHour?.labels || []).length > 0 && (
              <Grid item xs={12} lg={8}>
                <Card variant="outlined">
                  <CardContent>
                    <Line data={pulseChartData} options={chartOptions} />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      {data.exportMeta?.revenueNote || ""}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {show("attention") && visibleAttention.length > 0 && (
              <Grid item xs={12} lg={show("pulse") ? 4 : 12}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Needs attention
                    </Typography>
                    <Stack spacing={1.5}>
                      {visibleAttention.map((item) => (
                        <Paper
                          key={item.id}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderLeft: 4,
                            borderColor:
                              item.severity === "critical"
                                ? "error.main"
                                : item.severity === "warning"
                                  ? "warning.main"
                                  : "info.main",
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle2">{item.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.detail}
                              </Typography>
                              {item.hrefSuggestion && (
                                <Button
                                  component={Link}
                                  href={item.hrefSuggestion}
                                  size="small"
                                  sx={{ mt: 1 }}
                                >
                                  Open
                                </Button>
                              )}
                            </Box>
                            <IconButton size="small" onClick={() => dismissAttention(item.id)} aria-label="Dismiss">
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {show("kpis") && data.kpis && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Key metrics
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(5, minmax(0, 1fr))",
                    },
                  }}
                >
                  {data.kpis.grossPaidRevenue24h && (
                    <KpiCard
                      title={`Gross paid revenue (${kpiScope})`}
                      value={formatMoney(
                        data.kpis.grossPaidRevenue24h.value,
                        data.kpis.grossPaidRevenue24h.currency
                      )}
                      delta={data.kpis.grossPaidRevenue24h.priorDeltaPct}
                    />
                  )}
                  {data.kpis.paidOrders24h && (
                    <KpiCard title={`Paid orders (${kpiScope})`} value={String(data.kpis.paidOrders24h.value)} />
                  )}
                  {data.kpis.ticketsIssued24h && (
                    <KpiCard title={`Tickets issued (${kpiScope})`} value={String(data.kpis.ticketsIssued24h.value)} />
                  )}
                  {data.kpis.freeTickets24h && (
                    <KpiCard title={`Free tickets (${kpiScope})`} value={String(data.kpis.freeTickets24h.value)} />
                  )}
                  {data.kpis.admissions24h && (
                    <KpiCard title={`Admissions scanned (${kpiScope})`} value={String(data.kpis.admissions24h.value)} />
                  )}
                </Box>
              </Grid>
            )}

            {show("topEvents") && data.topEvents?.length > 0 && (
              <Grid item xs={12} md={7}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Top events ({kpiScope})
                    </Typography>
                    <Stack divider={<Divider flexItem />} spacing={1}>
                      {data.topEvents.map((ev) => (
                        <Stack
                          key={ev.eventId || ev.title}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box>
                            <Typography fontWeight={500}>{ev.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ev.eventDate ? new Date(ev.eventDate).toLocaleString() : "—"} · {ev.sold24h} issued
                            </Typography>
                          </Box>
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Typography variant="body2" fontWeight={600}>
                              {formatMoney(ev.revenue24h)}
                            </Typography>
                            {ev.eventId && (
                              <Button
                                component={Link}
                                href={`/events/edit/${ev.eventId}`}
                                size="small"
                              >
                                Edit event
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {show("paymentMix") && data.paymentMix && (
              <Grid item xs={12} md={5}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Payment mix ({kpiScope})
                    </Typography>
                    <Stack spacing={1}>
                      {(data.paymentMix.last24hPaidWithAmounts || []).map((row) => (
                        <Stack
                          key={row.provider}
                          direction="row"
                          justifyContent="space-between"
                        >
                          <Chip size="small" label={row.provider || "unknown"} />
                          <Typography variant="body2">
                            {formatMoney(row.amount)} · {row.count} orders
                          </Typography>
                        </Stack>
                      ))}
                      {!(data.paymentMix.last24hPaidWithAmounts || []).length && (
                        <Typography variant="body2" color="text.secondary">
                          No paid orders in this period.
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {show("admissions") && data.admissions && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Admissions
                    </Typography>
                    <Typography variant="body2">
                      Scanned ({kpiScope}): {data.admissions.scanned24h} · Last hour at range end:{" "}
                      {data.admissions.lastHour} · Previous hour: {data.admissions.prevHour}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Intensity vs average per hour across the range:{" "}
                      {data.admissions.intensityVs24hAvgPerHour?.ratio ?? "—"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {show("velocityVsBaseline") && data.velocityVsBaseline && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Velocity vs 7-day baseline
                    </Typography>
                    <Typography variant="h5">{data.velocityVsBaseline.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ratio {data.velocityVsBaseline.ratio} · Tickets created (7d rolling window):{" "}
                      {data.velocityVsBaseline.ticketsCreated7d}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {show("dataQuality") && data.dataQuality && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Data quality
                    </Typography>
                    <Typography variant="body2">
                      Tickets missing event: {data.dataQuality.ticketsMissingEvent}
                    </Typography>
                    <Typography variant="body2">
                      Stale unscanned (&gt;48h): {data.dataQuality.staleUnscannedOlderThan48h}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {show("upcoming") && data.upcoming && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Events on the horizon
                    </Typography>
                    <Typography variant="body2">
                      Active live/upcoming: {data.upcoming.activeEventsCount}
                    </Typography>
                    <Typography variant="body2">
                      Starting in the next 7 days: {data.upcoming.upcomingEvents7d}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {data.deltaSince && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Since your last visit ({new Date(data.deltaSince.since).toLocaleString()}):{" "}
                  {data.deltaSince.ticketsCreated} ticket(s) created, paid revenue{" "}
                  {formatMoney(data.deltaSince.paidRevenue)}.
                </Alert>
              </Grid>
            )}
          </Grid>
        </>
        )}
      </Box>
    </LocalizationProvider>
  );
}

function KpiCard({ title, value, delta }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        {delta != null && (
          <Chip
            size="small"
            label={`${delta >= 0 ? "+" : ""}${delta}% vs prior 24h`}
            color={delta >= 0 ? "success" : "warning"}
            sx={{ mt: 1 }}
          />
        )}
      </CardContent>
    </Card>
  );
}
