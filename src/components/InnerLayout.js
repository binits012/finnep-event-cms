import { Provider, useDispatch, useSelector } from "react-redux";
import Login from "./Login";
import Dashboard from "@/app";
import { setUser } from "@/store/reducers/userSlice";
import { useEffect } from "react";
import SideBar from "./dashboard/SideBar/SideBar";
import Navbar from "./dashboard/NavBar/Navbar";
import store from "@/store/store";
import GateWay from "./GateWay";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const InnerLayout = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      dispatch(setUser(JSON.parse(auth)));
    } else {
      router.push("/");
    }
  }, []);
  return (
    <div style={{ display: "flex", width: "100%" }}>
      <div>
        <SideBar />
      </div>
      <div style={{ marginLeft: 300, width: "calc(100% - 300px)" }}>
        <Navbar />
        <div style={{ padding: 30, width: "100%" }}>{children}</div>
      </div>
      {/* <ToastContainer /> */}
    </div>
  );
};

export default InnerLayout;
