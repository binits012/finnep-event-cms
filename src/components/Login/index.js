import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  Typography,
  FormControlLabel,
  Checkbox,
  Button,
  TextField,
} from "@mui/material";
import { toast } from "react-toastify";
import Link from "next/link";
// import { AircraftImage } from "../assets";
// import Text from "../Text";
// import Button from "../Button";

import { MdOutlineMailOutline } from "react-icons/md";
import { HiOutlinePhone } from "react-icons/hi";

import styled from "styled-components";
import { useRouter } from "next/router";
import { BeatLoader, ClipLoader } from "react-spinners";
import { useDispatch, useSelector } from "react-redux";
// import { getResetLink, login as loginApi } from "../../RESTAPIs/users";
import moment from "moment";
import { motion } from "framer-motion";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import axios from "axios";
export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetLinkEmail, setResetLinkEmail] = useState("");
  //   const handleSendResetLink = async () => {
  //     try {
  //       const res = await getResetLink({ username: resetLinkEmail });
  //       toast.success("Reset link has been sent to the linked email address.");
  //       setResetLinkEmail("");
  //       // setForgotPassword(false)
  //     } catch (err) {
  //       toast.error("Username not found!");
  //     }
  //   };
  const [keepSignedIn, setKeepmeSignedIn] = useState("");

  //   const dispatch = useDispatch();

  const handleChangeKeepSignedIn = (e) => {
    if (keepSignedIn === "yes") {
      setKeepmeSignedIn("no");
    }
    if (keepSignedIn !== "yes") {
      setKeepmeSignedIn("yes");
    }
  };

  const handleSubmit = async (e) => {
    setLoading(true);
    try {
      const res = await axios({
        method: "POST",
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        url: "auth/user/login",
        headers: {
          "Content-Type": "application/json",
        },
        data: { username, password },
      });

      if (!!res.data.result) {
        if (keepSignedIn === "yes") {
          localStorage.setItem("fts-user", JSON.stringify(res.data.result));
          localStorage.setItem("ftsAccessToken", res.data.result.token);
          localStorage.setItem("stamp", moment().toISOString());
        } else {
        }
      }
      localStorage.setItem("fts-user", JSON.stringify(res.data.result));
      localStorage.setItem("ftsAccessToken", res.data.result.token);
      localStorage.setItem("stamp", moment().toISOString());
      setLoading(false);
      //   dispatch(loginSuccessActionn(res.data.result));
      toast("Logged In Successfully", {
        autoClose: 5000,
        position: toast?.POSITION.TOP_RIGHT,
      });
    } catch (err) {
      setLoading(false);
      toast("Invalid email or password", {
        autoClose: 5000,
        position: toast?.POSITION.TOP_RIGHT,
      });
      console.log(err, "check err");
    }
  };

  const passwordRef = useRef(null);
  const handlePressEnter = (input) => (e) => {
    if (e.code === "Enter") {
      if (input === "username") {
        passwordRef?.current?.focus();
      }
      if (input === "password") {
        handleSubmit(e);
      }
    }
  };
  console.log(passwordRef);
  return (
    <Page className="container">
      <Head>
        <title>Yellow Bridge CMS</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MainContainer>
        {/* <Grid container> */}
        <div className="aircraft-img-container">
          <div className="logo">
            <img src="/fts_logo.png" alt="logo" />
          </div>
        </div>
        <Grid
          item
          container
          direction="column"
          className="field-container login-container"
        >
          <LoginContainer
            initial={{ opacity: 0.75, translateX: -80, scale: 1 }}
            animate={{ opacity: 1, translateX: 10, scale: 1 }}
            exit={{ opacity: 0, translateX: -24 }}
            transition={{ duration: 0.5 }}
          >
            <div className="login-form-wrap">
              <div className="mb-30">
                <StyledHeader>Login</StyledHeader>
                <StyledSubHeader>
                  Enter your email and password to login
                </StyledSubHeader>
              </div>
              <TextField
                borderColor={"#CCCCCC"}
                label="Username"
                placeholder="eg. example@mail.com"
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handlePressEnter("username")}
                value={username}
                containerWidth={"100%"}
                containerCSS={"margin-bottom: 30px;"}
                style={{
                  width: "100%",
                }}
              />
              <TextField
                borderColor={"#CCCCCC"}
                label="Password"
                placeholder="Enter your password"
                type={!!show ? "text" : "password"}
                inputRef={passwordRef}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handlePressEnter("password")}
                value={password}
                containerCSS={"margin-bottom: 30px;"}
                containerWidth={"100%"}
                style={{
                  width: "100%",
                }}
                rightIcon={
                  !!show ? (
                    <VisibilityOffIcon
                      onClick={() => {
                        setShow(false);
                      }}
                      size={12}
                    />
                  ) : (
                    <VisibilityIcon
                      size={12}
                      onClick={() => {
                        setShow(true);
                      }}
                    />
                  )
                }
              />
              <Grid
                className="mb-30"
                alignSelf={"flex-start"}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <FormControlLabel
                  className="keepLogin"
                  label="Keep me signed in"
                  control={
                    <Checkbox
                      checked={keepSignedIn === "yes"}
                      onChange={handleChangeKeepSignedIn}
                    />
                  }
                  style={{
                    color: "#737373",
                    fontSize: "16px",
                    marginLeft: "0",
                    marginRight: "0",
                  }}
                />

                <Grid item>
                  <div
                    color="inherit"
                    role="button"
                    style={{ cursor: "pointer" }}
                    onClick={() => setForgotPassword(true)}
                  >
                    <span style={{ color: "var(--primary)" }}>
                      Forgot your password?
                    </span>
                  </div>
                </Grid>
              </Grid>

              <Grid item md={12}>
                <Button
                  className="btn primary"
                  width="100%"
                  mBot={18}
                  disabled={loading}
                  variant="outlined"
                  onClick={handleSubmit}
                >
                  {loading ? (
                    <BeatLoader color={"#1336f0"} speedMultiplier={0.5} />
                  ) : (
                    "Login"
                  )}
                </Button>
              </Grid>

              <InfoContainer
                className="mt-30"
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <Box style={{ alignItems: "center", gap: "5px" }}>
                  <MdOutlineMailOutline color="var(--gray-800)" size={24} />
                  {/* <Text content="info@flighttaxsystems.com" /> */}
                </Box>
                <Box style={{ alignItems: "center", gap: "5px" }}>
                  <HiOutlinePhone color="var(--gray-800)" size={24} />
                  {/* <Text content="954.763.9363" mLeft={5} /> */}
                </Box>
              </InfoContainer>
            </div>
          </LoginContainer>
        </Grid>
      </MainContainer>
    </Page>
  );
}

