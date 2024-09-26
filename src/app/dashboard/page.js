"use client";
import React, { useEffect, useState } from "react";
import apiHandler from "@/RESTAPIs/helper";
import "./dashboard.css";
import Swal from "sweetalert2";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import { Backdrop, CircularProgress } from "@mui/material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);
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

  const events = dashboard?.event || [];
  const tickets = dashboard?.ticket || [];

  const upcomingEventsCount = events.filter(
    (event) => event.status === "up-coming"
  ).length;
  const pastEventCount = events.filter(
    (event) => event.status === "past-events"
  ).length;

  const ticketCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.event] = (acc[ticket.event] || 0) + 1;
    return acc;
  }, {});

  const ticketTypeCount = tickets.reduce((acc, ticket) => {
    const { type } = ticket;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const salesTrendData = tickets.reduce((acc, ticket) => {
    const date = new Date(ticket.createdAt)
      .toLocaleDateString()
      .split("/")
      .slice(0, 2)
      .join("/");
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const trendData = {
    labels: Object.keys(salesTrendData),
    datasets: [
      {
        label: "Tickets Sold Over Time",
        data: Object.values(salesTrendData),
        fill: false,
        borderColor: "green",
      },
    ],
  };
  const lowInventoryThreshold = 5;
  const lowInventoryEvents = events.filter(
    (event) => ticketCounts[event._id] < lowInventoryThreshold
  );

  if (lowInventoryEvents.length > 0) {
    Toast.fire({
      icon: "warning",
      title: `Low ticket sales for: ${lowInventoryEvents
        .map((event) => event.eventTitle)
        .join(", ")}`,
    });
  }

  const totalSales = tickets.length;
  const averageSales = totalSales / (events.length || 1);
  const highestSalesEventId = Object.keys(ticketCounts).reduce(
    (a, b) => (ticketCounts[a] > ticketCounts[b] ? a : b),
    null
  );
  const highestSalesEvent = events.find(
    (event) => event._id === highestSalesEventId
  );

  const data = {
    labels: Object?.keys(ticketTypeCount),
    datasets: [
      {
        label: "Tickets Sold",
        data: Object?.values(ticketTypeCount),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  return (
    <>
      <div className="dashboard-container">
        <CustomBreadcrumbs
          title={"Dashboard"}
          links={[
            {
              path: "/dashboard",
              title: "Dashboard",
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
            <div className="cards-container">
              <div className="card">
                <h2>Tickets</h2>
                <p className="info">Total Tickets Sold: {tickets.length}</p>
                {tickets.length === 0 ? <p>No tickets available.</p> : null}

                <div className="ticket-type-list">
                  {Object.entries(ticketTypeCount).map(([key, value]) => (
                    <p key={key}>
                      {key.toUpperCase()}: {value}
                    </p>
                  ))}
                </div>
              </div>
              <div className="card">
                <h2>Events</h2>
                <p className="info">Upcoming Events: {upcomingEventsCount}</p>
                <p className="info">Past Events: {pastEventCount}</p>
                <div className="eventCard-wrapper">
                  {events.length === 0 ? (
                    <p>No events available.</p>
                  ) : (
                    events
                      .filter((event) => ticketCounts[event._id] > 0)
                      .map((event) => (
                        <div key={event._id} className="event-card">
                          <h3>{event.eventTitle}</h3>
                          <p>
                            Date:{" "}
                            {new Date(event.eventDate).toLocaleDateString()}
                          </p>
                          <p>Location: {event.eventLocationAddress}</p>
                          <p>Tickets Sold: {ticketCounts[event._id] || 0}</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="sales-insight-card" style={{ margin: "20px 0" }}>
              <h2>Sales Insights</h2>
              <p>Total Tickets Sold: {totalSales}</p>
              <p>Average Tickets Sold per Event: {averageSales.toFixed(2)}</p>
              <p>
                Highest Sales Event:{" "}
                {highestSalesEvent ? highestSalesEvent.eventTitle : "N/A"}
              </p>
              <p>
                Lowest Sales Event:{" "}
                {lowInventoryEvents.map((event) => event.eventTitle).join(", ")}
              </p>
            </div>
            <div className="card" style={{ margin: "20px 0" }}>
              <h2>Sales Trend Over Time</h2>
              <Line
                data={trendData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: {
                      display: true,
                      text: "Tickets Sold Over Time",
                    },
                    tooltip: {
                      backgroundColor: "green",
                      titleColor: "#fff",
                      bodyColor: "#fff",
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                    y: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                  tooltip: {
                    backgroundColor: "green",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                  },
                }}
              />
            </div>
            <div className="card">
              <h2>Ticket Sales by Type</h2>
              <Bar
                data={data}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: {
                      display: true,
                      text: "Tickets Sold ",
                    },
                    tooltip: {
                      backgroundColor: "#fff",
                      titleColor: "#333",
                      bodyColor: "#333",
                      borderColor: "#007bff",
                      borderWidth: 1,
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                    y: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                  tooltip: {
                    backgroundColor: "green",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                  },
                }}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;
