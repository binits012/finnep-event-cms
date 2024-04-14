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
  Select,
  MenuItem,
  Input,
  Chip,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { useFormik } from "formik";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { toast } from "react-toastify";

import styled from "styled-components";
import { useParams, useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { BsUpload } from "react-icons/bs";
import { GrDocumentExcel, GrTrash } from "react-icons/gr";
import { DataGrid } from "@mui/x-data-grid";
import { render } from "react-dom";
import { RxCross1 } from "react-icons/rx";
import { IoIosSearch } from "react-icons/io";

const Tickets = () => {
  const [eventDetails, setEventDetails] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const { id } = useParams();

  const [files, setFiles] = useState([]);
  const getEventTickets = useCallback(async () => {
    try {
      const response = await apiHandler("GET", `event/${id}/ticket`, true);
      console.log(response, "check res");
      setTickets(response.data?.data);
    } catch (err) {
      console.log(err);
      toast.error("Error getting tickets!");
    }
  }, [id]);
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await apiHandler("POST", `singleTicket`, true, false, {
        ...values,
        event: id,
      });
      formik.resetForm();
      toast.success(`Ticket created for ${formik.values.ticketFor}!`);
      getEventTickets();
      setLoading(false);
    } catch (err) {
      toast.error("Error Creating ticket!");
      setLoading(false);
    }
  };
  const createMultipleTickets = async (e) => {
    const formData = new FormData();
    formData.append("event", id);
    formData.append("file", files[0]);
    try {
      const response = await apiHandler(
        "POST",
        `multipleTicket`,
        true,
        true,
        formData
      );
      setFiles([]);
      toast.success(`Tickets created!`);
      getEventTickets();
    } catch (err) {
      toast.error("Error Creating tickets!");
    }
  };
  const formik = useFormik({
    initialValues: {
      ticketFor: "",
      type: "normal",
    },
    onSubmit: (values) => handleSubmit(values),
  });

  useEffect(() => {
    const getEventDetails = async () => {
      try {
        const response = await apiHandler("GET", `event/${id}`, true);
        console.log(response, "check res");
        setEventDetails(response.data?.data);
      } catch (err) {
        console.log(err);
        toast.error("Error Getting details");
      }
    };

    getEventDetails();
    getEventTickets();
  }, [getEventTickets]);
  const COLUMNS = [
    {
      field: "sn",
      headerName: "SN",
      width: 50,
      // renderCell: ()
    },
    {
      field: "ticketFor",
      headerName: "Ticket For",
      width: 250,
    },
    {
      field: "type",
      headerName: "Type",
      width: 110,
      renderCell: ({ row }) => {
        return (
          <Chip
            size="medium"
            label={row.type}
            variant="outlined"
            // color={row.type === "normal" ? "success" : "warning"}
            style={{
              borderColor: `${row.type === "normal" ? "green" : "gold"}`,
              color: `${row.type === "normal" ? "green" : "gold"}`,
              fontWeight: "bold",
            }}
          />
        );
      },
    },
    {
      field: "isSend",
      headerName: "Ticket Send",
      width: 100,
      renderCell: ({ row }) => {
        return <span>{row.isSend ? "Yes" : "No"}</span>;
      },
    },
  ];

  return (
    <FormWrapper>
      {" "}
      <CustomBreadcrumbs
        title={`Tickets for ${eventDetails?.eventTitle || ""} (${
          tickets?.length || 0
        } sold of ${eventDetails?.occupancy})`}
        links={[
          {
            path: "/tickets",
            title: "Tickets",
          },
          {
            path: `/tickets`,
            title: `Tickets for ${eventDetails?.eventTitle || ""}`,
            active: true,
          },
        ]}
      />
      <Grid container direction="column">
        <form>
          <FormSection
            showSection
            title={`Create new ticket for ${formik.values.ticketFor}`}>
            <Grid container spacing={2} alignItems={"flex-end"}>
              <Grid item container md={4} direction={"column"}>
                <FormLabel htmlFor="ticketFor" className="label">
                  Create Single New Ticket for:
                </FormLabel>
                <TextField
                  id="ticketFor"
                  name="ticketFor"
                  value={formik.values.ticketFor}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Email Address"
                  fullWidth
                  type="email"
                />
              </Grid>
              <Grid item container md={4} direction={"column"}>
                <FormLabel htmlFor="type" className="label">
                  Type of ticket
                </FormLabel>
                <Select
                  id="type"
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Type"
                  fullWidth>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="vip">VIP</MenuItem>
                </Select>
              </Grid>
              <Grid item container md={4} spacing={0}>
                <Button
                  variant="contained"
                  disabled={!formik.values.ticketFor || !formik.values.type}
                  onClick={formik.handleSubmit}
                  sx={{ height: 50 }}>
                  Create Ticket
                </Button>
                <Backdrop
                  sx={{
                    color: "#fff",
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                  }}
                  open={loading}>
                  <CircularProgress color="inherit" />
                </Backdrop>
              </Grid>
            </Grid>
          </FormSection>
        </form>

        <form>
          <FormSection showSection title={`Create Multiple Tickets`}>
            <Grid container spacing={2} alignItems={"flex-end"}>
              <Grid container item md={6} direction="column">
                {(({ files, setFiles, ...props }) => {
                  const onDrop = useCallback(
                    (acceptedFiles) => {
                      //   // console.log(acceptedFiles, "check");
                      setFiles(
                        acceptedFiles.map((file) =>
                          Object.assign(file, {
                            preview: URL.createObjectURL(file),
                          })
                        )
                      );

                      acceptedFiles.forEach((file) => {
                        const reader = new FileReader();

                        reader.onabort = () =>
                          console.log("file reading was aborted");
                        reader.onerror = () =>
                          console.log("file reading has failed");
                        reader.onload = (event) => {
                          // Do whatever you want with the file contents
                          const image = new Image();
                          const binaryStr = reader.result;
                          // console.log(binaryStr);
                          image.src = event.target.result;
                          // console.log(image, "check imagess");
                          // image.onload = () => {
                          //   console.log(
                          //     // reader,
                          //     image.width,
                          //     image.height,
                          //     image,
                          //     "chck onload",
                          //     file
                          //   );
                          // };
                          // setFiles([
                          //   {
                          //     ...file,
                          //     preview: reader.result,
                          //     preview: URL.createObjectURL(file),
                          //   },
                          //   ...files,
                          // ]);
                        };
                        reader.readAsArrayBuffer(file);
                      });
                    },
                    [setFiles]
                  );
                  const onDropRejected = useCallback((err) => {
                    console.log("seee", err, err[0].errors[0].message);
                    toast.error(`Error: ${err[0].errors[0].message} !!!!`);
                  }, []);
                  const {
                    acceptedFiles,
                    getRootProps,
                    getInputProps,
                    ...rest
                  } = useDropzone({
                    onDrop,
                    onDropRejected,
                    maxFiles: 1,
                    multiple: false,
                    // accept: {
                    //   "file/*": ["xlsx"],
                    // },
                    accept: [
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ],
                    ...props,
                  });
                  console.log(files, "check");
                  return (
                    <div style={{}}>
                      {files.length < 1 ? (
                        <div
                          {...getRootProps()}
                          style={{
                            height: 100,
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            border: "1px dashed black",
                            cursor: "pointer",
                            borderRadius: 6,
                          }}>
                          <input {...getInputProps()} />
                          <BsUpload size={32} color="green" />
                          {/* <p>Drag 'n' drop some files here, or click to select files</p> */}
                          <Typography variant="p">Drag and drop</Typography>
                          <Typography variant="p">or</Typography>
                          <Typography variant="p">
                            Select Excel Files
                          </Typography>
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 100,
                          }}>
                          {files.map((doc, i) => (
                            <div key={i}>
                              <Link href={doc.preview} target="_blank" passHref>
                                <GrDocumentExcel size={48} color={"green"} />
                              </Link>
                              <span>{doc.path}</span>
                              <span>{(doc.size / 1024).toFixed(2)} KB</span>
                              <GrTrash
                                onClick={(e) =>
                                  setFiles(
                                    files.filter((x, index) => index !== i)
                                  )
                                }
                                size={24}
                                color={"crimson"}
                                style={{
                                  cursor: "pointer",
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })({ files, setFiles })}
              </Grid>
              <Grid item container md={2.5} direction="column">
                <Button
                  variant="contained"
                  onClick={createMultipleTickets}
                  disabled={!files.length}
                  sx={{ height: 50 }}>
                  Create Multiple Tickets
                </Button>
                <Backdrop
                  sx={{
                    color: "#fff",
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                  }}
                  open={loading}>
                  <CircularProgress color="inherit" />
                </Backdrop>
              </Grid>
            </Grid>
          </FormSection>
        </form>

        {/* {tickets.map((ticket, index) => (
          <div key={ticket._id} style={{ display: "flex", margin: 10 }}>
            <h2>
              <span>{index + 1}</span> for {ticket.ticketFor}
            </h2>
            <span>{ticket.type}</span>
            <span>{ticket.isSend ? "Sent" : "Not Sent"}</span>
            <span>{ticket.isRead ? "Acknowledged" : "Not Acknowledged"}</span>
          </div>
        ))} */}
        <DataGrid
          rows={tickets.filter((ticket) =>
            ticket.ticketFor.toLowerCase().includes(search.toLowerCase())
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
      </Grid>
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
export default Tickets;
