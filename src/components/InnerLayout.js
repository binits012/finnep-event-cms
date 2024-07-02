import { useState, useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { setUser } from "@/store/reducers/userSlice";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import Navbar from "./dashboard/NavBar/Navbar";
import SideBar from "./dashboard/SideBar/SideBar";

const InnerLayout = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      dispatch(setUser(JSON.parse(auth)));
    } else {
      router.push("/");
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div style={{ display: "flex", width: "100%" }}>
      {!isMobile && <SideBar onToggle={toggleSidebarCollapse} />}
      <div
        style={{
          transition: "margin-left 0.3s ease-in-out",
          marginLeft: isMobile ? "0" : isSidebarCollapsed ? "56px" : "300px",
          width: isMobile
            ? "100%"
            : isSidebarCollapsed
            ? "calc(100% - 56px)"
            : "calc(100% - 300px)",
        }}
      >
        <Navbar />
        <InnerLayoutWrapper>{children}</InnerLayoutWrapper>
      </div>
    </div>
  );
};

export default InnerLayout;

const InnerLayoutWrapper = styled.div`
  width: 100%;
  padding: 30px;
  border-radius: 10px;
  @media (max-width: 768px) {
    padding: 15px;
  }
`;
