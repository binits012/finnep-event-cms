"use client";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import {
  Grid,
  Typography,
  Button,
  Input,
  Chip,
  IconButton,
} from "@mui/material";
import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useParams } from "next/navigation";
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
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [ticketCodeSearch, setTicketCodeSearch] = useState("");
  const { id } = useParams();
  const [viewEmail, setViewEmail] = useState({});
  const [viewEmailTimeouts, setViewEmailTimeouts] = useState({});
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

  // Initialize viewEmail with default values for all ticket IDs
  useEffect(() => {
    const initialViewEmail = tickets.reduce((acc, ticket) => {
      acc[ticket.id] = false;
      return acc;
    }, {});
    setViewEmail(initialViewEmail);
  }, [tickets]);

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

      // Helper function to add wrapped text
      const addWrappedText = (text, x, y, maxWidth, fontSize = 12) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text || 'N/A', maxWidth);
        doc.text(lines, x, y);
        return lines.length * (fontSize * 0.4 + 2); // Return height used
      };

      let yPos = 15;

      // Add event details as a header with text wrapping
      doc.setFontSize(18);
      const eventTitleLines = doc.splitTextToSize(`Tickets for: ${eventDetails?.eventTitle || 'Event'}`, 180);
      doc.text(eventTitleLines, 15, yPos);
      yPos += eventTitleLines.length * 7.2 + 5;

      doc.setFontSize(12);
      const eventDateLines = doc.splitTextToSize(`Event Date: ${eventDetails?.eventDate || 'N/A'}`, 180);
      doc.text(eventDateLines, 15, yPos);
      yPos += eventDateLines.length * 4.8 + 3;

      const locationLines = doc.splitTextToSize(`Location: ${eventDetails?.eventLocationAddress || 'N/A'}`, 180);
      doc.text(locationLines, 15, yPos);
      yPos += locationLines.length * 4.8 + 10;

      // Add ticket details
      doc.setFontSize(14);
      doc.text('Ticket Details:', 15, yPos);
      yPos += 10;

      // Table headers
      doc.setFontSize(10);
      doc.text('Email', 15, yPos);
      doc.text('Code', 65, yPos);
      doc.text('Type', 95, yPos);
      doc.text('Quantity', 130, yPos);
      doc.text('Price', 150, yPos);
      doc.text('Total', 170, yPos);
      yPos += 7;

      // Draw a line under headers
      doc.line(15, yPos - 3, 195, yPos - 3);

      // Calculate statistics
      let totalQuantity = 0;
      let totalRevenue = 0;

      // Print ticket data
      tickets?.forEach((ticket, index) => {
        if (yPos > 250) {
          // Add a new page if content exceeds page height
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(9);
        let maxHeight = 0;

        // Email with wrapping (max width 45)
        const emailLines = doc.splitTextToSize(ticket.ticketFor || 'N/A', 45);
        doc.text(emailLines, 15, yPos);
        maxHeight = Math.max(maxHeight, emailLines.length * 3.6);

        // Code
        doc.text(ticket.ticketCode || 'N/A', 65, yPos);

        // Type with wrapping (max width 25)
        const typeLines = doc.splitTextToSize(ticket.type || 'N/A', 25);
        doc.text(typeLines, 95, yPos);
        maxHeight = Math.max(maxHeight, typeLines.length * 3.6);

        // Quantity
        const quantity = Number(ticket?.quantity) || 0;
        doc.text(quantity.toString(), 130, yPos);
        totalQuantity += quantity;

        // Price (per ticket - single price)
        const price = Number(ticket?.price) || 0;
        doc.text(price.toFixed(2), 150, yPos);

        // Total (price * quantity)
        const totalPriceValue = Number(ticket?.totalPrice) || (quantity * price);
        doc.text(totalPriceValue.toFixed(2), 170, yPos);
        totalRevenue += totalPriceValue;

        // Move to next row based on the tallest cell
        yPos += Math.max(maxHeight, 10);

        // Draw a light separator line
        if (index < tickets.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(15, yPos - 5, 195, yPos - 5);
        }
      });

      // Add statistics row
      yPos += 5;
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Draw a thicker line before statistics
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(15, yPos, 195, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('TOTALS:', 15, yPos);
      doc.text(totalQuantity.toString(), 130, yPos);
      doc.text('-', 150, yPos); // Price column - not applicable for totals (single price doesn't sum)
      doc.text(totalRevenue.toFixed(2), 170, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 10;

      // Footer with timestamp
      const date = new Date();
      doc.setFontSize(8);
      doc.text(`Generated on: ${date.toLocaleString()}`, 15, 280);

      // Save the PDF
      doc.save(`${eventDetails?.eventTitle || 'Event'}_Tickets.pdf`);

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

  const getEventTickets = async () => {
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
  };


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
  }, [id]);

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


  const handleMouseDown = (ticketId) => {
    setViewEmail((prev) => ({ ...prev, [ticketId]: true }));
    if (viewEmailTimeouts[ticketId]) {
      clearTimeout(viewEmailTimeouts[ticketId]);
    }
  };

  const handleMouseUpOrLeave = (ticketId) => {
    const timeout = setTimeout(() => {
      setViewEmail((prev) => ({ ...prev, [ticketId]: false }));
    }, 500); // Adjust delay as needed
    setViewEmailTimeouts((prev) => ({ ...prev, [ticketId]: timeout }));
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
              onMouseDown={() => handleMouseDown(row.id)}
              onMouseLeave={() => handleMouseUpOrLeave(row.id)}
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
      width: 100,
    },
    {
      field: "quantity",
      headerName: "Quantity",
      width: 100,
    },
    {
      field: "type",
      headerName: "Type",
      width: 200,
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

  // Calculate total quantity of tickets sold
  const totalTicketsSold = useMemo(() => {
    if (!tickets || tickets.length === 0) return 0;
    return tickets.reduce((sum, ticket) => {
      const quantity = Number(ticket?.quantity) || 0;
      return sum + quantity;
    }, 0);
  }, [tickets]);

  return (
    <FormWrapper>
      {" "}
      <CustomBreadcrumbs
        title={`Tickets for ${eventDetails?.eventTitle || ""} (${totalTicketsSold} sold of ${eventDetails?.occupancy || 0})`}
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
        <DataGrid
          rows={filteredRows}
          columns={COLUMNS}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 100,
              },
            },
          }}
          pageSizeOptions={[100, 500, 1000]}
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