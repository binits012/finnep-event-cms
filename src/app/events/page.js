"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Grid, IconButton, Input } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
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
import styled from "styled-components";
import { PulseLoader } from "react-spinners";
import { RxCross1 } from "react-icons/rx";
import { IoIosSearch } from "react-icons/io";
import { FaFacebook, FaInstagram } from "react-icons/fa6";
import { RiTwitterXFill } from "react-icons/ri";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [search, setSearch] = useState("");
  // console.log(selectedEvent, "check selected event");

  const COLUMNS = [
    {
      field: "eventPromotionPhoto",
      headerName: "Thumbnail",
      width: 100,
      // editable: true,
      sortable: false,
      renderCell: (abc) => {
        return <img src={abc.row.eventPromotionPhoto} width={50} height={50} />;
      },
    },
    {
      field: "eventTitle",
      headerName: "Title",
      width: 180,
      // editable: true,
    },
    {
      field: "occupancy",
      headerName: "Occupancy",
      width: 90,
      sortable: false,
      // editable: true,
    },
    {
      field: "eventPrice",
      headerName: "Price",
      width: 80,
      // editable: true,
      renderCell: (abc, def) => {
        // console.log(def, abc, "test 123434245");
        return <span>{abc.row.eventPrice.$numberDecimal}</span>;
      },
    },
    {
      field: "eventDate",
      headerName: "Date",
      type: "number",
      width: 110,
      // editable: true,
      renderCell: ({ row }) => (
        <span>{moment(row.eventDate).format("MMM DD YYYY")}</span>
      ),
    },
    {
      field: "socialMedia",
      headerName: "Social Media Links",
      width: 150,
      editable: false,
      sortable: false,
      renderCell: ({ row }) => (
        <Box
          direction="row"
          width="100%"
          justify="space-between"
          className="actions">
          <Link href={`${row.socialMedia.fb}`} target="_blank">
            <FaFacebook
              size={24}
              color="#4C4C4C"
              title="Facebook Link"
              style={{ marginLeft: 10, cursor: "pointer" }}
            />
          </Link>
          <Link href={`${row.socialMedia.x}`} target="_blank">
            <RiTwitterXFill
              size={24}
              color="#4C4C4C"
              title="X Link"
              style={{ marginLeft: 10, cursor: "pointer" }}
            />
          </Link>
          <Link href={`${row.socialMedia.ig}`} target="_blank">
            <FaInstagram
              size={24}
              color="#4C4C4C"
              title="Instagram Link"
              style={{ marginLeft: 10, cursor: "pointer" }}
            />
          </Link>
        </Box>
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
              setSelectedEvent(row);
              console.log(row, "modal");
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
  // useEffect(() => {
  //   setEvents(
  //     events.filter((event) =>
  //       event.eventTitle.toLowerCase().includes(search.toLowerCase())
  //     )
  //   );
  // }, [search]);
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
        <Grid container justifyContent="space-between">
          {/* <Grid container justifyContent="flex-start" mb={2}>
            <Input
              // variant="soft"
              placeholder="Search Event"
              value={search}
              sx={{
                width: 200,
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
          </Grid> */}
          <Grid container justifyContent="flex-end" mb={2}>
            <Link passHref href="/events/add">
              <Button variant="contained">+ Add Events</Button>
            </Link>
          </Grid>
        </Grid>

        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={events.filter((event) =>
              event.eventTitle.toLowerCase().includes(search.toLowerCase())
            )}
            columns={COLUMNS}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 4,
                },
              },
            }}
            pageSizeOptions={[1, 2, 4]}
            disableRowSelectionOnClick
            getRowId={(row) => row._id}
            loading={events.length === 0}
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
        </Box>
      </div>
      <Modal
        isVisible={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedEvent(null);
        }}>
        <Styled>
          <div className="content">
            <div className="img">
              <img
                src={selectedEvent?.eventPromotionPhoto}
                alt={selectedEvent?.eventTitle}
                width={500}
                height={600}
              />
            </div>
            <div className="info">
              <h1>{selectedEvent?.eventTitle}</h1>
              <p className="description">
                Description <span>{selectedEvent?.eventDescription}</span>
              </p>
              <div className="date-time">
                <p className="time">
                  Time <span>{selectedEvent?.eventTime}</span>
                </p>
                <p className="date">
                  Date
                  <span>
                    {moment(selectedEvent?.eventDate).format("MMM DD YYYY")}
                  </span>
                </p>
              </div>
              <div className="price-ocupancy">
                <p className="price">
                  Price
                  <span>${selectedEvent?.eventPrice["$numberDecimal"]} </span>
                </p>
                <p className="occupancy">
                  Occupancy <span>{selectedEvent?.occupancy}</span>
                </p>
              </div>
              <div className="address-loaction">
                <p className="address">
                  Address
                  <span>{selectedEvent?.eventLocationAddress}</span>
                </p>{" "}
                <p className="location">
                  Location <span>{selectedEvent?.eventLocationGeoCode}</span>
                </p>
              </div>
            </div>
          </div>
        </Styled>
      </Modal>
    </>
  );
};

