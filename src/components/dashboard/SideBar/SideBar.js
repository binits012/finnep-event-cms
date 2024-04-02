import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  MdDashboard,
  MdEventNote,
  MdLogout,
  MdOutlineSettings,
  MdSupervisedUserCircle,
} from "react-icons/md";
import styled from "styled-components";
import { GrGallery } from "react-icons/gr";

import { FaPersonArrowUpFromLine } from "react-icons/fa6";
import usePagination from "@mui/material/usePagination/usePagination";
import { usePathname } from "next/navigation";

const Wrapper = styled.div`
  .sideBar {
    width: 300px;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    /* background-color: #36454f; */
    background-color: #28282b;
    padding: 10px;
    color: beige;
    text-decoration: none;
  }
  .items {
    border: 3px solid #000000;
    border-radius: 10px;
    padding: 10px;
  }
  .item-container {
    padding: 15px 10px;
    margin: 15px 0;
    border-radius: 15px;
    transition: 0.53s;
    font-weight: 600;
    font-size: 18px;
    letter-spacing: 1px;
    cursor: pointer;
    &:hover {
      background-color: #ffffff;
      color: #000000;
      border: 3px solid #28282b;
    }
    a {
      display: flex;
      align-items: center;
    }
  }
  .item-container.active {
    background-color: #a4fc62;
    color: #090909;
  }
  .user {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
  }

  .userImage {
    border-radius: 50%;
    object-fit: cover;
  }

  .userDetail {
    display: flex;
    flex-direction: column;
  }

  .username {
    font-weight: 500;
  }

  .userTitle {
    font-size: 12px;
    color: var(--textSoft);
  }
`;
const SideBar = () => {
  const ITEMS = [
    {
      title: "Dashboard",
      link: "/dashboard",
      icon: <MdDashboard size={24} />,
    },
    {
      title: "Line Up",
      link: "/lineup",
      icon: <FaPersonArrowUpFromLine size={24} />,
    },
    {
      title: "Event",
      link: "/events",
      icon: <MdEventNote size={24} />,
    },
    {
      title: "Gallery",
      link: "/gallery",
      icon: <GrGallery size={24} />,
    },
    {
      title: "Profile",
      link: "/profile",
      icon: <MdSupervisedUserCircle size={24} />,
    },
    {
      title: "Settings",
      link: "/settings",
      icon: <MdOutlineSettings size={24} />,
    },
    // {
    //   title: "Logout",
    //   link: "/logout",
    //   icon: <MdLogout />,
    // },
  ];
  const pathname = usePathname();
  // console.log(pathname, "");
  return (
    <Wrapper>
      <div className="sideBar">
        <div className="user">
          <Image
            className="userImage"
            src={"/noavatar.png"}
            alt="no avatar"
            width="50"
            height="50"
          />
          <div className="userDetail">
            <span className="usename">Admin</span>
            <span className="userTittle">Administrator</span>
          </div>
        </div>
        <div className="items">
          {ITEMS.map((item) => (
            <div
              className={`${
                pathname.includes(item.link) ? "active" : ""
              } item-container `}
              id={item.title}
              key={item.link}>
              <Link href={item.link} passHref>
                <span style={{ marginRight: "10px" }}>{item.icon}</span>
                {item.title}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Wrapper>
  );
};

export default SideBar;
