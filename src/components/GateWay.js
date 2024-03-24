import { useDispatch, useSelector } from "react-redux";
import Login from "./Login";
import Dashboard from "@/app";
import { setUser } from "@/store/reducers/userSlice";
import { useEffect } from "react";
import SideBar from "./dashboard/SideBar/SideBar";
import Navbar from "./dashboard/NavBar/Navbar";

const GateWay = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      dispatch(setUser(JSON.parse(auth)));
    }
  }, []);

  const { user } = useSelector((state) => state.auth);
  console.log(user, "check abc");
  return !user?.token ? (
    <Login />
  ) : (
    <div style={{ display: "flex", width: "100vw" }}>
      <div>
        <SideBar />
      </div>
      <div style={{ marginLeft: 300, width: "calc(100% - 300px)" }}>
        <Navbar />
        <div style={{ padding: 30 }}>
          <Dashboard />
        </div>
      </div>
    </div>
  );
};

export default GateWay;
