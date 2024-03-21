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
import React, { useCallback, useState } from "react";
import { Box, IconButton } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { DataGrid } from "@mui/x-data-grid";
import { useDropzone } from "react-dropzone";

const columns = [
  { field: "id", headerName: "ID", width: 90 },
  {
    field: "firstName",
    headerName: "First name",
    width: 150,
    editable: true,
  },
  {
    field: "lastName",
    headerName: "Last name",
    width: 150,
    editable: true,
  },
  {
    field: "age",
    headerName: "Age",
    type: "number",
    width: 110,
    editable: true,
  },
  {
    field: "fullName",
    headerName: "Full name",
    description: "This column has a value getter and is not sortable.",
    sortable: false,
    width: 160,
    valueGetter: (params) =>
      `${params.row.firstName || ""} ${params.row.lastName || ""}`,
  },
];

const rows = [
  { id: 1, lastName: "Snow", firstName: "Jon", age: 14 },
  { id: 2, lastName: "Lannister", firstName: "Cersei", age: 31 },
  { id: 3, lastName: "Lannister", firstName: "Jaime", age: 31 },
  { id: 4, lastName: "Stark", firstName: "Arya", age: 11 },
  { id: 5, lastName: "Targaryen", firstName: "Daenerys", age: null },
  { id: 6, lastName: "Melisandre", firstName: null, age: 150 },
  { id: 7, lastName: "Clifford", firstName: "Ferrara", age: 44 },
  { id: 8, lastName: "Frances", firstName: "Rossini", age: 36 },
  { id: 9, lastName: "Roxie", firstName: "Harvey", age: 65 },
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
      }}>
      <input {...getInputProps()} />
      <p>Drag 'n' drop some files here, or click to select files</p>
    </div>
  );
};

const Event = () => {
  const [filePreviews, setFilePreviews] = useState([]);

  const handleFileDrop = (files) => {
    // Handle the dropped files here, for example, you can log them to the console
    console.log("Dropped files:", files);
  };

  return (
    <div
      id="event"
      style={{ height: 400, width: "100%", padding: "20px 0 0 20px" }}>
      <Box sx={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
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
          }}>
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
