import Link from "next/link";
import React, { useState } from "react";
import {
  MdDashboard,
  MdEventNote,
  MdOutlineSettings,
  MdSupervisedUserCircle,
  MdRateReview,
} from "react-icons/md";
import { FaUsers } from "react-icons/fa";
import styled from "styled-components";
import { GrGallery } from "react-icons/gr";
import { BsTicketPerforated } from "react-icons/bs";

import { FaPersonArrowUpFromLine } from "react-icons/fa6";
// import usePagination from "@mui/material/usePagination/usePagination";

import { usePathname } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { RiPagesLine } from "react-icons/ri";

const Wrapper = styled.div`
  .sideBar {

    width: ${(props) => (props.isCollapsed ? "0px" : "300px")};
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    /* background-color: #36454f; */

    display: flex;
    flex-direction: column;
    color: beige;

    background-color: #28282b;
    height: 100vh;
  }
  .user {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 10px;

    transition: width 0.3s ease-in-out;
    color: beige;
    text-decoration: none;

    justify-content: space-between; /* Add this line */
  }
  .userDetail {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
  .username {
    font-weight: 500;
  }
  .userTitle {
    font-size: 12px;
    color: var(--textSoft);

  }
  .items {
    flex-grow: 1;
    padding: 10px;
  }
  .item-container {
    padding: 15px 10px;
    margin: 5px 0;
    border-radius: 15px;
    transition: 0.3s;
    font-weight: 600;
    font-size: 18px;
    letter-spacing: 1px;
    cursor: pointer;
    &:hover {
      background-color: #ffffff;
      color: #000000;
      border: 3px solid #28282b;
    }
    &.active {
      background-color: #a4fc62;
      color: #090909;
    }
  }
  .toggleButton {
    /* margin-left: auto; Remove this line */
  }
`;

const SideBar = ({ onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
  ];

  const pathname = usePathname();

  return (
    <Wrapper>
      <Drawer
        variant="permanent"
        open={!isCollapsed}
        PaperProps={{
          style: {
            backgroundColor: "#28282b",
            color: "beige",
            width: isCollapsed ? "60px" : "300px",
            transition: "width 0.3s ease-in-out",
          },
        }}
      >
        <div className="sideBar">
          <div className="user">
            {!isCollapsed && (
              <>
                <Avatar src={"/noavatar.png"} alt="no avatar" />
                <div className="userDetail">
                  <span className="username">Admin</span>
                  <span className="userTitle">Administrator</span>
                </div>
              </>
            )}
            <IconButton className="toggleButton" onClick={toggleSidebar}>
              {isCollapsed ? (
                <MenuIcon style={{ color: "beige" }} />
              ) : (
                <CloseIcon style={{ color: "beige" }} />
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
                  pathname.includes(item.link)
                    ? "item-container active"
                    : "item-container"
                }
              >
                <ListItemIcon style={{ color: "beige" }}>
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
