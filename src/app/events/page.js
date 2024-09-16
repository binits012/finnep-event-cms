"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Input,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import "@/app/events/card.css";
import { IoIosSearch } from "react-icons/io";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import apiHandler from "@/RESTAPIs/helper";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from "react-icons/lu";
import Link from "next/link";
import Modal from "@/components/Modal";
import DeleteModal from "@/components/DeleteModal";
import moment from "moment";
import { updateEvent } from "@/RESTAPIs/events";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    return moment(dateString).format("YYYY-MM-DD");
  };

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await apiHandler("GET", "event", true);
        setEvents(response.data.data);
      } catch (error) {
        Toast.fire({
          icon: "error",
          title: "Error getting events data",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    setLoading(true);
    if (id) {
      try {
        const currentEvent = selectedEvent;

        const updatedPayload = {
          ...currentEvent,
          active: !currentEvent.active,
        };

        await toast.promise(updateEvent(id, updatedPayload), {
          loading: "Updating event status...",
          success: "Event Status Updated Successfully!",
          error: "Error updating event status",
        });
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteClick = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const filteredEvents = events.filter((event) =>
    event.eventTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleSort = (field) => {
    const newSortOrder =
      sortBy === field && sortOrder === "ascending"
        ? "descending"
        : "ascending";

    setSortBy(field);
    setSortOrder(newSortOrder);

    const sortedEvents = [...events];

    sortedEvents.sort((a, b) => {
      let fieldA = a[field];
      let fieldB = b[field];

      if (typeof fieldA === "string") {
        fieldA = fieldA.trim().toLowerCase();
      }
      if (typeof fieldB === "string") {
        fieldB = fieldB.trim().toLowerCase();
      }

      if (newSortOrder === "ascending") {
        if (fieldA < fieldB) return -1;
        if (fieldA > fieldB) return 1;
      } else {
        if (fieldA < fieldB) return 1;
        if (fieldA > fieldB) return -1;
      }

      return 0;
    });

    setEvents(sortedEvents);
    handleClose();
  };

  const showError = () => (
    <Box
      display="flex"
      flexDirection={"column"}
      alignItems="center"
      justifyContent={"center"}
      mt={2}
    >
      <Typography variant="h6" color="textSecondary">
        Oops! We couldn't find any events matching "{search}". Try another
        search term.
      </Typography>
      <Typography>
        <img src="/notFound.webp" style={{ width: "300px", height: "300px" }} />
      </Typography>
    </Box>
  );

  return (
    <>
      <div style={{ padding: "20px" }}>
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
        {loading ? (
          <Backdrop
            sx={{
              color: "#fff",
              zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
            open={loading}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        ) : (
          <>
            <Grid
              container
              justifyContent="flex-end"
              mb={2}
              style={{ justifyContent: "space-between" }}
            >
              <div>
                <Input
                  placeholder="Search Event"
                  value={search}
                  sx={{
                    width: 200,
                    margin: "0 0 20px 0",
                  }}
                  onChange={(e) => setSearch(e.target.value)}
                  endAdornment={
                    search && search.trim() ? (
                      <IoIosSearch size={25} style={{ cursor: "pointer" }} />
                    ) : null
                  }
                />
              </div>

              <Grid
                style={{
                  display: "flex",
                }}
              >
                <Grid
                  sx={{
                    marginRight: "20px",
                  }}
                >
                  <Button variant="outlined" onClick={handleClick}>
                    <LuArrowUpDown style={{ marginRight: "10px" }} size={18} />
                    Sort
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={() => handleSort("position")}>
                      {sortBy === "position" && sortOrder === "ascending" ? (
                        <LuArrowUp />
                      ) : (
                        <LuArrowDown />
                      )}
                      Position
                    </MenuItem>
                    <MenuItem onClick={() => handleSort("eventTitle")}>
                      {sortBy === "eventTitle" && sortOrder === "ascending" ? (
                        <LuArrowUp />
                      ) : (
                        <LuArrowDown />
                      )}
                      Name
                    </MenuItem>
                    <MenuItem onClick={() => handleSort("active")}>
                      {sortBy === "active" && sortOrder === "ascending" ? (
                        <LuArrowUp />
                      ) : (
                        <LuArrowDown />
                      )}
                      Type
                    </MenuItem>
                  </Menu>
                </Grid>
                <Link passHref href="/events/add">
                  <Button variant="contained">+ Add</Button>
                </Link>
              </Grid>
            </Grid>
          </>
        )}

        <Grid container spacing={2}>
          {filteredEvents.length === 0 && search && search.trim() && (
            <Grid item xs={12}>
              {showError()}
            </Grid>
          )}
          {filteredEvents.map((event) => (
            <Grid item xs={12} sm={6} md={3} key={event._id}>
              <section className="articles">
                <article>
                  <div className="article-wrapper">
                    <figure>
                      <img
                        src={event.eventPromotionPhoto}
                        alt={event.name}
                        style={{ objectFit: "fill" }}
                        width={"100%"}
                        height={"100%"}
                      />
                    </figure>
                    <div className="article-body">
                      <h2>{event.eventTitle}</h2>

                      <Button
                        style={{
                          backgroundColor: event.active ? "green" : "yellow",
                          color: event.active ? "white" : "black",
                        }}
                      >
                        {event.active ? "Active" : "Inactive"}
                      </Button>

                      <Box mt={1} display="flex" justifyContent="center">
                        <IconButton
                          aria-label="edit"
                          color="primary"
                          component={Link}
                          href={`/events/edit/${event._id}`}
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton
                          aria-label="edit"
                          color="primary"
                          onClick={() => {
                            setShowModal(true);
                            setSelectedEvent(event);
                          }}
                        >
                          <MdOutlineRemoveRedEye
                            size={24}
                            color="#4C4C4C"
                            title="View Details"
                          />
                        </IconButton>

                        <IconButton
                          aria-label="edit"
                          color="primary"
                          onClick={() => handleDeleteClick(event)}
                        >
                          <DeleteIcon
                            size={24}
                            color="#4C4C4C"
                            title="Delete Event"
                          />
                        </IconButton>
                      </Box>
                    </div>
                  </div>
                </article>
              </section>
            </Grid>
          ))}
        </Grid>

        <DeleteModal
          isVisible={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={() => {
            handleDelete(selectedEvent._id);
            setShowDeleteModal(false);
          }}
          eventName={selectedEvent ? selectedEvent.eventName : ""}
        >
          <h4>
            Are you sure you want to set this {selectedEvent?.eventTitle} as{" "}
            {selectedEvent?.active ? "inactive" : "active"}?
          </h4>

          <div
            style={{
              display: "flex",
              gap: "20px",
              justifyContent: "flex-end",
              marginTop: "20px",
            }}
          >
            <Button
              variant="contained"
              onClick={() => {
                handleDelete(selectedEvent._id);
                setShowDeleteModal(false);
              }}
            >
              Yes
            </Button>

            <Button
              variant="contained"
              onClick={() => setShowDeleteModal(false)}
            >
              No
            </Button>
          </div>
        </DeleteModal>
        <Modal
          isVisible={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
          }}
        >
          {selectedEvent && (
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                  >
                    <CardMedia
                      component="img"
                      image={selectedEvent.eventPromotionPhoto}
                      alt={selectedEvent.name}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginBottom: 2,
                      }}
                    />
                    <Typography gutterBottom variant="h5" component="div">
                      {selectedEvent.eventTitle}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      m={2}
                    >
                      {selectedEvent.eventDescription}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Event Price:
                      {selectedEvent.eventPrice.$numberDecimal}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Event Occupancy:
                      {selectedEvent.occupancy}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Event Date: {formatDate(selectedEvent.eventDate)}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      mt={1}
                    >
                      Event Promotion Photo
                      <br />
                      <img
                        src={selectedEvent.eventPromotionPhoto}
                        alt="Event"
                        width="250px"
                      />
                    </Typography>
                    {selectedEvent.eventPhoto.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Event Photos
                        {selectedEvent.eventPhoto.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Event Photo ${index + 1}`}
                            style={{
                              width: "200px",
                              height: "auto",
                              borderRadius: "8px",
                            }}
                          />
                        ))}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Modal>
      </div>
    </>
  );
};

export default Events;