const Box = styled.div`
  margin-top: ${(props) => props.mTop || 0}px;
  margin-bottom: ${(props) => props.mBot || 0}px;
  margin-left: ${(props) => props.mLeft || 0}px;
  margin-right: ${(props) => props.mRight || 0}px;
  display: flex;
`;

const Page = styled.div`
  width: 100%;
  .login-form-wrap {
    width: 410px;
  }
  .login-container {
    width: 50%;
    height: 100vh;
    display: flex;
  }
`;
const MainContainer = styled.div`
  background: url("/login_background.jpg") no-repeat;
  background-size: cover;
  width: 100%;
  display: -webkit-flex;
  display: flex;

  margin: 0 auto;
  height: auto;

  .logo {
    margin-left: 50px;
    margin-top: 32px;
  }

  .aircraft-img-container {
    width: 50%;
    // padding: 50px 0 50px 50px;
  }

  .aircraft {
    object-fit: cover;
    // border-radius: 8px;
    width: 100%;
    height: calc(100vh);
    // height: calc(100vh - 100px);
  }
`;

const LoginContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  height: 100vh;
  position: relative;
  align-items: center;
  .login-form-wrap {
    width: 432px;
    background-color: #ffffff;
    padding: 24px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
  .keepLogin span {
    padding: 0;
    margin-right: 8px;
  }
`;
const InfoContainer = styled.div`
  // display: flex;
  // align-items: center;
  // justify-content: space-between;
  // max-width: 410px;
  // width: 100%;
  // padding-bottom: 24px;
  // position: absolute;
  // bottom: 0px;
`;

const StyledHeader = styled.h1`
  font-family: "Roboto" !important;
  font-style: normal;
  font-weight: 700;
  font-size: 40px;
  line-height: 52px;
  text-align: center;
  color: #000000;
`;
const StyledSubHeader = styled.p`
  // font-family: "Roboto";
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  color: #4c4c4c;
`;
