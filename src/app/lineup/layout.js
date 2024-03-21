"use client";
import Navbar from "../components/dashboard/NavBar/Navbar";
import SideBar from "../components/dashboard/SideBar/SideBar";

const layout = ({ children }) => {
  return (
    <div style={{ display: "flex", width: "100vw" }}>
      <div>
        <SideBar />
      </div>
      <div>
        <Navbar />
        {children}
      </div>
    </div>
  );
};

export default layout;
