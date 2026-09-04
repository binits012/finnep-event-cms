"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import styled from "styled-components";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import { getOutboundMailLogs } from "@/RESTAPIs/outboundMail";

const STATUS_OPTIONS = ["", "accepted", "failed", "skipped"];
const MAIL_TYPE_OPTIONS = ["", "ticket", "otp", "waitlist", "presale", "other"];
const TRANSPORT_OPTIONS = ["", "silo_smtp", "platform_smtp", "unknown"];

const statusColor = (status) => {
  if (status === "accepted") return "success";
  if (status === "failed") return "error";
  if (status === "skipped") return "default";
  return "default";
};

const OutboundMailPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    status: "",
    mailType: "",
    transport: "",
    externalMerchantId: "",
    ticketId: "",
  });
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchLogs = async (nextPage = 1, nextLimit = pagination.limit) => {
    setLoading(true);
    setErrorText("");
    try {
      const res = await getOutboundMailLogs({
        page: nextPage,
        limit: nextLimit,
        status: filters.status || undefined,
        mailType: filters.mailType || undefined,
        transport: filters.transport || undefined,
        externalMerchantId: filters.externalMerchantId || undefined,
        ticketId: filters.ticketId || undefined,
      });
      const payload = res?.data || {};
      setRows(Array.isArray(payload.data) ? payload.data : []);
      setPagination((prev) => ({
        ...prev,
        page: payload?.pagination?.page || nextPage,
        limit: payload?.pagination?.limit || nextLimit,
        total: payload?.pagination?.total || 0,
      }));
    } catch (err) {
      setErrorText(err?.response?.data?.message || "Failed to load outbound mail logs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () => [
      {
        field: "createdAt",
        headerName: "Time",
        flex: 1,
        minWidth: 170,
        renderCell: ({ row }) =>
          row?.createdAt ? new Date(row.createdAt).toLocaleString() : "-",
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: ({ row }) => (
          <Chip size="small" label={row.status || "-"} color={statusColor(row.status)} />
        ),
      },
      { field: "mailType", headerName: "Type", width: 110 },
      { field: "transport", headerName: "Transport", width: 140 },
      { field: "channel", headerName: "Channel", width: 110 },
      {
        field: "toMasked",
        headerName: "Recipient",
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => row?.toMasked || "-",
      },
      {
        field: "merchant",
        headerName: "Merchant",
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) =>
          row?.merchant?.name ||
          row?.merchant?.merchantId ||
          row?.externalMerchantId ||
          "-",
      },
      {
        field: "ticket",
        headerName: "Ticket",
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => row?.ticket?.otp || row?.ticket?.id || "-",
      },
      { field: "triggeredBy", headerName: "Trigger", width: 110 },
      {
        field: "errorMessage",
        headerName: "Error",
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => row?.errorMessage || "-",
      },
      {
        field: "view",
        headerName: "View",
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Button size="small" variant="outlined" onClick={() => setSelectedRecord(row)}>
            View
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <Wrapper>
      <CustomBreadcrumbs
        title="Outbound Mail"
        links={[
          { path: "/dashboard", title: "Dashboard", active: false },
          { path: "/outbound-mail", title: "Outbound Mail", active: true },
        ]}
      />
      <Typography variant="h4" mb={1}>
        Outbound Mail
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Delivery attempts for ticket and related system emails. Recipients are masked.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2} flexWrap="wrap">
        <TextField
          select
          label="Status"
          size="small"
          sx={{ minWidth: 140 }}
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
        >
          {STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt || "all"} value={opt}>
              {opt || "All"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Type"
          size="small"
          sx={{ minWidth: 140 }}
          value={filters.mailType}
          onChange={(e) => setFilters((prev) => ({ ...prev, mailType: e.target.value }))}
        >
          {MAIL_TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt || "all"} value={opt}>
              {opt || "All"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Transport"
          size="small"
          sx={{ minWidth: 160 }}
          value={filters.transport}
          onChange={(e) => setFilters((prev) => ({ ...prev, transport: e.target.value }))}
        >
          {TRANSPORT_OPTIONS.map((opt) => (
            <MenuItem key={opt || "all"} value={opt}>
              {opt || "All"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="External merchant ID"
          size="small"
          value={filters.externalMerchantId}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, externalMerchantId: e.target.value }))
          }
        />
        <TextField
          label="Ticket ID"
          size="small"
          value={filters.ticketId}
          onChange={(e) => setFilters((prev) => ({ ...prev, ticketId: e.target.value }))}
        />
        <Button variant="contained" onClick={() => fetchLogs(1)} disabled={loading}>
          Apply
        </Button>
      </Stack>

      {errorText ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorText}
        </Alert>
      ) : null}

      <Box sx={{ height: 620 }}>
        <StyledDataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          paginationMode="server"
          rowCount={pagination.total}
          paginationModel={{ page: pagination.page - 1, pageSize: pagination.limit }}
          onPaginationModelChange={(model) => {
            fetchLogs(model.page + 1, model.pageSize);
          }}
          pageSizeOptions={[20, 50, 100]}
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Outbound mail attempt</DialogTitle>
        <DialogContent dividers>
          <JsonBox>{JSON.stringify(selectedRecord || {}, null, 2)}</JsonBox>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
`;

const StyledDataGrid = styled(DataGrid)`
  .MuiDataGrid-cell:focus,
  .MuiDataGrid-cell:focus-within {
    outline: none !important;
  }
`;

const JsonBox = styled.pre`
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  max-height: 480px;
  overflow: auto;
  font-size: 12px;
`;

export default OutboundMailPage;
