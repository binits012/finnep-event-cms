import { useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import Login from "./Login";
import Dashboard from "@/app";
import { setUser } from "@/store/reducers/userSlice";
import { useEffect } from "react";
import SideBar from "./dashboard/SideBar/SideBar";
import Navbar from "./dashboard/NavBar/Navbar";
import store from "@/store/store";
import GateWay from "./GateWay";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const InnerLayout = ({ children }) => {
  const dispatch = useDispatch();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      dispatch(setUser(JSON.parse(auth)));
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div style={{ display: "flex", width: "100%" }}>
      <div>
        <SideBar onToggle={toggleSidebarCollapse} />
      </div>
      <div
        style={{
          marginLeft: isSidebarCollapsed ? "65px" : "250px",
          width: isSidebarCollapsed
            ? "calc(100% - 56px)"
            : "calc(100% - 250px)",
        }}
      >
        <Navbar />
        <div style={{ padding: 30, width: "100%" }}>{children}</div>
      </div>
      {/* <ToastContainer /> */}
    </div>
  );
};

export default InnerLayout;
