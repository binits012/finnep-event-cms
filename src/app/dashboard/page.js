"use client";
import React, { useEffect, useState } from "react";
import apiHandler from "@/RESTAPIs/helper";
import "./Dashboard.css";
import Swal from "sweetalert2";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState();
  const [loading, setLoading] = useState(false);

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
        const res = await apiHandler("GET", "dashboard", true);
        setDashboard(res.data.data);
      } catch (err) {
        console.error(err);
        Toast.fire({
          icon: "error",
          title: "Error getting events data",
        });
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const events = dashboard?.event;
  const tickets = dashboard?.ticket;

  console.log(dashboard, "check dashboard");
  console.log(events, "check events");

  const upcomingEventsCount = events?.filter(
    (event) => event.status === "up-coming"
  ).length;

  const pastEventCount = events?.filter(
    (event) => event.status === "past-events"
  ).length;

  const ticketCounts = tickets?.reduce((acc, ticket) => {
    acc[ticket.event] = (acc[ticket.event] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="cards-container">
        <div className="card">
          <h2>Events</h2>
          <p>Upcoming Events: {upcomingEventsCount}</p>
          <p>Past Events: {pastEventCount}</p>
          {events?.length === 0 ? (
            <p>No events available.</p>
          ) : (
            events
              ?.filter((event) => ticketCounts[event._id] > 0) // Filter events with tickets sold
              .map((event) => (
                <div key={event._id} className="event-card">
                  <h3>{event.eventTitle}</h3>
                  <p>Date: {new Date(event.eventDate).toLocaleDateString()}</p>
                  <p>Location: {event.eventLocationAddress}</p>
                  <p>Tickets Sold: {ticketCounts[event._id] || 0}</p>
                </div>
              ))
          )}
        </div>

        <div className="card">
          <h2>Tickets</h2>
          <p>Total Tickets Sold: {tickets?.length}</p>
          {tickets?.length === 0 ? <p>No tickets available.</p> : null}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
