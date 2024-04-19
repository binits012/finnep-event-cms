"use client";
import React, { useCallback, useEffect, useState } from "react";
import { setUser } from "@/store/reducers/photoTypeSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
const Dashboard = () => {
  const [dashboard, setDashboard] = useState([]);
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiHandler("GET", "dashboard", true);
        setDashboard(res.data.data || []);
        //place it in store
      } catch (err) {
        console.log(err);
        toast.error("Error getting events!!");
      }
    };
    fetchEvents();
  }, []);
  return <div> Dashboard</div>;
};
export default Dashboard;
