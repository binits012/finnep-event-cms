"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import apiHandler from "@/RESTAPIs/helper";
import Toast from "react-hot-toast";
import { formatDate } from "@/utils/dateUtils";

function hostnameFromUrl(url) {
  if (!url || typeof url !== "string") return "";
  try {
    const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function copyToClipboard(text, label) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(
    () => Toast.success(`${label} copied to clipboard`),
    () => Toast.error(`Failed to copy ${label}`)
  );
}

const DEPLOYMENT_STATUS_LABELS = {
  not_configured: "Not configured",
  pending_provision: "Pending provision",
  provisioning: "Provisioning",
  provisioned: "Provisioned",
  provision_failed: "Provision failed",
  pending_deprovision: "Pending deprovision",
  deprovisioning: "Deprovisioning",
  deprovisioned: "Deprovisioned",
  deprovision_failed: "Deprovision failed",
};

function deploymentStatusColor(status) {
  switch (status) {
    case "provisioned":
      return "success";
    case "provision_failed":
    case "deprovision_failed":
      return "error";
    case "provisioning":
    case "pending_provision":
    case "deprovisioning":
    case "pending_deprovision":
      return "warning";
    default:
      return "default";
  }
}

function isDeploymentInProgress(status) {
  return ["pending_provision", "provisioning", "pending_deprovision", "deprovisioning"].includes(status);
}

function HostingDetailRow({ label, value, copyLabel, href }) {
  if (!value) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        <Typography variant="body2">—</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
        {href ? (
          <Typography
            component="a"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
          >
            {value}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
            {value}
          </Typography>
        )}
        {copyLabel && (
          <IconButton
            size="small"
            aria-label={`Copy ${copyLabel}`}
            onClick={() => copyToClipboard(value, copyLabel)}
          >
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

function SecretRevealDialog({ open, title, keyId, secret, onClose }) {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (open) {
      setAcknowledged(false);
    }
  }, [open, keyId, secret]);

  return (
    <Dialog open={open} onClose={() => {}} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Copy the API secret now. It will not be shown again. Store it in the merchant&apos;s silo
          server environment (e.g. <code>PARTNER_API_SECRET</code>), never in the browser.
        </Alert>
        <TextField
          label="API Key ID"
          value={keyId || ""}
          fullWidth
          margin="normal"
          InputProps={{
            readOnly: true,
            sx: { fontFamily: "monospace" },
            endAdornment: (
              <IconButton
                aria-label="Copy API key"
                onClick={() => copyToClipboard(keyId, "API key")}
                edge="end"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
        <TextField
          label="API Secret (one-time)"
          value={secret || ""}
          fullWidth
          margin="normal"
          InputProps={{
            readOnly: true,
            sx: { fontFamily: "monospace" },
            endAdornment: (
              <IconButton
                aria-label="Copy API secret"
                onClick={() => copyToClipboard(secret, "API secret")}
                edge="end"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
          }
          label="I have securely stored the secret"
        />
        <Alert severity="info" sx={{ mt: 2 }}>
          Update <code>finnep-silo-storefront/.env</code> with:
          <Box component="pre" sx={{ mt: 1, mb: 0, fontSize: "12px", overflowX: "auto" }}>
{`PARTNER_API_BASE_URL=http://localhost:3001
PARTNER_API_KEY=${keyId || "febk_live_..."}
PARTNER_API_SECRET=${secret || "febs_..."}`}
          </Box>
          Restart the silo storefront dev server after saving.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" disabled={!acknowledged}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MerchantSiloApiSection({
  merchantId,
  merchantWebsite,
  merchantStatus,
  onCredentialsChange,
}) {
  const [credentials, setCredentials] = useState([]);
  const [siloHosting, setSiloHosting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retryingHosting, setRetryingHosting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rotatingKeyId, setRotatingKeyId] = useState(null);
  const [revokingKeyId, setRevokingKeyId] = useState(null);
  const [siloEnabled, setSiloEnabled] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [label, setLabel] = useState("Silo storefront");
  const [allowedDomainsText, setAllowedDomainsText] = useState("");
  const [serverToServer, setServerToServer] = useState(true);
  const [secretDialog, setSecretDialog] = useState({
    open: false,
    title: "",
    keyId: "",
    secret: "",
  });

  const defaultDomain = useMemo(() => hostnameFromUrl(merchantWebsite), [merchantWebsite]);
  const suggestedStorefrontDomains = useMemo(() => {
    const domains = [];
    if (defaultDomain) domains.push(defaultDomain);
    const cloudfrontHost = (siloHosting?.deployment?.cloudfrontDomainName || "").trim().toLowerCase();
    if (cloudfrontHost) domains.push(cloudfrontHost);
    return [...new Set(domains)];
  }, [defaultDomain, siloHosting?.deployment?.cloudfrontDomainName]);
  const hasActiveCredential = credentials.some((c) => c.status === "active");
  const isMerchantActive = merchantStatus === "active";

  const fetchCredentials = useCallback(async ({ silent = false } = {}) => {
    if (!merchantId) return;
    if (!silent) setLoading(true);
    try {
      const response = await apiHandler("GET", `merchant/${merchantId}/api-credentials`, true);
      const list = response?.data?.credentials || [];
      setCredentials(list);
      setSiloHosting(response?.data?.siloHosting || null);
      setSiloEnabled(list.some((c) => c.status === "active"));
      onCredentialsChange?.(list);
    } catch (err) {
      console.error("Failed to load API credentials:", err);
      if (!silent) Toast.error("Failed to load silo API credentials");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [merchantId, onCredentialsChange]);

  const handleRetryHosting = async () => {
    setRetryingHosting(true);
    try {
      const response = await apiHandler(
        "POST",
        `merchant/${merchantId}/silo-deployment/retry`,
        true
      );
      setSiloHosting(response?.data?.siloHosting || null);
      if (response?.data?.reconciled) {
        Toast.success("Storefront hosting verified and synced");
      } else {
        Toast.success("Silo hosting provisioning re-queued");
      }
      await fetchCredentials({ silent: true });
    } catch (err) {
      console.error("Failed to retry silo hosting:", err);
      Toast.error(err?.response?.data?.message || "Failed to retry silo hosting");
    } finally {
      setRetryingHosting(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const deploymentStatus = siloHosting?.deployment?.status || "not_configured";

  useEffect(() => {
    if (!merchantId || !isDeploymentInProgress(deploymentStatus)) {
      return undefined;
    }
    const timer = setInterval(() => {
      fetchCredentials({ silent: true });
    }, 8000);
    return () => clearInterval(timer);
  }, [merchantId, deploymentStatus, fetchCredentials]);

  useEffect(() => {
    if (suggestedStorefrontDomains.length > 0 && !allowedDomainsText) {
      setAllowedDomainsText(suggestedStorefrontDomains.join(", "));
    }
  }, [suggestedStorefrontDomains, allowedDomainsText]);

  const parseDomains = () =>
    allowedDomainsText
      .split(/[\n,]+/)
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

  const handleToggleSilo = (enabled) => {
    if (!isMerchantActive) {
      Toast.error("Activate the merchant before enabling Silo API access");
      return;
    }
    if (!enabled && hasActiveCredential) {
      Toast.error(
        "Revoke the API credentials below to deprovision the silo storefront."
      );
      setSiloEnabled(true);
      return;
    }
    setSiloEnabled(enabled);
    if (enabled && !hasActiveCredential) {
      setShowCreateForm(true);
      if (suggestedStorefrontDomains.length > 0 && !allowedDomainsText) {
        setAllowedDomainsText(suggestedStorefrontDomains.join(", "));
      }
    } else {
      setShowCreateForm(false);
    }
  };

  const handleCreateCredential = async () => {
    const allowedDomains = parseDomains();
    if (allowedDomains.length === 0) {
      Toast.error("Add at least one allowed domain");
      return;
    }

    setCreating(true);
    try {
      const response = await apiHandler(
        "POST",
        `merchant/${merchantId}/api-credentials`,
        true,
        false,
        {
          allowedDomains,
          label: label.trim() || "Silo storefront",
          serverToServer,
          scopes: [],
        }
      );
      const { credential, secret } = response?.data || {};
      if (!credential?.keyId || !secret) {
        Toast.error("Unexpected response when creating credentials");
        return;
      }
      await fetchCredentials();
      setShowCreateForm(false);
      setSiloEnabled(true);
      setSecretDialog({
        open: true,
        title: "Silo API credentials created",
        keyId: credential.keyId,
        secret,
      });
      Toast.success("Silo API credentials created");
    } catch (err) {
      console.error("Failed to create API credentials:", err);
      Toast.error(err?.response?.data?.message || "Failed to create API credentials");
    } finally {
      setCreating(false);
    }
  };

  const handleRotate = async (keyId) => {
    if (!window.confirm("Rotate this API secret? The old secret stops working immediately.")) {
      return;
    }
    setRotatingKeyId(keyId);
    try {
      const response = await apiHandler(
        "POST",
        `merchant/${merchantId}/api-credentials/${keyId}/rotate`,
        true
      );
      const { credential, secret } = response?.data || {};
      await fetchCredentials();
      setSecretDialog({
        open: true,
        title: "API secret rotated",
        keyId: credential?.keyId || keyId,
        secret: secret || "",
      });
      Toast.success("API secret rotated");
    } catch (err) {
      console.error("Failed to rotate API secret:", err);
      Toast.error(err?.response?.data?.message || "Failed to rotate API secret");
    } finally {
      setRotatingKeyId(null);
    }
  };

  const handleRevoke = async (keyId) => {
    if (!window.confirm("Revoke this API key? The merchant silo app will stop working until a new key is issued.")) {
      return;
    }
    setRevokingKeyId(keyId);
    try {
      await apiHandler(
        "DELETE",
        `merchant/${merchantId}/api-credentials/${keyId}`,
        true
      );
      await fetchCredentials();
      Toast.success("API credential revoked");
    } catch (err) {
      console.error("Failed to revoke API credential:", err);
      Toast.error(err?.response?.data?.message || "Failed to revoke API credential");
    } finally {
      setRevokingKeyId(null);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "revoked":
        return "default";
      default:
        return "warning";
    }
  };

  return (
    <Grid item xs={12}>
      <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
        Silo Partner API
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Issue API key + secret for the merchant&apos;s branded silo storefront. The secret is shown
        once at creation or rotation and cannot be retrieved later.
      </Typography>

      {!isMerchantActive && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Activate this merchant before issuing Silo API credentials.
        </Alert>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={siloEnabled || showCreateForm}
            onChange={(e) => handleToggleSilo(e.target.checked)}
            disabled={loading || !isMerchantActive}
            color="primary"
          />
        }
        label={
          <Box>
            <Typography variant="body1">
              {hasActiveCredential ? "Silo API access active" : "Issue Silo API credentials"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {hasActiveCredential
                ? "Storefront is live. Revoke all credentials below to deprovision. Merchants configure theme in the backoffice."
                : "Issuing credentials enables the merchant silo storefront and syncs to the merchant backoffice."}
            </Typography>
          </Box>
        }
        sx={{ mb: 2 }}
      />

      {(hasActiveCredential || siloHosting?.enabled) && (
        <Box sx={{ mb: 3, p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Silo hosting (AWS)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Platform-managed S3 + CloudFront — synced from FEB backend
              </Typography>
            </Box>
            <Chip
              label={DEPLOYMENT_STATUS_LABELS[deploymentStatus] || deploymentStatus}
              color={deploymentStatusColor(deploymentStatus)}
              size="small"
            />
          </Box>

          {isDeploymentInProgress(deploymentStatus) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Hosting setup in progress. This page refreshes automatically every few seconds.
            </Alert>
          )}

          {siloHosting?.deployment?.lastError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Last provisioning error
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {siloHosting.deployment.lastError}
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <HostingDetailRow
              label="Active API key IDs (for silo .env)"
              value={(siloHosting?.activeApiKeyIds || []).join(", ")}
              copyLabel="API key IDs"
            />
            <HostingDetailRow
              label="S3 bucket"
              value={siloHosting?.deployment?.s3Bucket}
              copyLabel="S3 bucket"
            />
            <HostingDetailRow
              label="S3 region"
              value={siloHosting?.deployment?.s3Region}
            />
            <HostingDetailRow
              label="CloudFront distribution ID"
              value={siloHosting?.deployment?.cloudfrontDistributionId}
              copyLabel="distribution ID"
            />
            <HostingDetailRow
              label="CloudFront domain"
              value={siloHosting?.deployment?.cloudfrontDomainName}
              copyLabel="CloudFront domain"
              href={
                siloHosting?.deployment?.cloudfrontDomainName
                  ? `https://${siloHosting.deployment.cloudfrontDomainName}`
                  : undefined
              }
            />
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
            {siloHosting?.deployment?.lastProvisionedAt
              ? `Last provisioned ${formatDate(siloHosting.deployment.lastProvisionedAt)}`
              : siloHosting?.deployment?.lastProvisionRequestedAt
                ? `Last requested ${formatDate(siloHosting.deployment.lastProvisionRequestedAt)}`
                : "No provisioning activity yet"}
          </Typography>

          {deploymentStatus === "provisioned" && siloHosting?.deployment?.s3Bucket && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Publish storefront (manual)
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", m: 0 }}
              >
                {`cd finnep-silo-storefront
# Ensure .env has PARTNER_API_BASE_URL, PARTNER_API_KEY, PARTNER_API_SECRET
S3_BUCKET=${siloHosting.deployment.s3Bucket} \\
NEXT_PUBLIC_SITE_URL=https://${siloHosting.deployment.cloudfrontDomainName || "your-cloudfront-domain"} \\
NEXT_PUBLIC_SILO_API_BASE_URL=https://test.okazzo.eu/front/silo-storefront-bff \\
CLOUDFRONT_DISTRIBUTION_ID=${siloHosting.deployment.cloudfrontDistributionId || "DIST_ID"} \\
npm run deploy:static`}
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => fetchCredentials()}
              disabled={loading}
            >
              Refresh status
            </Button>
            {hasActiveCredential && (
              <Button
                size="small"
                variant="contained"
                onClick={handleRetryHosting}
                disabled={retryingHosting || isDeploymentInProgress(deploymentStatus)}
              >
                {retryingHosting ? (
                  <CircularProgress size={18} />
                ) : deploymentStatus === "provisioned" ? (
                  "Re-sync hosting"
                ) : (
                  "Retry provisioning"
                )}
              </Button>
            )}
          </Box>
        </Box>
      )}

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading credentials…</Typography>
        </Box>
      )}

      {showCreateForm && !hasActiveCredential && (
        <Box sx={{ mb: 3, p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            New API credentials
          </Typography>
          <TextField
            label="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            fullWidth
            size="small"
            margin="normal"
          />
          <TextField
            label="Allowed domains"
            value={allowedDomainsText}
            onChange={(e) => setAllowedDomainsText(e.target.value)}
            fullWidth
            size="small"
            margin="normal"
            multiline
            minRows={2}
            helperText="Comma or newline separated hostnames (merchant site + CloudFront domain). FEB adds the CloudFront hostname automatically after provisioning."
            placeholder={suggestedStorefrontDomains.join(", ") || defaultDomain || "events.example.com"}
          />
          <FormControlLabel
            control={
              <Switch
                checked={serverToServer}
                onChange={(e) => setServerToServer(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2">Server-to-server (BFF)</Typography>
                <Typography variant="caption" color="text.secondary">
                  Enable for Next.js silo apps that call the partner API from the server without an Origin header
                </Typography>
              </Box>
            }
            sx={{ mt: 1, display: "flex", alignItems: "flex-start" }}
          />
          <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleCreateCredential}
              disabled={creating}
            >
              {creating ? <CircularProgress size={20} /> : "Create API key & secret"}
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setShowCreateForm(false);
                setSiloEnabled(hasActiveCredential);
              }}
              disabled={creating}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {credentials.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {credentials.map((cred) => (
            <Box
              key={cred.keyId}
              sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    API Key ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                    {cred.keyId}
                  </Typography>
                </Box>
                <Chip label={cred.status} color={statusColor(cred.status)} size="small" />
              </Box>

              {cred.label && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {cred.label}
                </Typography>
              )}

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Allowed domains
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {(cred.allowedDomains || []).join(", ") || "—"}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                API Secret
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 1 }}>
                •••••••••••••••• (not stored — rotate to issue a new secret)
              </Typography>

              <Typography variant="caption" color="text.secondary" display="block">
                Created {cred.createdAt ? formatDate(cred.createdAt) : "—"}
                {cred.lastUsedAt ? ` · Last used ${formatDate(cred.lastUsedAt)}` : ""}
                {cred.serverToServer ? " · Server-to-server" : ""}
              </Typography>

              {cred.status === "active" && (
                <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleRotate(cred.keyId)}
                    disabled={rotatingKeyId === cred.keyId}
                  >
                    {rotatingKeyId === cred.keyId ? (
                      <CircularProgress size={18} />
                    ) : (
                      "Rotate secret"
                    )}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleRevoke(cred.keyId)}
                    disabled={revokingKeyId === cred.keyId}
                  >
                    {revokingKeyId === cred.keyId ? (
                      <CircularProgress size={18} />
                    ) : (
                      "Revoke"
                    )}
                  </Button>
                </Box>
              )}
            </Box>
          ))}

          {hasActiveCredential && (
            <Button
              size="small"
              variant="text"
              onClick={() => {
                setShowCreateForm(true);
                setSiloEnabled(true);
              }}
            >
              Issue additional credential
            </Button>
          )}
        </Box>
      )}

      <SecretRevealDialog
        open={secretDialog.open}
        title={secretDialog.title}
        keyId={secretDialog.keyId}
        secret={secretDialog.secret}
        onClose={() => setSecretDialog({ open: false, title: "", keyId: "", secret: "" })}
      />
    </Grid>
  );
}
