"use client";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import { Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, FormLabel, Grid, Input, Stack, Typography } from "@mui/material";
import { STRIPE_COUNTRY_OPTIONS } from "@/constants/stripeCountries";
import { DataGrid } from "@mui/x-data-grid";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { AiOutlineStop } from "react-icons/ai";
import { IoIosSearch } from "react-icons/io";
import { RxCross1 } from "react-icons/rx";
import { PulseLoader } from "react-spinners";
import styled from "styled-components";
import { TiTickOutline } from "react-icons/ti";
import Swal from "sweetalert2";

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
    return JSON.parse(jsonPayload).role || null;
  } catch {
    return null;
  }
}

const Users = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRegionalUser, setEditingRegionalUser] = useState(null);
  const [selectedCountryCodes, setSelectedCountryCodes] = useState([]);
  const currentRole = typeof window !== "undefined"
    ? parseJwtRole(localStorage.getItem("accessToken"))
    : null;
  const canManageRegionalUsers = currentRole === "superAdmin";

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  useEffect(() => {
    const getUserDetails = async () => {
      setLoading(true);
      try {
        const adminRes = await apiHandler("GET", "user/admin", true);
        const token = localStorage.getItem("accessToken");
        const role = parseJwtRole(token);
        let regionalUsers = [];

        if (role === "superAdmin") {
          const regionalRes = await apiHandler("GET", "user/regional", true);
          regionalUsers = regionalRes.data.data || [];
        }

        setUsers([...(adminRes.data.data || []), ...regionalUsers]);
      } catch (err) {
        Toast.fire({
          icon: "error",
          title: err?.response?.data?.message || err.message,
        });
      } finally {
        setLoading(false);
      }
    };
    getUserDetails();
  }, []);

  const updateUserStatus = async (row, status) => {
    setLoading(true);
    try {
      const payload = { active: status };
      const res = await apiHandler(
        "PATCH",
        `/user/${row._id}`,
        true,
        false,
        payload
      );

      if (res.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === row._id ? { ...user, active: status } : user
          )
        );

        Toast.fire({
          icon: "success",
          title: `User ${status ? "enabled" : "disabled"} successfully`,
        });
      } else {
        Toast.fire({
          icon: "error",
          title: `Failed to ${status ? "enable" : "disable"} user`,
        });
      }
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: `An error occurred while ${
          status ? "enabling" : "disabling"
        } the user`,
      });
    } finally {
      setLoading(false);
    }
  };

  const openRegionalScopeDialog = (row) => {
    setEditingRegionalUser(row);
    setSelectedCountryCodes(
      Array.isArray(row.allowedCountryCodes) ? row.allowedCountryCodes : []
    );
  };

  const closeRegionalScopeDialog = () => {
    setEditingRegionalUser(null);
    setSelectedCountryCodes([]);
  };

  const toggleCountryCode = (countryCode) => {
    setSelectedCountryCodes((currentCodes) =>
      currentCodes.includes(countryCode)
        ? currentCodes.filter((code) => code !== countryCode)
        : [...currentCodes, countryCode]
    );
  };

  const saveRegionalScope = async () => {
    if (!editingRegionalUser) return;
    if (selectedCountryCodes.length === 0) {
      Toast.fire({
        icon: "error",
        title: "Select at least one country for regional users",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await apiHandler(
        "PATCH",
        `/user/${editingRegionalUser._id}`,
        true,
        false,
        { allowedCountryCodes: selectedCountryCodes }
      );

      if (res.status === 200) {
        const allowedCountryCodes =
          res.data?.data?.allowedCountryCodes || selectedCountryCodes;

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === editingRegionalUser._id
              ? { ...user, scopeType: "regional", allowedCountryCodes }
              : user
          )
        );
        closeRegionalScopeDialog();
        Toast.fire({
          icon: "success",
          title: "Regional scope updated successfully",
        });
      }
    } catch (err) {
      Toast.fire({
        icon: "error",
        title: err?.response?.data?.message || "Failed to update regional scope",
      });
    } finally {
      setLoading(false);
    }
  };

  const COLUMN = [
    {
      field: "name",
      headerName: "Name",
      headerClassName: "column-header",
      cellClassName: "column-cell",
      width: 200,
    },
    {
      field: "role",
      headerName: "Role",
      width: 180,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      renderCell({ row }) {
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {row.role?.roleType || "-"}
          </div>
        );
      },
    },
    {
      field: "scopeType",
      headerName: "Scope",
      width: 140,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      renderCell({ row }) {
        return row.scopeType || "global";
      },
    },
    {
      field: "allowedCountryCodes",
      headerName: "Countries",
      width: 200,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      renderCell({ row }) {
        const countries = Array.isArray(row.allowedCountryCodes)
          ? row.allowedCountryCodes
          : [];
        return countries.length ? countries.join(", ") : "All";
      },
    },
    {
      field: "notificationAllowed",
      headerName: "Notification",
      width: 120,
      renderCell({ row }) {
        return (
          <Chip
            size="medium"
            label={row.notificationAllowed ? "Allowed" : "Not Allowed"}
            variant="outlined"
            style={{
              display: "flex",
              width: "100%",
              borderColor: `${
                row.notificationAllowed === true ? "green" : "red"
              }`,
              color: `${row.notificationAllowed === true ? "green" : "red"}`,
              fontWeight: "bold",
            }}
          />
        );
      },
    },
    {
      field: "active",
      headerName: "Active Status",
      width: 100,
      sortable: false,
      renderCell({ row }) {
        return (
          <Chip
            size="medium"
            label={row.active ? "Active" : "Inactive"}
            variant="outlined"
            style={{
              display: "flex",
              width: "100%",
              borderColor: `${row.active === true ? "green" : "red"}`,
              color: `${row.active === true ? "green" : "red"}`,
              fontWeight: "bold",
            }}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      
      renderCell({ row }) {
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <TiTickOutline
              size={24}
              color={`green`}
              title="Enable User"
              style={{ cursor: "pointer" }}
              onClick={() => updateUserStatus(row, true)}
            />
            <AiOutlineStop
              size={24}
              color={`${"#C73F33"}`}
              title="Disable User"
              style={{ marginLeft: 10, cursor: "pointer" }}
              onClick={() => updateUserStatus(row, false)}
            />
            {canManageRegionalUsers && row.role?.roleType === "regionalOps" ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() => openRegionalScopeDialog(row)}
              >
                Edit scope
              </Button>
            ) : null}
          </Stack>
        );
      },
    },
  ];

  return (
    <FormWrapper>
      <CustomBreadcrumbs
        title={`Users / Users Details`}
        links={[
          {
            path: "/users",
            title: "Users",
            active: true,
          },
        ]}
      />
      <Grid container justifyContent="flex-end" mb={2}>
        <Link passHref href="/users/add">
          <Button variant="contained">+ Add User</Button>
        </Link>
      </Grid>
      <StyledDataGrid
        rows={users.filter((user) =>
          user.name.toLowerCase().includes(search.toLowerCase())
        )}
        columns={COLUMN}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        pageSizeOptions={[10, 15, 20]}
        getRowId={(row) => row._id}
        disableSelectionOnClick
        isRowSelectable={() => false}
        loading={loading}
        slots={{
          toolbar: () => (
            <Input
              placeholder="Search Username"
              value={search}
              sx={{
                width: 200,
                margin: 2,
                "--Input-focusedInset": "var(--any, )",
                "--Input-focusedThickness": "0.50rem",
                "--Input-focusedHighlight": "rgba(13,110,253,.25)",
                "&::before": {
                  transition: "box-shadow .15s ease-in-out",
                },
                "&:focus-within": {
                  borderColor: "#86b7fe",
                },
              }}
              onChange={(e) => setSearch(e.target.value)}
              endAdornment={
                search && search !== " " ? (
                  <RxCross1
                    size={25}
                    style={{
                      margin: 8,
                      cursor: "pointer",
                    }}
                    onClick={() => setSearch("")}
                  />
                ) : (
                  <IoIosSearch
                    size={30}
                    style={{
                      margin: 8,
                      cursor: "pointer",
                    }}
                  />
                )
              }
            />
          ),
          loadingOverlay: () => (
            <div
              style={{
                height: 300,
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <PulseLoader
                  color="#000000"
                  margin={2}
                  size={7}
                  speedMultiplier={0.5}
                />
              </div>
            </div>
          ),
        }}
      />
      <Dialog
        fullWidth
        maxWidth="md"
        open={Boolean(editingRegionalUser)}
        onClose={closeRegionalScopeDialog}
      >
        <DialogTitle>Edit Regional Scope</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography fontWeight={700}>
                {editingRegionalUser?.name || "Regional user"}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Select the countries this regional user can access.
              </Typography>
            </Box>
            <FormLabel>Allowed Countries</FormLabel>
            <FormGroup
              row
              sx={{
                maxHeight: 360,
                overflowY: "auto",
              }}
            >
              {STRIPE_COUNTRY_OPTIONS.map((country) => (
                <FormControlLabel
                  key={country.code}
                  control={
                    <Checkbox
                      checked={selectedCountryCodes.includes(country.code)}
                      onChange={() => toggleCountryCode(country.code)}
                    />
                  }
                  label={`${country.label} (${country.code})`}
                  sx={{ width: { xs: "100%", sm: "48%", md: "32%" } }}
                />
              ))}
            </FormGroup>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRegionalScopeDialog}>Cancel</Button>
          <Button disabled={loading} variant="contained" onClick={saveRegionalScope}>
            Update scope
          </Button>
        </DialogActions>
      </Dialog>
    </FormWrapper>
  );
};

const StyledDataGrid = styled(DataGrid)`
  .column-header {
    font-size: 20px;
  }

  .column-cell {
    font-size: 18px;
  }
  .MuiDataGrid-cell:focus,
  .MuiDataGrid-cell:focus-within {
    outline: none !important;
  }
`;

const FormWrapper = styled.div`
  width: 100%;
  padding: 30px;
  h1 {
    margin-bottom: 30px;
  }
  .MuiTimeClock-root {
    margin: 0;
  }
  .MuiDialogActions-root {
    justify-content: flex-start;
  }
`;

export default Users;
