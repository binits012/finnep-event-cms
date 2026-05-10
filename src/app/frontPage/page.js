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
import MonacoEditor from "@monaco-editor/react";

const toPlainOtherInfo = (otherInfo) => {
  if (!otherInfo || typeof otherInfo !== "object") return {};
  if (otherInfo instanceof Map) return Object.fromEntries(otherInfo.entries());
  return { ...otherInfo };
};

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [isEditingJson, setIsEditingJson] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [jsonContent, setJsonContent] = useState("");
  const [initialData, setInitialData] = useState({});
  const [publicSiteConfigJson, setPublicSiteConfigJson] = useState("");

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
      let otherInfo = toPlainOtherInfo(values.otherInfo);
      const trimmed = publicSiteConfigJson.trim();
      if (trimmed) {
        let parsed;
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          Toast.fire({
            icon: "error",
            title: "Public site config: invalid JSON",
          });
          setLoading(false);
          return;
        }
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          Toast.fire({
            icon: "error",
            title: "Public site config must be a JSON object",
          });
          setLoading(false);
          return;
        }
        otherInfo = { ...otherInfo, publicSiteConfig: parsed };
      }

      await apiHandler("POST", url, true, false, {
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
        otherInfo,
      });

      Toast.fire({
        icon: "success",
        title: "Settings updated successfully!",
      });
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      const msg =
        Array.isArray(apiErrors) && apiErrors.length
          ? apiErrors.slice(0, 3).join("; ")
          : err?.response?.data?.message || "Error updating settings";
      Toast.fire({
        icon: "error",
        title: msg,
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
      android:""
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
      android: values?.otherInfo?.apps?.android
    };
  };
  useEffect(() => {
    const getSettingsData = async () => {
      try {
        const response = await apiHandler("GET", "setting", true);
        const doc =
          response.data?.data &&
          Array.isArray(response.data?.data) &&
          response.data?.data[0];
        formik.setValues(transformResponseValuesToForm(doc));
        if (doc?.otherInfo?.publicSiteConfig) {
          setPublicSiteConfigJson(
            JSON.stringify(doc.otherInfo.publicSiteConfig, null, 2)
          );
        } else {
          setPublicSiteConfigJson("");
        }
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
          if (updatedData?.otherInfo?.publicSiteConfig) {
            setPublicSiteConfigJson(
              JSON.stringify(updatedData.otherInfo.publicSiteConfig, null, 2)
            );
          } else {
            setPublicSiteConfigJson("");
          }
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

  // Add download handler function
  const handleDownload = (url) => {
    if (!url) return;
    window.open(url, '_blank');
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

              <MonacoEditor
                height="100vh"
                language="json"
                // theme="vs-dark"
                value={jsonContent}
                onChange={(value) => setJsonContent(value)}
                options={{
                  selectOnLineNumbers: true,
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
                    label="About Finnep"
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

                <FormSection
                  showSection
                  title="Public storefront (domains, CORS, SEO)"
                  containerCSS={`margin-top: 20px;`}
                >
                  <Typography variant="body2" sx={{ mb: 2, maxWidth: 900 }}>
                    Optional JSON for <code>otherInfo.publicSiteConfig</code>: public
                    hostnames, primary canonical URL, hreflang, and extra CORS origins.
                    Leave empty to keep the API defaults. Invalid config is rejected by
                    the server.
                  </Typography>
                  <TextField
                    label="publicSiteConfig (JSON)"
                    value={publicSiteConfigJson}
                    onChange={(e) => setPublicSiteConfigJson(e.target.value)}
                    placeholder='{ "version": 1, "primaryCanonicalBaseUrl": "https://okazzo.eu", "hosts": [...], ... }'
                    fullWidth
                    multiline
                    minRows={12}
                    InputProps={{
                      sx: { fontFamily: "monospace", fontSize: "0.85rem" },
                    }}
                  />
                </FormSection>

                <FormSection
                  showSection
                  title="Mobile Apps"
                  containerCSS={`margin-top: 20px;`}
                >
                  <Grid container spacing={3}>
                    <Grid item container md={6} xs={12} direction={"column"} sx={{ marginBottom: 2 }}>
                      <FormLabel htmlFor="android" className="label">
                        Android
                      </FormLabel>
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs={8}>
                          <TextField
                            id="android"
                            name="android"
                            value={formik.values.android}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Android Link"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <Button
                            variant="contained"
                            color="primary"
                            disabled={!formik.values.android}
                            onClick={() => handleDownload(formik.values.android)}
                            fullWidth
                            size="medium"
                          >
                            Download
                          </Button>
                        </Grid>
                      </Grid>
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
