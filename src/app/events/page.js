// import { Box } from "@mui/material";
// import { DataGrid } from "@mui/x-data-grid";
// import React from "react";

// const columns = [
//   { field: "id", headerName: "ID", width: 90 },
//   {
//     field: "firstName",
//     headerName: "First name",
//     width: 150,
//     editable: true,
//   },
//   {
//     field: "lastName",
//     headerName: "Last name",
//     width: 150,
//     editable: true,
//   },
//   {
//     field: "age",
//     headerName: "Age",
//     type: "number",
//     width: 110,
//     editable: true,
//   },
//   {
//     field: "fullName",
//     headerName: "Full name",
//     description: "This column has a value getter and is not sortable.",
//     sortable: false,
//     width: 160,
//     valueGetter: (params) =>
//       `${params.row.firstName || ""} ${params.row.lastName || ""}`,
//   },
// ];

// const rows = [
//   { id: 1, lastName: "Snow", firstName: "Jon", age: 14 },
//   { id: 2, lastName: "Lannister", firstName: "Cersei", age: 31 },
//   { id: 3, lastName: "Lannister", firstName: "Jaime", age: 31 },
//   { id: 4, lastName: "Stark", firstName: "Arya", age: 11 },
//   { id: 5, lastName: "Targaryen", firstName: "Daenerys", age: null },
//   { id: 6, lastName: "Melisandre", firstName: null, age: 150 },
//   { id: 7, lastName: "Clifford", firstName: "Ferrara", age: 44 },
//   { id: 8, lastName: "Frances", firstName: "Rossini", age: 36 },
//   { id: 9, lastName: "Roxie", firstName: "Harvey", age: 65 },
// ];

// const Event = () => {
//   return (
//     <div id="event">
//       <Box sx={{ height: 400, width: "100%" }}>
//         <DataGrid
//           rows={rows}
//           columns={columns}
//           initialState={{
//             pagination: {
//               paginationModel: {
//                 pageSize: 5,
//               },
//             },
//           }}
//           pageSizeOptions={[5]}
//           checkboxSelection
//           disableRowSelectionOnClick
//         />
//       </Box>
//     </div>
//   );
// };

// export default Event;

"use client";
<<<<<<< HEAD
import React, { useCallback, useState } from "react";
import { Box, Button, IconButton } from "@mui/material";
=======
import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Grid, IconButton } from "@mui/material";
>>>>>>> main
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { DataGrid } from "@mui/x-data-grid";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
<<<<<<< HEAD
=======
import axios from "axios";
import { toast } from "react-toastify";
>>>>>>> main

const columns = [
  { field: "id", headerName: "ID", width: 90 },
  {
    field: "title",
    headerName: "Title",
    width: 150,
    editable: true,
  },
  {
    field: "event",
    headerName: "Event",
    width: 150,
    editable: true,
  },
  {
    field: "date ",
    headerName: "Date",
    type: "number",
    width: 160,
    editable: true,
  },
  {
    field: "location",
    headerName: "Location",
    description: "This column has a value getter and is not sortable.",
    sortable: false,
    width: 160,
  },
];

const rows = [
  // { id: 1, lastName: "Snow", firstName: "Jon", age: 14 },
  // { id: 2, lastName: "Lannister", firstName: "Cersei", age: 31 },
  // { id: 3, lastName: "Lannister", firstName: "Jaime", age: 31 },
  // { id: 4, lastName: "Stark", firstName: "Arya", age: 11 },
  // { id: 5, lastName: "Targaryen", firstName: "Daenerys", age: null },
  // { id: 6, lastName: "Melisandre", firstName: null, age: 150 },
  // { id: 7, lastName: "Clifford", firstName: "Ferrara", age: 44 },
  // { id: 8, lastName: "Frances", firstName: "Rossini", age: 36 },
  // { id: 9, lastName: "Roxie", firstName: "Harvey", age: 65 },
  {
    id: 1,
    title: "Title",
    event: "Event",
    date: "01 / 02 / 2024",
    location: "Location",
  },
  { id: 2, title: "Title", event: "Event", date: "Date", location: "Location" },
  { id: 3, title: "Title", event: "Event", date: "Date", location: "Location" },
  { id: 4, title: "Title", event: "Event", date: "Date", location: "Location" },
  { id: 5, title: "Title", event: "Event", date: "Date", location: "Location" },
  { id: 6, title: "Title", event: "Event", date: "Date", location: "Location" },
  { id: 7, title: "Title", event: "Event", date: "Date", location: "Location" },
  { id: 8, title: "Title", event: "Event", date: "Date", location: "Location" },
  { id: 9, title: "Title", event: "Event", date: "Date", location: "Location" },
  {
    id: 10,
    title: "Title",
    event: "Event",
    date: "Date",
    location: "Location",
  },
  {
    id: 11,
    title: "Title",
    event: "Event",
    date: "Date",
    location: "Location",
  },
  {
    id: 12,
    title: "Title",
    event: "Event",
    date: "Date",
    location: "Location",
  },
  {
    id: 13,
    title: "Title",
    event: "Event",
    date: "Date",
    location: "Location",
  },
  {
    id: 14,
    title: "Title",
    event: "Event",
    date: "Date",
    location: "Location",
  },
  {
    id: 15,
    title: "Title",
    event: "Event",
    date: "Date",
    location: "Location",
  },
  {
    id: 16,
    title: "Title",
    event: "Event",
    date: "Date",
    location: "Location",
  },
  {
    id: 17,
    title: "Title",
    event: "Event",
    date: "Date",
    location: "Location",
  },
  {
    id: 18,
    title: "Title",
    event: "Event",
    date: "Date",
    location: "Location",
  },
  {
    id: 19,
    title: "Title",
    event: "Event",
    date: "Date",
    location: "Location",
  },
];

