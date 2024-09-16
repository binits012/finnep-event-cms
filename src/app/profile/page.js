"use client";
import React, { useEffect } from "react";
import apiHandler from "@/RESTAPIs/helper";
import { useState } from "react";
import FormSection from "@/components/FormSection";
import { Button, FormLabel, Grid, TextField } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useFormik } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";

// Yup schema to validate the form
const schema = Yup.object().shape({
  name: Yup.string().required(),
  emailAddress: Yup.string().required().email(),
  phoneNumber: Yup.number().required().min(10),
});
const page = () => {
  const [show, setShow] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState([]);

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
    try {
      const res = await apiHandler(
        "POST",
        "auth/user/changePassword",
        true,
        false,
        {
          username: values.username,
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }
      );
      console.log(res, "check res");

      Toast.fire({
        icon: "success",
        title: "Password Changed Successfully !!",
      });
    } catch (err) {
      console.log(err);
      Toast.fire({
        icon: "error",
        title: "Changing Password Failed !!",
      });
    }
  };

  const formik = useFormik({
    initialValues: {
      username: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: (values) => handleSubmit(values),
  });

  const createContact = async () => {
    try {
      const res = await apiHandler(
        "POST",
        `user/${users.id}/contact`,
        true,
        false
      );
      console.log(res, "check res");
    } catch (err) {
      console.log(err);
    }
  };

  const contactFormik = useFormik({
    initialValues: {
      streetName: "",
      emailAddress: "",
      phoneNumber: "",
    },
    validationSchema: schema,
    onSubmit: (values) => {
      createContact(values);
    },
  });

  return (
    <>
      <form>
        <FormSection title="Change Password" showSection>
          <Grid container spacing={2} direction={"column"}>
            <Grid item container md={5} direction={"column"}>
              <FormLabel htmlFor="username" className="label">
                Username
              </FormLabel>
              <TextField
                id="username"
                name="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                placeholder="User Name"
                type="text"
              />
            </Grid>
            <Grid item container md={5} direction={"column"}>
              <FormLabel htmlFor="oldPassword" className="label">
                Old Password
              </FormLabel>
              <TextField
                id="oldPassword"
                name="oldPassword"
                value={formik.values.oldPassword}
                onChange={formik.handleChange}
                placeholder="Old Password"
                type={!!show ? "text" : "password"}
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
            <Grid item container md={15} direction={"column"}>
              <FormLabel htmlFor="newPassword" className="label">
                New Password
              </FormLabel>
              <TextField
                id="newPassword"
                name="newPassword"
                placeholder="New Password"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                fullWidth
                type={!!showPassword ? "text" : "password"}
                InputProps={{
                  endAdornment: !!showPassword ? (
                    <VisibilityOffIcon
                      onClick={() => {
                        setShowPassword(false);
                      }}
                      size={12}
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <VisibilityIcon
                      size={12}
                      onClick={() => {
                        setShowPassword(true);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  ),
                }}
              />
            </Grid>
            <Grid item container md={15} direction={"column"}>
              <FormLabel htmlFor="newPassword" className="label">
                Confirm Password
              </FormLabel>
              <TextField
                id="newPassword"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                // value={setOldPassword}
                fullWidth
                type={!!showPassword ? "text" : "password"}
                InputProps={{
                  endAdornment: !!showPassword ? (
                    <VisibilityOffIcon
                      onClick={() => {
                        setShowPassword(false);
                      }}
                      size={12}
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <VisibilityIcon
                      size={12}
                      onClick={() => {
                        setShowPassword(true);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  ),
                }}
              />
            </Grid>
          </Grid>
          <Grid container justifyContent="flex-end" mt={3}>
            <Button
              variant="contained"
              type="button"
              onClick={formik.handleSubmit}
            >
              Change Password
            </Button>
          </Grid>
        </FormSection>
      </form>
      <form>
        <FormSection title="Contact Details" showSection>
          <Grid item container md={8} direction={"column"} mt={2}>
            <FormLabel htmlFor="Contact" className="label">
              Street Name
            </FormLabel>
            <TextField
              id="streetName"
              name="streetName"
              placeholder="Street Name"
              value={contactFormik.values.streetName}
              onChange={contactFormik.handleChange}
              fullWidth
            />
          </Grid>
          <Grid item container md={8} direction={"column"} mt={2}>
            <FormLabel htmlFor="Contact" className="label">
              Phone
            </FormLabel>
            <TextField
              id="phoneNumber"
              name="phoneNumber"
              placeholder="Phone Number"
              value={contactFormik.values.phoneNumber}
              onChange={contactFormik.handleChange}
              fullWidth
            />
          </Grid>
          <Grid item container md={8} direction={"column"} mt={2}>
            <FormLabel htmlFor="Contact" className="label">
              Email
            </FormLabel>
            <TextField
              id="emailAddress"
              name="emailAddress"
              placeholder="Email Address"
              value={contactFormik.values.emailAddress}
              onChange={contactFormik.handleChange}
              fullWidth
            />
          </Grid>

          <Grid container justifyContent="flex-end" mt={3}>
            <Button
              variant="contained"
              type="button"
              onClick={() => {
                createContact();
              }}
            >
              Submit
            </Button>
          </Grid>
        </FormSection>
      </form>
    </>
  );
};

export default page;
