"use client";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import FormSection from "@/components/FormSection";
import TextEditor from "@/components/TextEditor";
import { Grid, Typography, FormLabel, TextField, Button } from "@mui/material";
import { useFormik } from "formik";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { toast } from "react-toastify";

import styled from "styled-components";
import { useParams, useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { BsUpload } from "react-icons/bs";
import { GrDocumentExcel, GrTrash } from "react-icons/gr";

const Tickets = () => {
  const [eventDetails, setEventDetails] = useState(null);
  const [tickets, setTickets] = useState([]);
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
    try {
      const response = await apiHandler("POST", `singleTicket`, true, false, {
        ...values,
        event: id,
        type: "normal",
      });
      formik.resetForm();
      toast.success(`Ticket created for ${formik.values.ticketFor}!`);
      getEventTickets();
    } catch (err) {
      toast.error("Error Creating ticket!");
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

  return (
    <FormWrapper>
      {" "}
      <CustomBreadcrumbs
        title={`Tickets for ${eventDetails?.eventTitle || ""}`}
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
            title={`Create new ticket for ${formik.values.ticketFor}`}
          >
            <Grid container spacing={2} alignItems={"flex-end"}>
              <Grid item container md={6} direction={"column"}>
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
              <Grid item container md={6} spacing={0}>
                <Button
                  variant="contained"
                  onClick={formik.handleSubmit}
                  sx={{ height: 50 }}
                >
                  Create Ticket
                </Button>
              </Grid>
            </Grid>
          </FormSection>
        </form>

        <form>
          <FormSection title={`Create Multiple Tickets`}>
            <Grid container direction="column">
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
                const { acceptedFiles, getRootProps, getInputProps, ...rest } =
                  useDropzone({
                    onDrop,
                    onDropRejected,
                    maxFiles: 1,
                    multiple: false,
                    // accept: {
                    //   "file/*": ["xlsx"],
                    // },
                    accept: [".xlsx"],
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
                          width: 600,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          border: "1px dashed black",
                        }}
                      >
                        <input {...getInputProps()} />
                        <BsUpload size={24} color="var(--primary)" />
                        {/* <p>Drag 'n' drop some files here, or click to select files</p> */}
                        <Typography variant="p">Drag and drop</Typography>
                        <Typography variant="p">or</Typography>
                        <Typography variant="p">Select Excel Files</Typography>
                      </div>
                    ) : (
                      <div
                        style={{
                          height: 100,
                        }}
                      >
                        {files.map((doc, i) => (
                          <div key={i}>
                            <GrDocumentExcel size={32} />
                            <span>{doc.path}</span>
                            <span>{(doc.size / 1024).toFixed(2)} KB</span>
                            <GrTrash
                              onClick={(e) =>
                                setFiles(
                                  files.filter((x, index) => index !== i)
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })({ files, setFiles })}
            </Grid>
            <Grid item container md={6} spacing={0}>
              <Button
                variant="contained"
                onClick={createMultipleTickets}
                disabled={!files.length}
                sx={{ height: 50 }}
              >
                Create Multiple Tickets
              </Button>
            </Grid>
          </FormSection>
        </form>

        {tickets.map((ticket, index) => (
          <div key={ticket._id} style={{ display: "flex", margin: 10 }}>
            <h2>
              <span>{index + 1}</span> for {ticket.ticketFor}
            </h2>
            <span>{ticket.type}</span>
            <span>{ticket.isSend ? "Sent" : "Not Sent"}</span>
            <span>{ticket.isRead ? "Acknowledged" : "Not Acknowledged"}</span>
          </div>
        ))}
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
