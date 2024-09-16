"use client";
import styled from "styled-components";
import CustomBreadcrumbs from "../CustomBreadcrumbs";
import FormSection from "../FormSection";
import { useFormik } from "formik";
import {
  Backdrop,
  CircularProgress,
  Grid,
  Button,
  FormLabel,
  TextField,
} from "@mui/material";
import { useState } from "react";
import apiHandler from "@/RESTAPIs/helper";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const AddUser = () => {
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
  const handleSubmit = async (values) => {
    setLoading(true);
    console.log(values);
    try {
      const res = await apiHandler("POST", "user/admin", true, false, values);
      console.log(res, "check res");

      Toast.fire({
        icon: "success",
        title: "User Created Successfully",
      });

      setLoading(false);
    } catch (err) {
      console.log(err);
      Toast.fire({
        icon: "error",
        title: "Error Creating User",
      });
      setLoading(false);
    }
  };
  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });
  return (
    <FormWrapper>
      <CustomBreadcrumbs
        title={"Add New User"}
        links={[
          {
            path: "/users",
            title: "Users",
          },
          {
            path: "/users/add",
            title: "Add User",
            active: true,
          },
        ]}
      />
      <form>
        <Grid container direction="column" spacing={0}>
          <FormSection title="User Details" showSection>
            <Grid container spacing={2}>
              <Grid item container md={5} direction={"column"}>
                <FormLabel htmlFor="name" className="label">
                  Name
                </FormLabel>
                <TextField
                  id="name"
                  name="username"
                  type="text"
                  placeholder="Enter Name"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item container md={5} mt={2} direction={"column"}>
                <FormLabel htmlFor="password" className="label">
                  Password
                </FormLabel>
                <TextField
                  id="password"
                  name="password"
                  type={!!show ? "text" : "password"}
                  placeholder="Enter Password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  InputProps={{
                    endAdornment: !!show ? (
                      <VisibilityOffIcon
                        onClick={() => {
                          setShow(false);
                        }}
                        size={12}
                        style={{ cursor: "pointer" }}
                      />
                    ) : (
                      <VisibilityIcon
                        size={12}
                        onClick={() => {
                          setShow(true);
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </FormSection>
        </Grid>
        <Grid container justifyContent="flex-end">
          <Button id="submit" onClick={formik.handleSubmit} variant="contained">
            Add User
          </Button>
          <Backdrop
            sx={{
              color: "#fff",
              zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
            open={loading}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        </Grid>
      </form>
    </FormWrapper>
  );
};
const FormWrapper = styled.div`
  width: 100%;
  padding: 30px;
  h1 {
    margin-bottom: 30px;
  }
  .MuiTimeClock-root {
    margin: 0;
  }
  .MuiDialogActions-root {
    justify-content: flex-start;
  }
`;

export default AddUser;
