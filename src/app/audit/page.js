"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import styled from "styled-components";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import { getAuditLogs } from "@/RESTAPIs/audit";

const AuditPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    entityType: "",
    entityId: "",
    action: "",
  });
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchAudit = async (nextPage = 1, nextLimit = pagination.limit) => {
    setLoading(true);
    setErrorText("");
    try {
      const res = await getAuditLogs({
        page: nextPage,
        limit: nextLimit,
        collectionName: filters.entityType || undefined,
        documentId: filters.entityId || undefined,
        action: filters.action || undefined,
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
      setErrorText(err?.response?.data?.message || "Failed to load audit logs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () => [
      { field: "entityType", headerName: "Entity", flex: 1, minWidth: 140 },
      { field: "entityId", headerName: "Entity ID", flex: 1.2, minWidth: 180 },
      { field: "action", headerName: "Action", width: 120 },
      {
        field: "actor",
        headerName: "Actor",
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => row?.actor?.name || row?.actor?.id || "-",
      },
      {
        field: "createdAt",
        headerName: "Created At",
        flex: 1,
        minWidth: 180,
        renderCell: ({ row }) =>
          row?.createdAt ? new Date(row.createdAt).toLocaleString() : "-",
      },
      {
        field: "changedSummary",
        headerName: "Changes",
        flex: 1.2,
        minWidth: 220,
        renderCell: ({ row }) => row?.changedSummary || "-",
      },
      {
        field: "view",
        headerName: "View",
        width: 120,
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

  const handleDownloadRecord = () => {
    if (!selectedRecord) return;
    const filename = `audit-${selectedRecord.id || "record"}.json`;
    const blob = new Blob([JSON.stringify(selectedRecord, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Wrapper>
      <CustomBreadcrumbs
        title="Audit / Audit Logs"
        links={[
          { path: "/dashboard", title: "Dashboard", active: false },
          { path: "/audit", title: "Audit", active: true },
        ]}
      />
      <Typography variant="h4" mb={3}>
        Audit Logs
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <TextField
          label="Entity"
          size="small"
          value={filters.entityType}
          onChange={(e) => setFilters((prev) => ({ ...prev, entityType: e.target.value }))}
        />
        <TextField
          label="Entity ID"
          size="small"
          value={filters.entityId}
          onChange={(e) => setFilters((prev) => ({ ...prev, entityId: e.target.value }))}
        />
        <TextField
          label="Action"
          size="small"
          value={filters.action}
          onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
        />
        <Button variant="contained" onClick={() => fetchAudit(1)} disabled={loading}>
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
            fetchAudit(model.page + 1, model.pageSize);
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
        <DialogTitle>Audit Record Details</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Full Record
          </Typography>
          <JsonBox>{JSON.stringify(selectedRecord || {}, null, 2)}</JsonBox>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Before
          </Typography>
          <JsonBox>{JSON.stringify(selectedRecord?.before || {}, null, 2)}</JsonBox>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            After
          </Typography>
          <JsonBox>{JSON.stringify(selectedRecord?.after || {}, null, 2)}</JsonBox>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)}>Close</Button>
          <Button variant="contained" onClick={handleDownloadRecord} disabled={!selectedRecord}>
            Download Record
          </Button>
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
  max-height: 280px;
  overflow: auto;
  font-size: 12px;
`;

export default AuditPage;
