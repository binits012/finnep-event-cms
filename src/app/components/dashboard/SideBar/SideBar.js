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

const Wrapper = styled.div`
  .sideBar {
    width: 300px;
    height: 100vh;
    /* background-color: #36454f; */
    background-color: #28282b;
    padding: 10px;
    color: beige;
    text-decoration: none;
    position: sticky;
    top: 40px;
  }
  .items {
    border: 3px solid #000000;
    border-radius: 10px;
    padding: 10px;
  }
  .item-container {
    padding: 10px;
    margin: 15px 0;
    border-radius: 15px;
    transition: 0.53s;
    font-weight: 600;
    letter-spacing: 1px;
    &:hover {
      background-color: #ffffff;
      color: #000000;
      border: 3px solid #28282b;
      cursor: pointer;
    }
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
  const Items = [
    {
      title: "Dashboard",
      link: "/dashboard",
      icon: <MdDashboard />,
    },
    {
      title: "Line Up",
      link: "/lineup",
      icon: <FaPersonArrowUpFromLine />,
    },
    {
      title: "Event",
      link: "/events",
      icon: <MdEventNote />,
    },
    {
      title: "Gallery",
      link: "/gallery",
      icon: <GrGallery />,
    },
    {
      title: "Profile",
      link: "/profile",
      icon: <MdSupervisedUserCircle />,
    },
    {
      title: "Settings",
      link: "/settings",
      icon: <MdOutlineSettings />,
    },
    {
      title: "Logout",
      link: "/logout",
      icon: <MdLogout />,
    },
  ];
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
          {Items.map((item) => (
            <div className="item-container" id={Items.link}>
              <Link href={item.link}>
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
