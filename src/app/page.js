"use client";

import Event from "@/pages/Event/page";
import styles from "./page.module.css";
import SideBar from "@/app/components/SideBar/SideBar";
import Navbar from "./components/NavBar/Navbar";

export default function Home() {
  return (
    <main className={styles.main}>
      <div style={{ display: "flex" }}>
        <SideBar />
        <Navbar />
      </div>
      <Event />
    </main>
  );
}
