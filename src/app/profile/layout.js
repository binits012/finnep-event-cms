"use client";
import Navbar from "@/components/dashboard/NavBar/Navbar";
import SideBar from "@/components/dashboard/SideBar/SideBar";

const layout = ({ children }) => {
  return (
    <div style={{ display: "flex", width: "100vw" }}>
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
