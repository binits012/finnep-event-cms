"use client";
<<<<<<< HEAD
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
=======
import InnerLayout from "@/components/InnerLayout";
import store from "@/store/store";
import { Provider } from "react-redux";
const layout = ({ children }) => {
  return (
    <Provider store={store}>
      <InnerLayout>{children}</InnerLayout>
    </Provider>
>>>>>>> main
  );
};

export default layout;
