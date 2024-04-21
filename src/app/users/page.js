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
import { toast } from "react-toastify";
import styled from "styled-components";

const Users = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const res = await apiHandler("GET", "user/admin", true);
        console.log(res);
        setUsers(res.data.data || []);
      } catch (err) {
        console.log(err);
        toast.error(err.message);
      }
    };
    getUserDetails();
  }, []);

  const handleAskForDelete = async (e, row) => {
    console.log(row);
    const res = await apiHandler("DELETE", `/user/${row._id}`, true);
    console.log(res);
    if (res.status === 204) {
      toast.success("User disabled successfully");
    }
  };

  const COLUMN = [
    {
      field: "name",
      headerName: "Username",
      width: 150,
    },
    {
      field: `role`,
      headerName: "Role",
      width: 70,
      renderCell({ row }) {
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
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
            {" "}
            <AiOutlineStop
              size={24}
              color={`${"#C73F33"}`}
              title="Disable User"
              style={{ marginLeft: 10, cursor: "pointer" }}
              // di
              onClick={(e) => handleAskForDelete(e, row)}
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
          <Button variant="contained" onClick={() => setOpen(true)}>
            + Add User
          </Button>
        </Link>
      </Grid>
      <DataGrid
        rows={users.filter((user) =>
          user.name.toLowerCase().includes(search.toLowerCase())
        )}
        columns={COLUMN}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5, 10, 20]}
        getRowId={(row) => row._id}
        disableSelectionOnClick
        loading={users.length === 0}
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
                    onClick={(e) => setSearch("")}
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
              }}>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <h2>loading </h2>
                <PulseLoader
                  // color="#ffde59"
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
