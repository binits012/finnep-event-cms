"use client";
import { usePathname, useRouter } from "next/navigation";
import styles from "./navbar.module.css";
import {
  MdNotifications,
  MdOutlineChat,
  MdPublic,
  MdSearch,
} from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/reducers/userSlice";
// import { useRouter } from "next/router";
const Navbar = () => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogOut = (e) => {
    router.push("/");
    localStorage.removeItem("auth");
    localStorage.removeItem("accessToken");
    dispatch(setUser(null));
  };
  return (
    <div className={styles.container}>
      <div className={styles.title}></div>
      <div className={styles.menu}>
        <div className={styles.search}>
          {/* <MdSearch /> */}
          {/* <input type="text" placeholder="Search..." className={styles.input} /> */}
        </div>
        <div className={styles.icons}>
          <IoLogOutOutline
            size={32}
            title={"Log Out"}
            onClick={handleLogOut}
            style={{ cursor: "pointer" }}
          />
          <MdOutlineChat size={32} />
          <MdNotifications size={32} />
          {/* <MdPublic size={20} /> */}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
