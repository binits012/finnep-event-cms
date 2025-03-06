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
  IconButton,
} from "@mui/material";
import { useFormik } from "formik";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useParams, useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { BsUpload } from "react-icons/bs";
import { GrDocumentExcel, GrTrash } from "react-icons/gr";
import { DataGrid } from "@mui/x-data-grid";
import { RxCross1 } from "react-icons/rx";
import { IoIosSearch } from "react-icons/io";
import { IoReload } from "react-icons/io5";
import { PulseLoader } from "react-spinners";
import Swal from "sweetalert2";
import { IoMdEye } from "react-icons/io";
import jsPDF from "jspdf";
import { FaDownload } from "react-icons/fa";

const Tickets = () => {
  const [eventDetails, setEventDetails] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketInfo, setTicketInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [ticketCodeSearch, setTicketCodeSearch] = useState("");
  const { id } = useParams();
  const [files, setFiles] = useState([]);
  const [viewEmail, setViewEmail] = useState({});
  const [checkedInTickets, setCheckedInTickets] = useState({});
  const [emailInputHasFocus, setEmailInputHasFocus] = useState(false);
  const [ticketCodeInputHasFocus, setTicketCodeInputHasFocus] = useState(false);

  // Add refs for search inputs
  const emailSearchRef = useRef(null);
  const ticketCodeSearchRef = useRef(null);

  useEffect(() => {
    if (emailInputHasFocus) {
      // Immediate focus attempt
      emailSearchRef.current?.focus();
      
      // Backup focus in case the first attempt fails
      const focusTimer = setTimeout(() => {
        emailSearchRef.current?.focus();
      }, 0);
      
      return () => clearTimeout(focusTimer);
    }
  }, [search, emailInputHasFocus]);
  
  useEffect(() => {
    if (ticketCodeInputHasFocus) {
      // Immediate focus attempt
      ticketCodeSearchRef.current?.focus();
      
      // Backup focus in case the first attempt fails
      const focusTimer = setTimeout(() => {
        ticketCodeSearchRef.current?.focus();
      }, 0);
      
      return () => clearTimeout(focusTimer);
    }
  }, [ticketCodeSearch, ticketCodeInputHasFocus]);

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  const downloadTicketsPDF = () => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();

      // Add event details as a header
      doc.setFontSize(18);
      doc.text(`Tickets for: ${eventDetails?.eventTitle || 'Event'}`, 15, 15);

      doc.setFontSize(12);
      doc.text(`Event Date: ${eventDetails?.eventDate || 'N/A'}`, 15, 25);
      doc.text(`Location: ${eventDetails?.eventLocationAddress || 'N/A'}`, 15, 33);

      // Add ticket details
      doc.setFontSize(14);
      doc.text('Ticket Details:', 15, 45);

      let yPos = 55;

      // Table headers
      doc.setFontSize(10);
      doc.text('Email', 15, yPos);
      doc.text('Code', 65, yPos);
      doc.text('Type', 95, yPos);
      doc.text('Quantity', 110, yPos);
      doc.text('Price', 130, yPos);
      doc.text('Total', 150, yPos);
      yPos += 7;

      // Draw a line under headers
      doc.line(15, yPos - 3, 195, yPos - 3);
      // Print ticket data
      tickets?.forEach((ticket, index) => {
        if (yPos > 270) {
          // Add a new page if content exceeds page height
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(9);
        doc.text(ticket.ticketFor || 'N/A', 15, yPos);
        doc.text(ticket.ticketCode || 'N/A', 65, yPos);
        doc.text(ticket.type || 'N/A', 95, yPos);
        doc.text(ticket?.quantity?.toString() || 'N/A', 115, yPos);
        doc.text(ticket?.price?.toString() || 'N/A', 130, yPos);
        doc.text(ticket?.totalPrice?.toString() || 'N/A', 152, yPos);

        yPos += 10;

        // Draw a light separator line
        if (index < tickets.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(15, yPos - 5, 195, yPos - 5);
        }
      });

      // Footer with timestamp
      const date = new Date();
      doc.setFontSize(8);
      doc.text(`Generated on: ${date.toLocaleString()}`, 15, 280);

      // Save the PDF
      doc.save(`${eventDetails?.title || 'Event'}_Tickets.pdf`);

      Toast.fire({
        icon: "success",
        title: "Tickets downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Toast.fire({
        icon: "error",
        title: "Error generating PDF",
      });
    }
  };

  const getEventTickets = useCallback(async () => {
    setFetching(true);
    try {
      const response = await apiHandler("GET", `event/${id}/ticket`, true);
      // console.log(response, "check res");
      setTickets(response.data?.data);
    } catch (err) {

      Toast.fire({
        icon: "error",
        title: "Error Getting details",
      });
    } finally {
      setFetching(false);
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

      Toast.fire({
        icon: "success",
        title: `Ticket created for ${formik.values.ticketFor}!`,
      });

      getEventTickets();
      setLoading(false);
    } catch (err) {
      Toast.fire({
        icon: "error",
        title: "Error Creating ticket",
      });

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

      Toast.fire({
        icon: "success",
        title: "Wait for 5-10 seconds for tickets to be created!",
      });

      getEventTickets();
    } catch (err) {
      Toast.fire({
        icon: "error",
        title: "Error Creating ticket",
      });
    }
  };

  const formik = useFormik({
    initialValues: {
      ticketFor: "",
      type: "",
    },
    onSubmit: (values) => handleSubmit(values),
  });

  useEffect(() => {
    const getEventDetails = async () => {
      try {
        const response = await apiHandler("GET", `event/${id}`, true);
        setEventDetails(response.data?.data);
        setTicketInfo(response.data?.data.ticketInfo || []);
      } catch (err) {

        Toast.fire({
          icon: "error",
          title: "Error Getting details",
        });
      }
    };
    getEventDetails();
    getEventTickets();
  }, [getEventTickets]);

  // Add this function at the beginning of your component to dynamically assign colors
  const getTicketTypeColor = (typeName) => {
    // Generate a consistent color based on the type name
    return generateColorFromString(typeName?.toLowerCase());
  };

  // This function generates a consistent color from a string
  const generateColorFromString = (str) => {
    // Simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert to RGB with good opacity for badges
    const r = (hash & 0xFF);
    const g = ((hash >> 8) & 0xFF);
    const b = ((hash >> 16) & 0xFF);

    // Make sure the color is dark enough for white text
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Adjust RGB values if the color is too light
    const adjustedR = brightness > 160 ? Math.max(r - 40, 0) : r;
    const adjustedG = brightness > 160 ? Math.max(g - 40, 0) : g;
    const adjustedB = brightness > 160 ? Math.max(b - 40, 0) : b;

    return `rgba(${adjustedR}, ${adjustedG}, ${adjustedB}, 0.85)`;
  };

  const ticketTypeMap = ticketInfo.reduce((acc, ticket) => {
    acc[ticket._id] = ticket.name;
    return acc;
  }, {});

  const handleCheckIn = async (ticketId) => {
    try {
      setLoading(true);

      const checkInTicketInfo = tickets?.filter(e => ticketId === e.id)

      const checkInPayload = {
        ticketFor: checkInTicketInfo?.[0].ticketFor,
        event: checkInTicketInfo?.[0].event,
        isRead: true
      }

      const response = await apiHandler('put', `/ticket/${ticketId}/checkIn`, true, null, checkInPayload, null);

      if (response.status === 200) {
        // Update checked-in status locally
        setCheckedInTickets(prev => ({
          ...prev,
          [ticketId]: true
        }));

        Toast.fire({
          icon: "success",
          title: "Ticket checked in successfully!",
        });
      } else {
        Toast.fire({
          icon: "error",
          title: "Failed to check in ticket",
        });
      }

    } catch (error) {
      console.error("Check-in error:", error);
      Toast.fire({
        icon: "error",
        title: "An error occurred during check-in",
      });
    } finally {
      setLoading(false);
    }
  };

  const COLUMNS = [
    {
      field: "sn",
      headerName: "SN",
      width: 50,
    },
    {
      field: "ticketCode",
      headerName: "Ticket Code",
      width: 150,
    },
    {
      field: "ticketFor",
      headerName: "Ticket For",
      width: 250,
      renderCell: ({ row }) => {
        const email = row.ticketFor;
        const maskedEmail = maskEmail(email);

        return (
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <span>{viewEmail[row.id] ? email : maskedEmail}</span>
            <IconButton
              size="small"
              onMouseDown={() => setViewEmail(prev => ({ ...prev, [row.id]: true }))}
              onMouseUp={() => setViewEmail(prev => ({ ...prev, [row.id]: false }))}
              onMouseLeave={() => setViewEmail(prev => ({ ...prev, [row.id]: false }))}
              sx={{ ml: 1 }}
            >
              <IoMdEye size={18} />
            </IconButton>
          </div>
        );
      },
    },
    {
      field: "price",
      headerName: "Price",
      width: 50,
    },
    {
      field: "quantity",
      headerName: "Quantity",
      width: 100,
    },
    {
      field: "type",
      headerName: "Type",
      width: 110,
      renderCell: ({ row }) => {
        const typeName = row.type;
        return (
          <Chip
            size="medium"
            label={typeName.toUpperCase()}
            variant="outlined"
            style={{
              width: "100%",
              borderColor: getTicketTypeColor(typeName),
              color: getTicketTypeColor(typeName),
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
        const isSendMap = {
          true: "Yes",
          false: "No",
        };
        return (
          <Chip
            label={isSendMap[row.isSend]}
            variant="outlined"
            style={{
              width: "100%",
              borderColor: `${row.isSend === "true" ? "red" : "green"}`,
              color: `${row.isSend === "true" ? "red" : "green"}`,
              fontWeight: "bold",
            }}
          />
        );
      },
    },
    {
      field: "action",
      headerName: "Action",
      width: 120,
      renderCell: ({ row }) => {
        const isCheckedIn = checkedInTickets[row.id];

        return (
          <Button
            variant="contained"
            size="small"
            disabled={isCheckedIn}
            onClick={() => handleCheckIn(row.id)}
            style={{
              backgroundColor: isCheckedIn || row.isRead ? "#ccc" : "#1976d2",
              color: "white",
              fontWeight: "bold",
              width: "100%"
            }}
          >
            {isCheckedIn || row.isRead ? "Checked In" : "Check In"}
          </Button>
        );
      },
    },
  ];

  // Function to mask email
  const maskEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!domain) return '****';

    const maskedUsername = username.length <= 2
      ? '*'.repeat(username.length)
      : username.substring(0, 2) + '*'.repeat(username.length - 2);

    const [domainName, extension] = domain.split('.');
    const maskedDomain = domainName.charAt(0) + '*'.repeat(domainName.length - 1);

    return `${maskedUsername}@${maskedDomain}.${extension}`;
  };

  // Updated filteredRows with improved filtering logic
  const filteredRows = useMemo(() => {
    return tickets
      .filter((ticket) => {
        const emailMatch = ticket.ticketFor?.toLowerCase().includes(search.toLowerCase());
        const codeMatch = ticket.ticketCode?.toLowerCase().includes(ticketCodeSearch.toLowerCase());

        return (search === "" || emailMatch) && (ticketCodeSearch === "" || codeMatch);
      })
      .map((ticket, index) => ({
        ...ticket,
        sn: index + 1,
      }));
  }, [tickets, search, ticketCodeSearch]);

  return (
    <FormWrapper>
      {" "}
      <CustomBreadcrumbs
        title={`Tickets for ${eventDetails?.eventTitle || ""} (${tickets?.length || 0
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
      <div>
        {tickets?.length == eventDetails?.occupancy && (
          <Chip
            label="Tickets Sold Out"
            variant="outlined"
            style={{
              borderColor: "red",
              color: "red",
              fontWeight: "bold",
              width: "fit-content",
              marginBottom: "10px",
            }}
          />
        )}
      </div>
      <Grid container direction="column">
        <form>
          <FormSection
            showSection
            title={`Create new ticket for ${formik.values.ticketFor}`}
          >
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
                  fullWidth
                >
                  {ticketInfo.map((ticket) => (
                    <MenuItem key={ticket._id} value={ticket._id}>
                      {ticket.name} - {ticket.price}€
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item container md={4} spacing={0}>
                <Button
                  variant="contained"
                  disabled={
                    !formik.values.ticketFor ||
                    !formik.values.type ||
                    tickets?.length == eventDetails?.occupancy
                  }
                  onClick={formik.handleSubmit}
                  sx={{ height: 50 }}
                >
                  {tickets?.length == eventDetails?.occupancy
                    ? "Tickets Sold Out"
                    : "Create Ticket"}
                </Button>
                <Backdrop
                  sx={{
                    color: "#fff",
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                  }}
                  open={loading}
                >
                  <CircularProgress color="inherit" />
                </Backdrop>
              </Grid>
            </Grid>
          </FormSection>
        </form>
        {/*
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

                    Toast.fire({
                      icon: "error",
                      title,
                    });
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
                  // console.log(files, "check");
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
                          }}
                        >
                          <input {...getInputProps()} />
                          <BsUpload
                            size={32}
                            color="green"
                            style={{ marginRight: 20 }}
                          />  
                           
                          <Typography variant="p">Drag and drop </Typography>
                          <Typography variant="p" style={{ margin: 3 }}>
                            or
                          </Typography>
                          <Typography variant="p">
                            Select Excel Files
                          </Typography>
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 100,
                          }}
                        >
                          {files.map((doc, i) => (
                            <div
                              key={i}
                              style={{
                                height: 100,
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                border: "1px dashed black",
                                cursor: "pointer",
                                borderRadius: 6,
                              }}
                            >
                              <Link href={doc.preview} target="_blank" passHref>
                                <GrDocumentExcel
                                  size={48}
                                  color={"green"}
                                  style={{ margin: 5 }}
                                />
                              </Link>
                              <div style={{ margin: 5 }}>
                                <span>{doc.path}</span>
                                <span
                                  style={{
                                    margin: 5,
                                    border: "1px solid black",
                                    fontSize: 12,
                                  }}
                                >
                                  {(doc.size / 1024).toFixed(2)} KB
                                </span>
                              </div>
                              <GrTrash
                                title="Delete"
                                onClick={(e) =>
                                  setFiles(
                                    files.filter((x, index) => index !== i)
                                  )
                                }
                                size={24}
                                color={"crimson"}
                                style={{
                                  cursor: "pointer",
                                  padding: 5,
                                  margin: 5,
                                  borderRadius: 4,
                                  border: "1px solid crimson",
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
              <Grid
                item
                container
                md={2.5}
                direction="column"
                justifyContent={"center"}
                margin={2}
              >
                <Button
                  variant="contained"
                  onClick={createMultipleTickets}
                  disabled={
                    !files.length || tickets?.length == eventDetails?.occupancy
                  }
                  sx={{
                    height: "fit-content",
                    width: "fit-content",
                    padding: "15px",
                  }}
                >
                  {tickets?.length == eventDetails?.occupancy
                    ? "Tickets Sold Out"
                    : "Create Multiple Tickets"}
                </Button>
                <Backdrop
                  sx={{
                    color: "#fff",
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                  }}
                  open={loading}
                >
                  <CircularProgress color="inherit" />
                </Backdrop>
              </Grid>
            </Grid>
          </FormSection>
        </form>
        */}
        <DataGrid
          rows={filteredRows}
          columns={COLUMNS}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          loading={fetching}
          slots={{
            toolbar: () => (
              <Grid
                container
                justifyContent={"space-between"}
                alignItems={"center"}
              >
                 
                 <Input
  inputRef={emailSearchRef}
  placeholder="Search Email"
  value={search}
  sx={{
    width: 200,
    margin: 2,
  }}
  onChange={(e) => setSearch(e.target.value)}
  onFocus={() => setEmailInputHasFocus(true)}
  onBlur={() => setEmailInputHasFocus(false)}
  onKeyDown={(e) => e.stopPropagation()}
  endAdornment={
    search && search !== " " ? (
      <RxCross1
        size={25}
        style={{
          margin: 8,
          cursor: "pointer",
        }}
        onClick={() => {
          setSearch("");
          // Focus must be called directly here
          emailSearchRef.current.focus();
        }}
        onMouseDown={(e) => {
          // Prevent the button mouse down from causing the input to lose focus
          e.preventDefault();
        }}
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

<Input
  inputRef={ticketCodeSearchRef}
  placeholder="Search Ticket Code"
  value={ticketCodeSearch}
  sx={{
    width: 200,
    margin: 2,
  }}
  onChange={(e) => setTicketCodeSearch(e.target.value)}
  onFocus={() => setTicketCodeInputHasFocus(true)}
  onBlur={() => setTicketCodeInputHasFocus(false)}
  onKeyDown={(e) => e.stopPropagation()}
  endAdornment={
    ticketCodeSearch && ticketCodeSearch !== " " ? (
      <RxCross1
        size={25}
        style={{
          margin: 8,
          cursor: "pointer",
        }}
        onClick={() => {
          setTicketCodeSearch("");
          // Focus must be called directly here
          ticketCodeSearchRef.current.focus();
        }}
        onMouseDown={(e) => {
          // Prevent the button mouse down from causing the input to lose focus
          e.preventDefault();
        }}
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
                <IconButton
                  title="Refresh"
                  onClick={getEventTickets}
                  disabled={fetching}
                  sx={{
                    margin: 2,
                    cursor: "pointer",
                  }}
                >
                  <IoReload size={28} style={{ margin: 5 }} />
                </IconButton>
                <IconButton
                  title="Download Tickets PDF"
                  onClick={downloadTicketsPDF}
                  disabled={fetching || tickets.length === 0}
                  sx={{
                    margin: 2,
                    cursor: "pointer",
                  }}
                >
                  <FaDownload size={24} style={{ margin: 5 }} />
                </IconButton>
              </Grid>
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