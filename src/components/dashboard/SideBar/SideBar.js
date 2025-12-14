"use client";
import Link from "next/link";
import React, { useState } from "react";
import {
  MdDashboard,
  MdEventNote,
  MdOutlineSettings,
  MdSupervisedUserCircle,
  MdRateReview, MdBusinessCenter,
  MdEventSeat
} from "react-icons/md";
import { FaChevronLeft, FaUsers } from "react-icons/fa";
import styled from "styled-components";
import { GrGallery } from "react-icons/gr";
import { BsTicketPerforated } from "react-icons/bs";
import { usePathname } from "next/navigation";
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from "@mui/material";

import { ImSpoonKnife } from "react-icons/im";
import { RiPagesLine } from "react-icons/ri";
import { IoMdNotificationsOutline } from "react-icons/io";
import { ChevronLeft } from "@mui/icons-material";
import { ChevronRightOutlined } from "@mui/icons-material";
import { ChevronLeftOutlined } from "@mui/icons-material";
import { FaChevronRight } from "react-icons/fa6";

// Define the Wrapper styled component
const Wrapper = styled.div`
  .sideBar {
    display: flex;
    flex-direction: column;
    color: #ffffff;
    background-color: ;
    height: 100vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #f0f0f0;
  }

  .sideBar::-webkit-scrollbar {
    width: 8px;
  }

  .sideBar::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  .sideBar::-webkit-scrollbar-thumb {
    background-color: #ff8c00;
    border-radius: 5px;
  }
  .sideBar::-webkit-scrollbar-thumb:hover {
    background-color: #ff6a00;
  }

  .user {
    display: flex;
    height: 50px;
    align-items: center;

    /* padding: 5px; */
    background-color: #222;
    border-bottom: 1px solid #333;
    justify-content: ${({ $isCollapsed }) =>
      $isCollapsed ? "center" : "space-between"};
  }

  .userDetail {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    align-items: flex-start;
    justify-content: center;
    padding-left: 8px;
  }

  .username {
    margin-left: 8px;
    font-weight: 800;
    font-size: 18px;
    color: #ffffff;
  }

  .userTitle {
    font-size: 12px;
    color: #6c757d;
  }

  .items {
    flex-grow: 1;
    padding: 10px;
  }

  .item-container {
    padding: 15px 10px;
    margin: 5px 0;
    border-radius: 8px;
    transition: background-color 0.3s;
    font-weight: 600;
    font-size: 18px;
    letter-spacing: 1px;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #ffffff;
    &:hover {
      background-color: #2b4864;
    }
    &.active {
      background-color: #143453;
      color: #ffffff;
    }
    .icon {
      color: inherit;
    }
  }

  .toggleButton {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-left: ${({ $isCollapsed }) => ($isCollapsed ? "0" : "auto")};
  }

  .menuIcon {
    color: #ffffff;
  }
`;

const SideBar = ({ onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname(); // Get the current pathname

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    onToggle(!isCollapsed); // Notify the parent component about the change
  };

  const ITEMS = [
    {
      title: "Dashboard",
      link: "/dashboard",
      icon: <MdDashboard size={24} />,
    },
    {
      title: "Front Page Details",
      link: "/frontPage",
      icon: <RiPagesLine size={24} />,
    },

    {
      title: "Merchants",
      link: "/merchants",
      icon: <MdBusinessCenter size={24} />,
    },
    {
      title: "Event",
      link: "/events",
      icon: <MdEventNote size={24} />,
    },
    {
      title: "Tickets",
      link: "/tickets",
      icon: <BsTicketPerforated size={24} />,
    },
    {
      title: "Seatmap",
      link: "/seatmap",
      icon: <MdEventSeat size={24} />,
    },
    {
      title: "Notifications",
      link: "/notification",
      icon: <IoMdNotificationsOutline size={24} />,
    },
    {
      title: "Gallery",
      link: "/gallery",
      icon: <GrGallery size={24} />,
    },
    {
      title: "Users",
      link: "/users",
      icon: <FaUsers size={24} />,
    },
    {
      title: "Profile",
      link: "/profile",
      icon: <MdSupervisedUserCircle size={24} />,
    },
    {
      title: "Queue Admin",
      link: "/admin/queue",
      icon: <MdOutlineSettings size={24} />,
    },
  ];

  return (
    <Wrapper $isCollapsed={isCollapsed}>
      <Drawer
        variant="permanent"
        open={!isCollapsed}
        PaperProps={{
          style: {
            backgroundColor: "#1a1a1a",
            color: "#ffffff",
            width: isCollapsed ? "60px" : "300px",
            transition: "width 0.3s ease-in-out",
          },
        }}
      >
        <div className="sideBar">
          <div className="user">
            {!isCollapsed && (
              <>
                {/* <Avatar src={"/noavatar.png"} alt="no avatar" /> */}
                <div className="userDetail">
                  <span className="username">Finnep</span>
                  {/* <span className="userTitle">Administrator</span> */}
                </div>
              </>
            )}
            <IconButton className="toggleButton" onClick={toggleSidebar}>
              {isCollapsed ? (
                <FaChevronRight className="menuIcon" />
              ) : (
                <FaChevronLeft className="menuIcon" />
              )}
            </IconButton>
          </div>
          <Divider />
          <List className="items">
            {ITEMS.map((item) => (
              <ListItem
                key={item.link}
                component={Link}
                href={item.link}
                className={
                  pathname === item.link || (item.link === "/seatmap" && pathname?.startsWith("/seatmap"))
                    ? "item-container active"
                    : "item-container"
                }
              >
                <ListItemIcon className="icon" style={{ minWidth: "40px" }}>
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && <ListItemText primary={item.title} />}
              </ListItem>
            ))}
          </List>
        </div>
      </Drawer>
    </Wrapper>
  );
};

export default SideBar;
