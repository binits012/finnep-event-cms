"use client";

import styles from "./page.module.css";
import SideBar from "@/components/dashboard/SideBar/SideBar";
import Navbar from "@/components/dashboard/NavBar/Navbar";
import Dashboard from ".";
import Login from "@/components/Login";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Login />
    </main>
  );
  return (
    <main className={styles.main}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div style={{ display: "flex" }}>
        <SideBar />
        <Navbar />
      </div>
      <Dashboard />
    </main>
  );
}
