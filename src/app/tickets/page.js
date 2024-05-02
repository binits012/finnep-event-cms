"use client";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import FormSection from "@/components/FormSection";
import TextEditor from "@/components/TextEditor";
import {
  Grid,
  Typography,
  FormLabel,
  TextField,
  Button,
  CircularProgress,
  Input,
} from "@mui/material";
import { Field, useFormik } from "formik";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import styled from "styled-components";
import { DataGrid } from "@mui/x-data-grid";
import { render } from "react-dom";
import { RxCross1 } from "react-icons/rx";
import { IoIosSearch } from "react-icons/io";

const Tickets = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const getEvents = async () => {
      try {
        const response = await apiHandler("GET", "event", true);
        console.log(response, "check res");
        setEvents(response.data?.data);
      } catch (err) {
        console.log(err);
        toast.error("Error Getting details");
      }
    };
    getEvents();
  }, []);
  const COLUMNS = [
    {
      field: "eventTitle",
      headerName: "Title",
      width: 250,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      // editable: true,
      renderCell: ({ row }) => {
        return <Link href={`/tickets/${row._id}`}>{row.eventTitle}</Link>;
      },
    },
    {
      field: "eventPrice",
      headerName: "Price",
      width: 80,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      // editable: true,
      renderCell: (abc, def) => {
        // console.log(def, abc, "test 123434245");
        return <span>{abc.row.eventPrice.$numberDecimal}</span>;
      },
    },
    {
      field: "occupancy",
      headerName: "Occupancy",
      width: 130,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      sortable: false,
      // editable: true,
    },
    // {
    //   field: "status",
    //   headerName: "Tickets Sold",
    //   width: 90,
    //   sortable: false,
    //   // editable: true,
    //   renderCell: ({ row }) => {
    //     return <CircularProgress variant="determinate" value={row.occupancy} />;
    //   },
    // },
  ];
  return (
    <FormWrapper>
      {" "}
      <CustomBreadcrumbs
        title={`Tickets `}
        links={[
          {
            path: "/tickets",
            title: "Tickets",
            active: true,
          },
        ]}
      />
      <h2> Check tickets for following individual events </h2>
      {/* <div>
        {events.map((event, index) => (
          <div key={event._id} style={{ display: "flex", margin: 5 }}>
            <Link href={`/tickets/${event._id}`}>
              <span>{index + 1}</span>
              <h3>{event.eventTitle}</h3>
            </Link>
          </div>
        ))}
      </div>  */}
      <StyledDataGrid
        rows={events.filter((event) =>
          event.eventTitle.toLowerCase().includes(search.toLowerCase())
        )}
        columns={COLUMNS}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5, 10, 15, 20]}
        getRowId={(row) => row._id}
        slots={{
          toolbar: () => (
            <Input
              // variant="soft"
              placeholder="Search Event"
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
export default Tickets;
