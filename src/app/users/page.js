"use client";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import { Box, Button, Chip, Grid, Input } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { AiOutlineStop } from "react-icons/ai";
import { IoIosSearch } from "react-icons/io";
import { RxCross1 } from "react-icons/rx";
import { PulseLoader } from "react-spinners";
import styled from "styled-components";
import { TiTickOutline } from "react-icons/ti";
import toast from "react-hot-toast";

const Users = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUserDetails = async () => {
      setLoading(true);
      try {
        const res = await apiHandler("GET", "user/admin", true);
        setUsers(res.data.data || []);
      } catch (err) {
        console.log(err);
        toast.error(err.message);
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
        toast.success(`User ${status ? "enabled" : "disabled"} successfully`);
      } else {
        toast.error(`Failed to ${status ? "enable" : "disable"} user`);
      }
    } catch (error) {
      console.error(
        `An error occurred while ${
          status ? "enabling" : "disabling"
        } the user:`,
        error
      );
      toast.error(
        `An error occurred while ${status ? "enabling" : "disabling"} the user`
      );
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
      width: 200,
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
            {row.role.roleType}
          </div>
        );
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
      renderCell({ row }) {
        return (
          <Box>
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
          </Box>
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