const DropzoneComponent = ({ onFileDrop, filePreviews, setFilePreviews }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      onFileDrop(acceptedFiles);
      setFilePreviews(
        acceptedFiles.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }))
      );
    },
    [onFileDrop]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      style={{
        border: "1px dashed black",
        padding: "20px",
        margin: "10px 0",
        textAlign: "center",
      }}
    >
      <input {...getInputProps()} />
      <p>Drag 'n' drop some files here, or click to select files</p>
    </div>
  );
};

const Event = () => {
  const [filePreviews, setFilePreviews] = useState([]);

  const handleFileDrop = (files) => {
    console.log("Dropped files:", files);
  };
<<<<<<< HEAD
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 8,
    page: 10,
  });
  return (
    <div
      id="event"
      style={{ height: 400, width: "100%", padding: "20px 0 0 20px" }}>
      <div className="add-btn">
        <Link href="/events/add">
          <Button variant="contained" sx={{ width: "100px", mb: 2 }}>
            Add
          </Button>
        </Link>
      </div>
      <Box sx={{ height: 500, width: 1000 }}>
=======

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios({
          method: "GET",
          baseURL: process.env.NEXT_PUBLIC_API_URL,
          url: "event",
        });
        console.log(res, "check res");
      } catch (err) {
        console.log(err);
        toast.error("Error getting events!!");
      }
    };
    fetchEvents();
    console.log("TESTTTTTTTT");
  }, []);

  return (
    <div
      id="event"
      style={{ height: 400, width: "100%", padding: "20px 0 0 20px" }}
    >
      <Grid container justifyContent="flex-end" mb={2}>
        <Link passHref href="/events/add">
          <Button variant="container">+ Add Event</Button>
        </Link>
      </Grid>
      <Box sx={{ height: 400, width: "100%" }}>
>>>>>>> main
        <DataGrid
          rows={rows}
          columns={columns}
          // initialState={{
          //   pagination: {
          //     paginationModel: {
          //       pageSize: 8,
          //     },
          //   },
          // }}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5]}
          checkboxSelection
          disableRowSelectionOnClick
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "8px",
          }}
        >
          <IconButton color="primary" component="span">
            <CloudUploadIcon />
          </IconButton>
          <DropzoneComponent
            onFileDrop={handleFileDrop}
            setFilePreviews={setFilePreviews}
            filePreviews={filePreviews}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", padding: "8px" }}>
          <Box mt={4} display="flex" flexWrap="wrap">
            {filePreviews.map((file, index) => (
              <Box key={index} mr={1} mb={1}>
                <img
                  src={file.preview}
                  alt={`Preview ${index}`}
                  style={{ maxWidth: 100, maxHeight: 100 }}
                />
              </Box>
            ))}
          </Box>
        </div>
      </Box>
    </div>
  );
};

export default Event;

// curl --location 'https://eventapp.finnep.fi/api/event' \
// --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InllbGxvd0JyaWRnZSIsInJvbGUiOiJzdXBlckFkbWluIiwiaWQiOiI2NWZkZWU5NTg0MWJkNjAyYzkwOGExZTIiLCJpYXQiOjE3MTEyOTAzNzYsImV4cCI6MTcxMTQ2MzE3Nn0.Oje0AWz1v0VW3RRfSy7GlJAOlKhXmYhhkl3uAwnLAFw'
