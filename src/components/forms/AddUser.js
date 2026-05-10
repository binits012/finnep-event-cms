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
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useState } from "react";
import apiHandler from "@/RESTAPIs/helper";
import { STRIPE_COUNTRY_OPTIONS } from "@/constants/stripeCountries";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Swal from "sweetalert2";

function parseJwtRole(token) {
  if (!token || typeof window === "undefined") return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload).role || null;
  } catch {
    return null;
  }
}

const AddUser = () => {
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const currentRole = typeof window !== "undefined"
    ? parseJwtRole(localStorage.getItem("accessToken"))
    : null;
  const canCreateRegionalUsers = currentRole === "superAdmin";

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
    try {
      const allowedCountryCodes = Array.isArray(values.allowedCountryCodes)
        ? values.allowedCountryCodes
        : [];
      const payload = {
        username: values.username,
        password: values.password,
      };
      const endpoint = values.userType === "regional" ? "user/regional" : "user/admin";

      if (values.userType === "regional") {
        payload.allowedCountryCodes = allowedCountryCodes;
      }

      await apiHandler("POST", endpoint, true, false, payload);

      Toast.fire({
        icon: "success",
        title: `${values.userType === "regional" ? "Regional user" : "Admin user"} created successfully`,
      });

      formik.resetForm();
      setLoading(false);
    } catch (err) {
      Toast.fire({
        icon: "error",
        title: err?.response?.data?.message || "Error creating user",
      });
      setLoading(false);
    }
  };
  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
      userType: "admin",
      allowedCountryCodes: [],
    },
    onSubmit: (values) => {
      const allowedCountryCodes = Array.isArray(values.allowedCountryCodes)
        ? values.allowedCountryCodes
        : [];
      if (values.userType === "regional" && allowedCountryCodes.length === 0) {
        Toast.fire({
          icon: "error",
          title: "Select at least one country for regional users",
        });
        return;
      }
      handleSubmit(values);
    },
  });

  const toggleCountryCode = (countryCode) => {
    const currentCodes = Array.isArray(formik.values.allowedCountryCodes)
      ? formik.values.allowedCountryCodes
      : [];
    const nextCodes = currentCodes.includes(countryCode)
      ? currentCodes.filter((code) => code !== countryCode)
      : [...currentCodes, countryCode];

    formik.setFieldValue("allowedCountryCodes", nextCodes);
  };

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
                <FormControl fullWidth>
                  <InputLabel>User Type</InputLabel>
                  <Select
                    label="User Type"
                    name="userType"
                    value={formik.values.userType}
                    onChange={(event) => {
                      formik.handleChange(event);
                      if (event.target.value !== "regional") {
                        formik.setFieldValue("allowedCountryCodes", []);
                      }
                    }}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    {canCreateRegionalUsers ? (
                      <MenuItem value="regional">Regional user</MenuItem>
                    ) : null}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
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
            {formik.values.userType === "regional" ? (
              <Grid container spacing={2}>
                <Grid item container md={8} mt={2} direction={"column"}>
                  <FormLabel className="label">Allowed Countries</FormLabel>
                  <FormGroup row>
                    {STRIPE_COUNTRY_OPTIONS.map((country) => (
                      <FormControlLabel
                        key={country.code}
                        control={
                          <Checkbox
                            checked={(formik.values.allowedCountryCodes || []).includes(country.code)}
                            onChange={() => toggleCountryCode(country.code)}
                          />
                        }
                        label={`${country.label} (${country.code})`}
                      />
                    ))}
                  </FormGroup>
                </Grid>
              </Grid>
            ) : null}
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
