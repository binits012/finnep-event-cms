"use client";
import Navbar from "@/components/dashboard/NavBar/Navbar";
import SideBar from "@/components/dashboard/SideBar/SideBar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const layout = ({ children }) => {
  return (
    <div style={{ display: "flex", width: "100vw" }}>
      <ToastContainer />
      <div>
        <SideBar />
      </div>
      <div style={{ marginLeft: 300, width: "calc(100% - 300px)" }}>
        <Navbar />
        <div style={{ padding: 30 }}>{children}</div>
      </div>
    </div>
  );
};

export default layout;
