"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  TextField,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Grid,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PublishIcon from "@mui/icons-material/Publish";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";

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

export default function DlqAdminPage() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [messages, setMessages] = useState(null);
  const [limit, setLimit] = useState(10);
  const [targetQueue, setTargetQueue] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState("");

  const loadStats = useCallback(async () => {
    setError("");
    const [s, st] = await Promise.all([
      opsFetch("/api/dlq/stats"),
      opsFetch("/api/status").catch(() => null),
    ]);
    setStats(s);
    setStatus(st);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await loadStats();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const loadMessages = async () => {
    if (!selectedQueue) return;
    setLoadingMessages(true);
    setError("");
    try {
      const m = await opsFetch(
        `/api/dlq/${encodeURIComponent(selectedQueue)}/messages?limit=${limit}`
      );
      setMessages(m);
    } catch (e) {
      setError(e.message || String(e));
      setMessages(null);
    } finally {
      setLoadingMessages(false);
    }
  };

  const republish = async (messageId) => {
    if (!selectedQueue || !messageId) return;
    setError("");
    try {
      const body =
        targetQueue.trim() ? JSON.stringify({ targetQueue: targetQueue.trim() }) : "{}";
      await opsFetch(
        `/api/dlq/${encodeURIComponent(selectedQueue)}/republish/${encodeURIComponent(messageId)}`,
        { method: "POST", body }
      );
      await loadMessages();
      await loadStats();
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const purge = async () => {
    if (purgeConfirm !== "PURGE") return;
    setError("");
    try {
      await opsFetch(`/api/dlq/${encodeURIComponent(selectedQueue)}/purge`, {
        method: "DELETE",
        body: JSON.stringify({ confirm: true }),
      });
      setPurgeOpen(false);
      setPurgeConfirm("");
      setMessages(null);
      await loadStats();
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const dlqNames = (stats?.dlqQueues || [])
    .map((q) => q.name)
    .filter(Boolean)
    .sort();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        RabbitMQ DLQ
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Inspect and recover dead-letter messages via finnep-ops-service (server proxy). Republish
        can duplicate work if consumers are not idempotent.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button startIcon={<RefreshIcon />} variant="outlined" onClick={refreshAll}>
          Refresh stats
        </Button>
      </Box>

      {status && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Ops dependency status
            </Typography>
            <Chip
              label={status.healthy ? "Healthy" : "Unhealthy"}
              color={status.healthy ? "success" : "error"}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="body2">
              RabbitMQ channel: {status.rabbitConnected ? "ok" : "missing"}
            </Typography>
            {Array.isArray(status.http) && status.http.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">HTTP targets</Typography>
                {status.http.map((h) => (
                  <Typography key={h.name} variant="caption" display="block">
                    {h.name}: {h.ok ? "ok" : h.error || "fail"}{" "}
                    {h.latencyMs != null ? `(${h.latencyMs}ms)` : ""}
                  </Typography>
                ))}
              </Box>
            )}
            {status.postgres && (
              <Typography variant="caption" display="block">
                Postgres: {status.postgres.ok ? "ok" : status.postgres.error}
              </Typography>
            )}
            {status.mongo && (
              <Typography variant="caption" display="block">
                Mongo: {status.mongo.ok ? "ok" : status.mongo.error}
              </Typography>
            )}
            {status.redis && (
              <Typography variant="caption" display="block">
                Redis: {status.redis.ok ? "ok" : status.redis.error}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {stats?.summary && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  DLQ messages
                </Typography>
                <Typography variant="h6">{stats.summary.totalDLQMessages}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Retry messages
                </Typography>
                <Typography variant="h6">{stats.summary.totalRetryMessages}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  DLQ queues
                </Typography>
                <Typography variant="h6">{stats.summary.dlqQueueCount}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Retry queues
                </Typography>
                <Typography variant="h6">{stats.summary.retryQueueCount}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Peek messages
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
            <TextField
              select
              label="DLQ"
              size="small"
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 280 }}
            >
              <option value="">Select queue</option>
              {dlqNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </TextField>
            <TextField
              label="Limit"
              type="number"
              size="small"
              value={limit}
              onChange={(e) => setLimit(Math.min(50, Math.max(1, Number(e.target.value) || 10)))}
              sx={{ width: 100 }}
            />
            <Button variant="contained" onClick={loadMessages} disabled={!selectedQueue || loadingMessages}>
              Load messages
            </Button>
            <Button
              color="error"
              variant="outlined"
              startIcon={<DeleteSweepIcon />}
              disabled={!selectedQueue}
              onClick={() => setPurgeOpen(true)}
            >
              Purge queue
            </Button>
          </Box>
          <TextField
            label="Optional republish routing key (targetQueue)"
            size="small"
            fullWidth
            value={targetQueue}
            onChange={(e) => setTargetQueue(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Leave empty to use message metadata / default routing"
          />

          {messages?.messages?.length > 0 && (
            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Message id</TableCell>
                    <TableCell>Routing key</TableCell>
                    <TableCell>Deaths</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {messages.messages.map((m) => (
                    <TableRow key={`${m.messageId}-${m.timestamp}`}>
                      <TableCell>{m.messageId}</TableCell>
                      <TableCell>{m.routingKey || "—"}</TableCell>
                      <TableCell>{m.deathCount ?? "—"}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<PublishIcon />}
                          onClick={() => republish(m.messageId)}
                        >
                          Republish
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
          {messages && messages.returnedMessages === 0 && (
            <Typography variant="body2" color="text.secondary">
              No messages returned (queue may be empty or limit 0).
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={purgeOpen} onClose={() => setPurgeOpen(false)}>
        <DialogTitle>Purge {selectedQueue}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This permanently removes all messages in the DLQ. Type PURGE to confirm.
          </Typography>
          <TextField
            fullWidth
            label="Confirmation"
            value={purgeConfirm}
            onChange={(e) => setPurgeConfirm(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurgeOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={purgeConfirm !== "PURGE"} onClick={purge}>
            Purge
          </Button>
        </DialogActions>
      </Dialog>

      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary">
        DLQ names are defined in finnep-ops-service queueTopology and must match EMS rabbitmqPlugin.
      </Typography>
    </Box>
  );
}
