"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  LinearProgress,
  Paper,
  Divider,
  useMediaQuery,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Radar } from "react-chartjs-2";
import apiHandler from "@/RESTAPIs/helper";

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

function authHeaders(base = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const h = { ...base };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function opsFetch(path, options = {}) {
  const headers = authHeaders({ ...options.headers });
  if (options.body) headers["Content-Type"] = "application/json";
  const res = await fetch(`/api/ops${path}`, {
    ...options,
    headers,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg =
      data.error ||
      data.message ||
      (typeof data === "string" ? data : res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data;
}

function downloadBlob(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadHtml(filename, html) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function infraChip(rec) {
  if (!rec || rec.state === "not_configured") {
    return { label: "not configured", color: "default" };
  }
  if (rec.ok) return { label: "ok", color: "success" };
  return { label: "issue", color: "error" };
}

function velocityIcon(label) {
  if (label === "Hot") return <TrendingUpIcon fontSize="small" color="warning" />;
  if (label === "Quiet") return <TrendingDownIcon fontSize="small" color="info" />;
  return <TrendingFlatIcon fontSize="small" color="success" />;
}

/**
 * Plain-language brief for ELT—readable in a text editor or printout without parsing JSON trees.
 * Numbers only; no PII. Detailed fields remain under `business` / `platform`.
 */
function buildEltReadable(business, platformResponse) {
  const fos = platformResponse?.fos || {};
  const lines = [];
  const when =
    business?.exportMeta?.generatedAt ||
    platformResponse?.exportMeta?.generatedAt ||
    new Date().toISOString();
  lines.push(`Brief generated: ${when} (UTC).`);

  if (fos.platformHealthy === true) {
    lines.push("Platform: All configured infrastructure checks passed.");
  } else if (fos.platformHealthy === false) {
    lines.push(
      "Platform: One or more infrastructure checks did not pass. Ask operations to review the dashboard or technical export."
    );
  } else {
    lines.push("Platform: Health summary not available in this snapshot.");
  }

  if (Array.isArray(fos.infraSummary) && fos.infraSummary.length) {
    const bits = fos.infraSummary
      .map((r) => {
        const label = r.name || "service";
        if (r.ok === true) return `${label}: OK`;
        return `${label}: needs attention`;
      })
      .join("; ");
    lines.push(`Services: ${bits}.`);
  }

  if (fos.attentionNeeded === true) {
    lines.push("Flag: Something needs ops follow-up (platform or internal message backlog).");
  } else if (fos.attentionNeeded === false) {
    lines.push("Flag: No attention signal at this snapshot.");
  }

  if (fos.approximateBacklogHintUnavailable) {
    lines.push("Internal queues: Backlog size could not be read (temporary).");
  } else if (typeof fos.approximateBacklogHint === "number") {
    if (fos.approximateBacklogHint === 0) {
      lines.push("Internal queues: No dead-letter backlog reported.");
    } else {
      lines.push(
        `Internal queues: About ${fos.approximateBacklogHint} stalled messages may need ops review (not customer-facing detail).`
      );
    }
  }

  const t24 = business?.ticketsCreated24h;
  const adm = business?.admissions24h;
  if (t24 != null) lines.push(`Ticket volume (24h): ${t24} issued.`);
  if (adm != null) lines.push(`Gates / scans (24h): ${adm} admissions recorded.`);

  const vel = business?.velocityVsBaseline;
  if (vel?.label != null) {
    lines.push(
      `Sales pace vs usual week: ${vel.label}${vel.ratio != null ? ` (${vel.ratio}× rolling daily average).` : "."}`
    );
  }

  const sp = business?.spotlightEvent;
  if (sp?.title) {
    lines.push(
      `Spotlight event: “${sp.title}” — ${sp.tickets24h ?? 0} tickets in the last 24 hours.`
    );
  }

  const mix = business?.paymentMix;
  if (Array.isArray(mix) && mix.length) {
    const total = mix.reduce((s, p) => s + (p.count || 0), 0) || 1;
    const mixStr = mix
      .map((p) => {
        const pct = Math.round(((p.count || 0) / total) * 100);
        return `${p.provider || "other"} ${pct}%`;
      })
      .join(", ");
    lines.push(`Payment mix (24h): ${mixStr}.`);
  }

  if (business?.activeEventsCount != null) {
    lines.push(`Active catalogue events (live or upcoming): ${business.activeEventsCount}.`);
  }

  const summaryParts = [
    lines.find((l) => l.startsWith("Brief generated")),
    lines.find((l) => l.startsWith("Platform:")),
    lines.find((l) => l.startsWith("Ticket volume")),
    lines.find((l) => l.startsWith("Spotlight event")),
  ].filter(Boolean);
  const summary = summaryParts.join(" ");

  return {
    summary,
    lines,
    readMeFirst:
      "Internal Finnep brief. For raw metrics and infrastructure detail, use the Technical pack (JSON) from the Ops deck.",
  };
}

/** Single-page HTML brief for ELT: open in browser or print; no JSON required. */
function buildExecutiveBriefHtml(business, platformResponse) {
  const r = buildEltReadable(business, platformResponse);
  const items = r.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Finnep platform brief</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.55; max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem 3rem; color: #121218; background: #f0f0f4; }
  h1 { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.25rem; color: #0d0d12; }
  .badge { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.07em; color: #5a5a6b; margin-bottom: 1.35rem; }
  .card { background: #fff; border: 1px solid #dcdce5; border-radius: 12px; padding: 1.15rem 1.3rem; margin-bottom: 1.35rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .card p.lead { margin: 0; font-size: 1.06rem; }
  h2 { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.09em; color: #5c5c6e; margin: 0 0 0.7rem; font-weight: 600; }
  ul { margin: 0; padding-left: 1.15rem; }
  li { margin-bottom: 0.5rem; }
  footer { margin-top: 2rem; font-size: 0.78rem; color: #6e6e80; border-top: 1px solid #d8d8e0; padding-top: 1rem; line-height: 1.45; }
  @media print { body { background: #fff; } .card { box-shadow: none; border-color: #ccc; } }
</style>
</head>
<body>
  <div class="badge">Internal · Executive brief</div>
  <h1>Finnep platform brief</h1>
  <div class="card">
    <p class="lead">${escapeHtml(r.summary)}</p>
  </div>
  <h2>Details</h2>
  <ul>
${items}
  </ul>
  <footer>${escapeHtml(r.readMeFirst)}</footer>
</body>
</html>`;
}

export default function OpsMonitorPage() {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [kpis, setKpis] = useState(null);
  const [status, setStatus] = useState(null);
  const [dlqSummary, setDlqSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [kRes, st, dq] = await Promise.all([
        apiHandler("GET", "admin/monitor-kpis", true, false),
        opsFetch("/api/status").catch(() => null),
        opsFetch("/api/dlq/stats").catch(() => null),
      ]);
      setKpis(kRes.data);
      setStatus(st);
      setDlqSummary(dq?.summary || null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e?.response?.data?.message || e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 50000);
    return () => clearInterval(id);
  }, [load]);

  const exportMerged = async (audience) => {
    setError("");
    try {
      const kaxios = await apiHandler("GET", "admin/monitor-kpis", true, false);
      const fos = await opsFetch(
        `/api/monitor/snapshot?audience=${encodeURIComponent(audience)}&nocache=1`
      );
      if (audience === "executive") {
        const html = buildExecutiveBriefHtml(kaxios.data, fos);
        downloadHtml(`finnep-platform-executive-brief-${Date.now()}.html`, html);
        return;
      }
      const merged = {
        exportMeta: {
          exportedAt: new Date().toISOString(),
          audience: "technical",
          version: 1,
        },
        business: kaxios.data,
        platform: fos,
      };
      downloadBlob(
        `finnep-platform-technical-pack-${Date.now()}.json`,
        JSON.stringify(merged, null, 2)
      );
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const infra = status?.infra;
  const hourLabels = kpis?.ticketsByHour?.labels || [];
  const hourValues = kpis?.ticketsPerHourSeries || kpis?.ticketsByHour?.values || [];
  const lineData = {
    labels: hourLabels,
    datasets: [
      {
        label: "Tickets / hour",
        data: hourValues,
        borderColor: "rgb(129, 199, 132)",
        backgroundColor: "rgba(129, 199, 132, 0.35)",
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const pm = kpis?.paymentMix || [];
  const maxPay = Math.max(...pm.map((p) => p.count), 1);
  const radarData = {
    labels: pm.map((p) => p.provider || "?"),
    datasets: [
      {
        label: "24h mix",
        data: pm.map((p) => p.count),
        backgroundColor: "rgba(100, 181, 246, 0.25)",
        borderColor: "rgba(100, 181, 246, 0.9)",
        pointBackgroundColor: "rgba(171, 71, 188, 0.9)",
      },
    ],
  };

  const leaderboard = kpis?.topEventsByTickets7d || [];
  const maxSold = Math.max(...leaderboard.map((r) => r.sold || 0), 1);

  const heroMotion = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100%",
        pb: 4,
        ...(loading
          ? {}
          : !reduceMotion
            ? { animation: "deckShimmer 0.6s ease-out 1", "@keyframes deckShimmer": { from: { opacity: 0.65 }, to: { opacity: 1 } } }
            : {}),
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography variant="h4" component="h1">
          Ops deck
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          size="small"
          onClick={() => {
            setLoading(true);
            load();
          }}
        >
          Refresh
        </Button>
        <Button size="small" startIcon={<DownloadIcon />} onClick={() => exportMerged("executive")}>
          Executive brief (HTML)
        </Button>
        <Button
          size="small"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={() => exportMerged("technical")}
        >
          Technical pack (JSON)
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Command-center view: business signal from the API + platform health via finnep-ops-service. Refreshes about every 50s.
        Executive brief downloads a single HTML page you can open or print; technical pack is machine-readable JSON for ops.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <motion.div {...heroMotion}>
            <Card
              sx={{
                mb: 2,
                background: "linear-gradient(145deg, #12121a 0%, #1f1f32 55%, #252540 100%)",
                color: "#f0f0f5",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <CardContent>
                <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.65 }}>
                  Hero spotlight
                </Typography>
                {kpis?.spotlightEvent ? (
                  <>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {kpis.spotlightEvent.title}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.88, mt: 1 }}>
                      {kpis.spotlightEvent.status} · burst 24h: {kpis.spotlightEvent.tickets24h} tickets
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1" sx={{ opacity: 0.85 }}>
                    No ticket volume in the last 24h to highlight.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live pulse
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
                <Chip
                  icon={velocityIcon(kpis?.velocityVsBaseline?.label)}
                  label={`Velocity: ${kpis?.velocityVsBaseline?.label || "—"} (${kpis?.velocityVsBaseline?.ratio ?? "—"}× vs 7d daily avg)`}
                  variant="outlined"
                />
                <Chip
                  label={`Admissions 24h: ${kpis?.admissions24h ?? "—"} · last hour: ${kpis?.admissionsLastHour ?? "—"}`}
                  variant="outlined"
                />
                <Chip
                  label={`Intensity vs 24h avg: ${kpis?.admissionIntensity?.ratio ?? "—"}×`}
                  color={kpis?.admissionIntensity?.ratio > 1.5 ? "warning" : "default"}
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                24h ticket aurora
              </Typography>
              {hourLabels.length ? (
                <Box sx={{ height: 280 }}>
                  <Line
                    data={lineData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { maxRotation: 45 } },
                        y: { beginAtZero: true },
                      },
                    }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hourly series yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Baselines
              </Typography>
              <Typography variant="body2">
                Issued 24h: {kpis?.ticketsCreated24h ?? "—"} · 7d total: {kpis?.ticketsCreated7d ?? "—"}
              </Typography>
              <Typography variant="body2">Admissions 24h: {kpis?.admissions24h ?? "—"}</Typography>
              <Typography variant="body2">Active events: {kpis?.activeEventsCount ?? "—"}</Typography>
              <Typography variant="body2">Upcoming 7d: {kpis?.upcomingEvents7d ?? "—"}</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" color="text.secondary">
                Data quality
              </Typography>
              <Typography variant="body2">
                Tickets missing event: {kpis?.dataQuality?.ticketsMissingEvent ?? "—"}
              </Typography>
              <Typography variant="body2">
                Stale unscanned (&gt;48h): {kpis?.dataQuality?.staleUnscannedOlderThan48h ?? "—"}
              </Typography>
              <Typography variant="body2">
                Stuck send ({kpis?.orphanTickets?.stuckSendOlderThanHours ?? 2}h+):{" "}
                {kpis?.orphanTickets?.stuckSendCount ?? "—"}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment constellation
              </Typography>
              {pm.length ? (
                <Box sx={{ height: 300 }}>
                  <Radar
                    data={radarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          beginAtZero: true,
                          suggestedMax: maxPay * 1.15 || 10,
                        },
                      },
                      plugins: { legend: { display: false } },
                    }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No payment mix in window.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Infra orbit
              </Typography>
              {!status ? (
                <Typography variant="body2" color="text.secondary">
                  Ops status unavailable.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 1.2,
                    maxWidth: 420,
                  }}
                >
                  {["postgresql", "mongodb", "redis", "nginx", "postal", "rabbitmq"].map((key) => {
                    const rec = infra?.[key];
                    const c = infraChip(rec);
                    const glow =
                      c.color === "success"
                        ? "0 0 12px rgba(76, 175, 80, 0.35)"
                        : c.color === "error"
                          ? "0 0 14px rgba(244, 67, 54, 0.45)"
                          : "none";
                    return (
                      <Chip
                        key={key}
                        label={`${key} · ${c.label}`}
                        color={c.color}
                        size="small"
                        sx={{ boxShadow: glow, justifyContent: "center" }}
                      />
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card
            sx={{
              border:
                dlqSummary && dlqSummary.totalDLQMessages > 0
                  ? "1px solid rgba(244, 67, 54, 0.45)"
                  : undefined,
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" gutterBottom>
                  DLQ tension
                </Typography>
                <Button component={Link} href="/admin/dlq" size="small" endIcon={<OpenInNewIcon />}>
                  Open DLQ
                </Button>
              </Box>
              {dlqSummary ? (
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      DLQ messages
                    </Typography>
                    <Typography variant="h5">{dlqSummary.totalDLQMessages}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Retry pipe
                    </Typography>
                    <Typography variant="h5">{dlqSummary.totalRetryMessages}</Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No DLQ stats.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top events (7d)
              </Typography>
              {leaderboard.length ? (
                <StackLeaderboard rows={leaderboard} maxSold={maxSold} />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No volume in rolling 7d.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="caption" color="text.secondary" component="div">
        Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "—"} · Theme contrast follows MUI defaults.
      </Typography>
    </Box>
  );
}

function StackLeaderboard({ rows, maxSold }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map((r, i) => (
        <Box key={String(r.eventId) + i}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2">
              #{i + 1} {r.title || "—"}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {r.sold}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, (r.sold / maxSold) * 100)}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>
      ))}
    </Box>
  );
}
