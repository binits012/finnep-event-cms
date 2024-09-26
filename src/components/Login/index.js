import Head from "next/head";
import React, { useRef, useState } from "react";
import { Grid, Button, TextField } from "@mui/material";
import { toast } from "react-toastify";
import styled from "styled-components";
import { BeatLoader } from "react-spinners";
import moment from "moment";
import { motion } from "framer-motion";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import axios from "axios";
import { setUser } from "@/store/reducers/userSlice";
import { useDispatch } from "react-redux";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import "./login.css";

const MotionWrapper = styled(motion.div)`
  opacity: 0.75;
  transform: translateX(-80px);
  scale: 1;
`;

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
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

  const dispatch = useDispatch();

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
    setOpen(true);
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
          localStorage.setItem("auth", JSON.stringify(res.data));
          localStorage.setItem("accessToken", res.data.token);
          localStorage.setItem("stamp", moment().toISOString());
        } else {
        }
      }
      localStorage.setItem("auth", JSON.stringify(res.data));
      localStorage.setItem("accessToken", res.data.token);
      localStorage.setItem("stamp", moment().toISOString());
      setLoading(false);
      setOpen(false);
      dispatch(setUser(res.data));
      toast("Logged In Successfully", {
        autoClose: 5000,
      });
    } catch (err) {
      setLoading(false);
      setOpen(false);
      toast("Invalid email or password", {
        autoClose: 5000,
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
  return (
    <div className="page">
      <Head>
        <title>Yellow Bridge CMS</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="main-container">
        <div className="aircraft-img-container">
          <div className="logo">
            <img src="logo.png" alt="logo" />
          </div>
        </div>
        <Grid
          item
          container
          direction="column"
          className="field-container login-container"
        >
          <MotionWrapper
            className="login-form-wrap"
            layout
            initial={{ opacity: 0.75, translateX: -80 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -24 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <h1 className="styled-header">Login</h1>
            <p className="styled-sub-header">
              Enter your email and password to login
            </p>
            <TextField
              label="Username"
              placeholder="eg. example@mail.com"
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handlePressEnter("username")}
              value={username}
              style={{ width: "100%", marginBottom: 20 }}
            />
            <TextField
              label="Password"
              placeholder="Enter your password"
              type={show ? "text" : "password"}
              inputRef={passwordRef}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePressEnter("password")}
              value={password}
              style={{ width: "100%", marginBottom: 20 }}
              InputProps={{
                endAdornment: show ? (
                  <VisibilityOffIcon
                    onClick={() => setShow(false)}
                    style={{ cursor: "pointer" }}
                  />
                ) : (
                  <VisibilityIcon
                    onClick={() => setShow(true)}
                    style={{ cursor: "pointer" }}
                  />
                ),
              }}
            />
            <Grid item md={12}>
              <Button
                role="button"
                className="btn primary"
                width="100%"
                disabled={loading}
                variant="contained"
                onClick={handleSubmit}
                style={{ width: "100%" }}
              >
                {loading ? (
                  <BeatLoader color={"#1336f0"} speedMultiplier={0.5} />
                ) : (
                  "Login"
                )}
              </Button>
            </Grid>
          </MotionWrapper>
          <Backdrop
            sx={{
              color: "#fff",
              zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
            open={open}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        </Grid>
      </div>
    </div>
  );
}
