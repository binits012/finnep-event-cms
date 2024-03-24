import { Provider, useDispatch, useSelector } from "react-redux";
import Login from "./Login";
import Dashboard from "@/app";
import { setUser } from "@/store/reducers/userSlice";
import { useEffect } from "react";
import SideBar from "./dashboard/SideBar/SideBar";
import Navbar from "./dashboard/NavBar/Navbar";
import store from "@/store/store";
import GateWay from "./GateWay";

const InnerLayout = ({ children }) => {
  return (
    <Provider store={store}>
      <GateWay>{children}</GateWay>
    </Provider>
  );
};

export default InnerLayout;