export default Events;

// curl --location 'https://eventapp.finnep.fi/api/event' \
// --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InllbGxvd0JyaWRnZSIsInJvbGUiOiJzdXBlckFkbWluIiwiaWQiOiI2NWZkZWU5NTg0MWJkNjAyYzkwOGExZTIiLCJpYXQiOjE3MTEyOTAzNzYsImV4cCI6MTcxMTQ2MzE3Nn0.Oje0AWz1v0VW3RRfSy7GlJAOlKhXmYhhkl3uAwnLAFw'

const Styled = styled.div`
  .content {
    display: flex;
    flex-direction: row;
    padding: 20px;
    /* border: none; */
  }
  .info {
    padding-left: 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
    h1 {
      align-self: center;
      font-size: 45px;
      margin-bottom: 20px;
      font-weight: bolder;
      justify-content: center;
      text-decoration: underline;
    }
    .description {
      font-size: 16px;
      margin-bottom: 5px;
      font-weight: bolder;
      display: flex;
      flex-direction: column;
      span {
        margin-top: 5px;
        border-radius: 5px;
        border: 1px solid #4c4c4c;
        padding: 5px;
        font-weight: normal;
      }
    }
    .date-time {
      display: flex;
      justify-content: flex-start;
      flex-direction: row;
      margin-bottom: 20px;
      margin-top: 10px;
      .time {
        display: flex;
        flex-direction: column;
        padding-right: 20px;
      }
      .date {
        display: flex;
        flex-direction: column;
        padding-left: 20px;
      }
      p {
        font-weight: bolder;
        padding: 5px;
      }
      span {
        margin-top: 5px;
        border-radius: 5px;
        border: 1px solid #4c4c4c;
        padding: 5px;
      }
    }
    .price-ocupancy {
      display: flex;
      justify-content: flex-start;
      flex-direction: row;
      margin-bottom: 20px;
      margin-top: 10px;
      .price {
        display: flex;
        flex-direction: column;
        padding-right: 20px;
      }
      .occupancy {
        display: flex;
        flex-direction: column;
        padding-left: 20px;
      }
      p {
        font-weight: bolder;
        padding: 5px;
      }
      span {
        margin-top: 5px;
        border-radius: 5px;
        border: 1px solid #4c4c4c;
        padding: 5px;
        font-weight: normal;
      }
    }
    .address-loaction {
      display: flex;
      justify-content: flex-start;
      flex-direction: row;
      margin-bottom: 20px;
      margin-top: 10px;
      .address {
        display: flex;
        flex-direction: column;
        padding-right: 20px;
      }
      .location {
        display: flex;
        flex-direction: column;
        padding-left: 20px;
      }
      p {
        font-weight: bolder;
        padding: 5px;
      }
      span {
        margin-top: 5px;
        border-radius: 5px;
        border: 1px solid #4c4c4c;
        padding: 5px;
        font-weight: normal;
      }
    }
  }
`;
