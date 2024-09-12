"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./navbar.module.css";
import { MdNotifications, MdOutlineChat } from "react-icons/md";
import { useDispatch } from "react-redux";
import { logOut, setUser } from "@/store/reducers/userSlice";
import Cookies from "js-cookie";
import { GridMenuIcon } from "@mui/x-data-grid";
import MobileSideBar from "../mobilesidebar/MobileSidebar";
import { IoMdLogOut } from "react-icons/io";
// import MobileSideBar from "../MobileSidebar/MobileSidebar"

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const [isMobileView, setIsMobileView] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const updateView = () => {
    setIsMobileView(window.innerWidth <= 768);
  };

  useEffect(() => {
    updateView();
    window.addEventListener("resize", updateView);
    return () => window.removeEventListener("resize", updateView);
  }, []);

  const handleLogOut = (e) => {
    router.push("/");
    localStorage.removeItem("auth");
    localStorage.removeItem("accessToken");
    Cookies.remove("authToken");
    dispatch(logOut(null));
  };

  const [display, setDisplay] = useState(false);
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={styles.container}>
      {isMobileView && (
        <div className={styles.menuTitle} onClick={toggleSidebarCollapse}>
          <GridMenuIcon className={styles.icons} />
        </div>
      )}
      <div className={styles.title}></div>
      <div className={styles.menu}>
        <div className={styles.search}></div>
        {/* <div className={styles.icons}>
          <MdOutlineChat size={32} style={{ cursor: "pointer" }} />
        </div> */}
        <div className={styles.icons}>
          <MdOutlineChat size={32} style={{ cursor: "pointer" }} />
          <MdNotifications size={32} style={{ cursor: "pointer" }} />
          <IoMdLogOut
            size={32}
            title={"Log Out"}
            onClick={handleLogOut}
            style={{ cursor: "pointer" }}
          />
          {/* <MdPublic size={20} /> */}
        </div>
      </div>
      {isSidebarCollapsed && <MobileSideBar onToggle={toggleSidebarCollapse} />}
    </div>
  );
};

export default Navbar;
