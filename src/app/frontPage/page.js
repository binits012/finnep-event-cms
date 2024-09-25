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
import Swal from "sweetalert2";
import dynamic from "next/dynamic";
const ReactJson = dynamic(() => import("react-json-view"), { ssr: false });

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [isEditingJson, setIsEditingJson] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [jsonContent, setJsonContent] = useState("");
  const [initialData, setInitialData] = useState({});

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
      const url = values?._id ? `setting/${values._id}` : "setting";
      const res = await apiHandler("POST", url, true, false, {
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
      });

      Toast.fire({
        icon: "success",
        title: "Settings updated successfully!",
      });
    } catch (err) {
      Toast.fire({
        icon: "error",
        title: "Error updating settings",
      });
    } finally {
      setLoading(false);
    }
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
        Toast.fire({
          icon: "error",
          title: "Error getting settings data",
        });
      }
    };
    getSettingsData();
  }, []);

  useEffect(() => {
    if (isEditingJson) {
      const fetchJsonData = async () => {
        setLoading(true);
        try {
          const response = await apiHandler("GET", "setting", true);
          const data = response.data.data[0];
          setSettingsId(data._id);
          setJsonContent(JSON.stringify(data, null, 2));
          setInitialData(data);
        } catch (err) {
          Toast.fire({
            icon: "error",
            title: `Error fetching JSON data ${err}`,
          });
        } finally {
          setLoading(false);
        }
      };

      fetchJsonData();
    }
  }, [isEditingJson]);

  const handleJsonSave = () => {
    try {
      const updatedData = {
        ...initialData,
        ...JSON.parse(jsonContent),
      };

      setLoading(true);

      apiHandler("POST", `/setting/${settingsId}`, true, false, updatedData)
        .then(() => {
          Toast.fire({
            icon: "success",
            title: "JSON data updated successfully!",
          });
          setInitialData(updatedData);
        })
        .catch((error) => {
          Toast.fire({
            icon: "error",
            title: "Error updating JSON data",
          });
        })
        .finally(() => {
          setLoading(false);
          setIsEditingJson(false);
        });
    } catch (err) {
      Toast.fire({
        icon: "error",
        title: "Invalid JSON format",
      });
    }
  };

  return (
    <FormWrapper>
      {" "}
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
      <>
        {isEditingJson ? (
          <>
            <h2>Edit JSON Data</h2>
            <ReactJson
              src={jsonContent ? JSON.parse(jsonContent) : {}}
              onEdit={(edit) =>
                setJsonContent(JSON.stringify(edit.updated_src))
              }
              onAdd={(add) => setJsonContent(JSON.stringify(add.updated_src))}
              onDelete={(del) =>
                setJsonContent(JSON.stringify(del.updated_src))
              }
              style={{
                fontFamily: "monospace",
                backgroundColor: "#f5f5f5",
                padding: "20px",
                borderRadius: "5px",
              }}
            />
            <Grid container spacing={2} mt={2} gap={2}>
              <Button
                onClick={handleJsonSave}
                color="primary"
                variant="contained"
              >
                Save JSON
              </Button>
              <Button
                onClick={() => setIsEditingJson(false)}
                variant="outlined"
              >
                Back to Settings
              </Button>
            </Grid>
          </>
        ) : (
          <form>
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
                  {formik.touched.aboutSection &&
                    formik.errors.aboutSection && (
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
                      <FormLabel htmlFor="occupancy" className="label">
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
                      <FormLabel htmlFor="email" className="label">
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
                      <FormLabel htmlFor="occupancy" className="label">
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
                      <FormLabel htmlFor="occupancy" className="label">
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
            <Grid container justifyContent={"flex-end"} gap={4}>
              <Button
                onClick={() => setIsEditingJson(true)}
                variant="outlined"
                color="primary"
              >
                Edit JSON Data
              </Button>
              <Button
                id="submit"
                onClick={formik.handleSubmit}
                variant="contained"
              >
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
        )}
      </>
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
