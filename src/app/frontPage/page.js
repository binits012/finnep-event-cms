"use client";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import FormSection from "@/components/FormSection";
import TextEditor from "@/components/TextEditor";
import { Grid, Typography, FormLabel, TextField, Button } from "@mui/material";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import styled from "styled-components";
import toast from "react-hot-toast";

const Settings = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    return toast
      .promise(
        apiHandler("POST", `setting/${values?._id}`, true, false, {
          ...values,
          socialMedia: {
            fb: values.fbLink,
            x: values.xLink,
            instagram: values.instaLink,
          },
          contactInfo: {
            email: values.email,
            phone: values.phone,
          },
        }),
        {
          loading: "Updating settings...",
          success: "Settings updated successfully!",
          error: "Error updating settings",
        }
      )
      .finally(() => {
        setLoading(false);
      });
  };

  const formik = useFormik({
    initialValues: {
      aboutSection: "",
      email: "",
      phone: "",
      fbLink: "",
      xLink: "",
      instaLink: "",
    },
    onSubmit: (values) => handleSubmit(values),
  });

  const transformResponseValuesToForm = (values) => {
    return {
      ...values,
      email: values.contactInfo.email,
      phone: values.contactInfo.phone,
      fbLink: values.socialMedia.fb,
      xLink: values.socialMedia.x,
      instaLink: values.socialMedia.instagram,
    };
  };

  useEffect(() => {
    const getSettingsData = async () => {
      try {
        const response = await apiHandler("GET", "setting", true);
        formik.setValues(
          transformResponseValuesToForm(
            response.data?.data &&
              Array.isArray(response.data?.data) &&
              response.data?.data[0]
          )
        );
      } catch (err) {
        console.log(err);
        toast.error("Error Getting details");
      }
    };
    getSettingsData();
  }, []);

  return (
    <FormWrapper>
      <CustomBreadcrumbs
        title={`Front Page / Front Page Details`}
        links={[
          {
            path: "/frontPage",
            title: "Front Page",
            active: true,
          },
        ]}
      />
      <form onSubmit={formik.handleSubmit}>
        <Grid container direction="column" spacing={0}>
          <FormSection title="FrontPage Details" showSection>
            <Grid item md={12} sm={12}>
              <TextEditor
                name="aboutSection"
                id="aboutSection"
                value={formik.values.aboutSection}
                label="About YellowBridge"
                handleChange={(text) => {
                  formik.setFieldValue("aboutSection", text);
                }}
                error={
                  formik.touched.aboutSection && formik.errors.aboutSection
                }
                required={true}
                setImageId={() => {}}
              />
              {formik.touched.aboutSection && formik.errors.aboutSection && (
                <Typography color="red" sx={{ mt: 1 }}>
                  {formik.errors.aboutSection}
                </Typography>
              )}
            </Grid>
            <FormSection
              title="Contacts"
              containerCSS={`margin-top: 20px;`}
              showSection
            >
              <Grid container spacing={2}>
                <Grid item container md={5} direction={"column"}>
                  <FormLabel htmlFor="email" className="label">
                    Email
                  </FormLabel>
                  <TextField
                    id="email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Email"
                    fullWidth
                    type="email"
                  />
                </Grid>
                <Grid item container md={5} direction={"column"}>
                  <FormLabel htmlFor="phone" className="label">
                    Phone
                  </FormLabel>
                  <TextField
                    id="phone"
                    name="phone"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Phone"
                    fullWidth
                    type="tel"
                  />
                </Grid>
              </Grid>
            </FormSection>
            <FormSection
              showSection
              title="Social Media"
              containerCSS={`margin-top: 20px;`}
            >
              <Grid container spacing={2}>
                <Grid item container md={5} direction={"column"}>
                  <FormLabel htmlFor="fbLink" className="label">
                    Facebook Page
                  </FormLabel>
                  <TextField
                    id="fbLink"
                    name="fbLink"
                    value={formik.values.fbLink}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Facebook Page"
                    fullWidth
                  />
                </Grid>
                <Grid item container md={5} direction={"column"}>
                  <FormLabel htmlFor="xLink" className="label">
                    Twitter/X Handle
                  </FormLabel>
                  <TextField
                    id="xLink"
                    name="xLink"
                    value={formik.values.xLink}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Twitter/X Handle"
                    fullWidth
                  />
                </Grid>
                <Grid item container md={5} direction={"column"}>
                  <FormLabel htmlFor="instaLink" className="label">
                    Instagram Account
                  </FormLabel>
                  <TextField
                    id="instaLink"
                    name="instaLink"
                    value={formik.values.instaLink}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Instagram Account"
                    fullWidth
                  />
                </Grid>
              </Grid>
            </FormSection>
          </FormSection>
        </Grid>
        <Grid container justifyContent={"flex-end"}>
          <Button id="submit" type="submit" variant="contained">
            Update Front Page Details
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

export default Settings;
