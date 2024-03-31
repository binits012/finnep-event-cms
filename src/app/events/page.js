"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Grid, IconButton } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { DataGrid } from "@mui/x-data-grid";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
import apiHandler from "@/RESTAPIs/helper";
import moment from "moment";
import { MdOutlineEdit, MdOutlineRemoveRedEye } from "react-icons/md";
import { HiOutlineTrash } from "react-icons/hi";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import Modal from "@/components/Modal";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [targetRowId, setTargetRowId] = useState(null);
  console.log(selectedEvent, "check selected event");

  const COLUMNS = [
    {
      field: "eventTitle",
      headerName: "Title",
      width: 150,
      editable: true,
    },
    {
      field: "occupancy",
      headerName: "Occupancy",
      width: 150,
      editable: true,
    },
    {
      field: "eventDate",
      headerName: "Date",
      type: "number",
      width: 110,
      editable: true,
      renderCell: ({ row }) => (
        <span>{moment(row.eventDate).format("MMM DD YYYY")}</span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 110,
      editable: false,
      sortable: false,
      renderCell: ({ row }) => (
        <Box
          direction="row"
          width="100%"
          justify="space-between"
          className="actions">
          <Link href={`/events/edit/${row._id}`} passHref>
            <MdOutlineEdit
              size={24}
              color="#4C4C4C"
              title="Edit Event"
              style={{ marginLeft: 10, cursor: "pointer" }}
            />
          </Link>

          <HiOutlineTrash
            size={24}
            color={`${"#C73F33"}`}
            title="Delete Event"
            style={{ marginLeft: 10, cursor: "pointer" }}
            // di
            // onClick={(e) => handleAskForDelete(e, row)}
          />

          <MdOutlineRemoveRedEye
            size={24}
            color="#4C4C4C"
            title="View Event"
            style={{ marginLeft: 5, cursor: "pointer" }}
            onClick={() => {
              setShowModal(true);
              setTargetRowId(row._id);
              setSelectedEvent(row);
              console.log(row, "modal");
              console.log(targetRowId, "target");
            }}
          />
        </Box>
      ),
    },
  ];
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiHandler("GET", "event", true);
        console.log(res, "check res");
        setEvents(res.data.data || []);
      } catch (err) {
        console.log(err);
        toast.error("Error getting events!!");
      }
    };
    fetchEvents();
  }, []);
  // console.log(events, "TESTTTTTTTT");
  return (
    <>
      <div
        id="event"
        style={{ height: 400, width: "100%", padding: "20px 0 0 20px" }}>
        <CustomBreadcrumbs
          title={"Events"}
          links={[
            {
              path: "/events",
              title: "Events",
              active: true,
            },
          ]}
        />
        <Grid container justifyContent="flex-end" mb={2}>
          <Link passHref href="/events/add">
            <Button variant="contained">+ Add Events</Button>
          </Link>
        </Grid>
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={events}
            columns={COLUMNS}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            pageSizeOptions={[5]}
            disableRowSelectionOnClick
            getRowId={(row) => row._id}
          />
        </Box>
      </div>
      <Modal
        isVisible={showModal}
        onClose={() => setShowModal(false)}
        targetRowId={targetRowId}>
        <div>
          {/* <h1>{selectedEvent.eventTitle}</h1>
          <p>{selectedEvent.eventDescription}</p> */}
          {/* <p>{selectedEvent.eventTime}</p>
          <p>{moment(selectedEvent.eventDate).format("MMM DD YYYY")}</p>
          <p>{selectedEvent.eventPrice}</p>
          <p>{selectedEvent.occupancy}</p>
          <p>{selectedEvent.eventLocationAddress}</p>
          <p>{selectedEvent.eventLocationGeoCode}</p>
          <p>{selectedEvent.eventPromotionPhoto}</p> */}
        </div>
      </Modal>
    </>
  );
};

export default Events;

// curl --location 'https://eventapp.finnep.fi/api/event' \
// --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InllbGxvd0JyaWRnZSIsInJvbGUiOiJzdXBlckFkbWluIiwiaWQiOiI2NWZkZWU5NTg0MWJkNjAyYzkwOGExZTIiLCJpYXQiOjE3MTEyOTAzNzYsImV4cCI6MTcxMTQ2MzE3Nn0.Oje0AWz1v0VW3RRfSy7GlJAOlKhXmYhhkl3uAwnLAFw'
