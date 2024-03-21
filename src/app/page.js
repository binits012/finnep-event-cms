"use client";

import styles from "./page.module.css";
import SideBar from "@/app/components/dashboard/SideBar/SideBar";
import Navbar from "./components/dashboard/NavBar/Navbar";
import Dashboard from "./dashboard/page";

export default function Home() {
  return (
    <main className={styles.main}>
      <div style={{ display: "flex" }}>
        <SideBar />
        <Navbar />
      </div>
      <Dashboard />
    </main>
  );
}
