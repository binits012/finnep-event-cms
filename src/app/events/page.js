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
import { toast } from "react-toastify";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from "react-icons/lu";
import { TfiHandDrag } from "react-icons/tfi";
import Link from "next/link";
import Modal from "@/components/Modal";
import DeleteModal from "@/components/DeleteModal";
import moment from "moment";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  closestCenter,
  DndContext,
  useSensor,
  useSensors,
  TouchSensor,
  MouseSensor,
} from "@dnd-kit/core";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [showList, setShowList] = useState(false);
  const [reorderedEvents, setReorderedEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    return moment(dateString).format("YYYY-MM-DD");
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await apiHandler("GET", "event", true);
        setEvents(response.data.data);
        console.log("Events data:", response.data.data);
      } catch (error) {
        console.log("Error getting events data", error);
        toast.error("Error getting events data");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    try {
      const data = { active: false };
      const response = await apiHandler("PATCH", `/event/${id}`, data);
      console.log("Event deleted:", response);

      // update your UI to remove the deleted event from the list
      // setEvents(events.filter((event) => event._id !== id));
    } catch (error) {
      console.error("Error deactivating event:", error);
    }
  };

  const handleDeleteClick = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const filteredEvents = events.filter((event) =>
    event.eventName.toLowerCase().includes(search.toLowerCase())
  );

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (active.id === over.id) {
      return;
    }

    setEvents((events) => {
      const oldIndex = events.findIndex((event) => event._id === active.id);
      const newIndex = events.findIndex((event) => event._id === over.id);
      const reorderedEvents = arrayMove(events, oldIndex, newIndex);
      setReorderedEvents(reorderedEvents);
      return reorderedEvents;
    });
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

  const SortableItem = ({ event }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: event._id });

    const style = {
      transition,
      transform: CSS.Transform.toString(transform),
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {event.eventPromotionPhoto && (
            <img
              src={event.eventPromotionPhoto}
              alt={event.eventTitle}
              style={{ width: "100px", height: "100px", objectFit: "cover" }}
            />
          )}
          <span>{event.eventName}</span>
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    const positions = reorderedEvents.map((event, index) => ({
      id: event._id,
      position: index + 1,
    }));
    console.log("Payload:", { data: positions });
    setLoading(true);

    try {
      const response = await apiHandler("PATCH", "event/batch", true, false, {
        data: positions,
      });
      console.log("Updated positions:", response.data);
      toast.success("Positions updated successfully");
      setShowList(false);
    } catch (error) {
      console.error("Error updating positions:", error);
      toast.error("Error updating positions");
    }
    setLoading(false);
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

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );
  const handleList = () => {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={filteredEvents}
          strategy={verticalListSortingStrategy}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "30px",
              cursor: "grab",
            }}
          >
            {filteredEvents.map((event, index) => (
              <div
                key={event._id}
                style={{
                  padding: "10px",
                  border: "1px solid black",
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <strong>{index + 1}</strong> {/* Displaying item number */}
                </div>
                <SortableItem key={event._id} event={event} />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  };
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
            {!showList && (
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
                  <Button
                    variant="outlined"
                    style={{
                      height: "36px",
                      marginRight: "10px",
                    }}
                    onClick={() => setShowList(!showList)}
                  >
                    <TfiHandDrag size={18} />
                    Arrange
                  </Button>

                  <Grid
                    sx={{
                      marginRight: "20px",
                    }}
                  >
                    <Button variant="outlined" onClick={handleClick}>
                      <LuArrowUpDown
                        style={{ marginRight: "10px" }}
                        size={18}
                      />
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
                      <MenuItem onClick={() => handleSort("name")}>
                        {sortBy === "name" && sortOrder === "ascending" ? (
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
            )}
          </>
        )}

        {showList ? (
          <div>
            <div
              style={{
                // position: "sticky",
                top: 0,
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "20px",
              }}
            >
              <Button
                variant="contained"
                onClick={handleSave}
                style={{ marginTop: "20px" }}
              >
                Save
                {loading && (
                  <Backdrop
                    sx={{
                      color: "#fff",
                      zIndex: (theme) => theme.zIndex.drawer + 1,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}
                    open={loading}
                  >
                    <CircularProgress color="inherit" />
                  </Backdrop>
                )}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowList(!showList)}
                style={{ margin: "20px 0 0 20px" }}
              >
                Cancel
              </Button>
            </div>
            <div style={{ width: "100%" }}>{handleList()}</div>
          </div>
        ) : (
          <Grid container spacing={2}>
            {filteredEvents.length === 0 && search && search.trim() && (
              <Grid item xs={12}>
                {showError()}
              </Grid>
            )}
            {filteredEvents.map((event) => (
              <Grid item xs={12} sm={6} md={3} key={event._id}>
                <section class="articles">
                  <article>
                    <div class="article-wrapper">
                      <figure>
                        <img
                          src={event.eventPromotionPhoto}
                          alt={event.name}
                          style={{ objectFit: "cover" }}
                        />
                      </figure>
                      <div class="article-body">
                        <h2>{event.eventName}</h2>

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

                          <IconButton aria-label="edit" color="primary">
                            <MdOutlineRemoveRedEye
                              size={24}
                              color="#4C4C4C"
                              title="View Details"
                              onClick={() => {
                                setShowModal(true);
                                setSelectedEvent(event);
                              }}
                            />
                          </IconButton>

                          <IconButton aria-label="edit" color="primary">
                            <DeleteIcon
                              size={24}
                              color="#4C4C4C"
                              title="Delete Event"
                              onClick={() => handleDeleteClick(event)}
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
        )}
        <DeleteModal
          isVisible={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={() => {
            handleDelete(selectedEvent._id);
            setShowDeleteModal(false);
          }}
          eventName={selectedEvent ? selectedEvent.eventName : ""}
        >
          <h4>Are you sure you want to delete {selectedEvent?.eventName} ?</h4>
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
                      {selectedEvent.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
                    <Typography variant="body2" color="text.secondary">
                      <br />
                      <img
                        src={selectedEvent.eventPromotionPhoto}
                        alt="Event"
                        width="250px"
                      />
                    </Typography>
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
