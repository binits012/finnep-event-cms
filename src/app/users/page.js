"use client";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import { DataGrid } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styled from "styled-components";

const Users = () => {
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

  const COLUMN = [
    {
      field: "name",
      headerName: "Name",
      width: 200,
    },
    {
      field: `role`,
      headerName: "Role",
      width: 200,
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
      <DataGrid
        rows={users}
        columns={COLUMN}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 4,
            },
          },
        }}
        pageSizeOptions={[1, 2, 4]}
        getRowId={(row) => row._id}
        disableSelectionOnClick
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
