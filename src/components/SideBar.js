import Link from "next/link";
import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  .sideBar {
    width: 300px;
    height: 100vh;
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
`;
const SideBar = () => {
  const Items = [
    {
      title: "Dashboard",
      link: "/",
    },
    {
      title: "Line Up",
      link: "/lineup",
    },
    {
      title: "Event",
      link: "/event",
    },
    {
      title: "Gallery",
      link: "/gallery",
    },
    {
      title: "Profile",
      link: "/profile",
    },
    {
      title: "Settings",
      link: "/settings",
    },
    {
      title: "Logout",
      link: "/logout",
    },
  ];
  return (
    <Wrapper>
      <div className="sideBar">
        <div className="items">
          {Items.map((item) => (
            <div className="item-container" id={Items.link}>
              <Link href={item.link}>{item.title}</Link>
            </div>
          ))}
        </div>
      </div>
    </Wrapper>
  );
};

export default SideBar;
