"use client";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import FormSection from "@/components/FormSection";
import TextEditor from "@/components/TextEditor";
import {
  Grid,
  Typography,
  FormLabel,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
} from "@mui/material";
import { useFormik } from "formik";
import { useEffect, useRef, useState } from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import styled from "styled-components";
import Swal from "sweetalert2";
import MonacoEditor from "@monaco-editor/react";

const toPlainOtherInfo = (otherInfo) => {
  if (!otherInfo || typeof otherInfo !== "object") return {};
  if (otherInfo instanceof Map) return Object.fromEntries(otherInfo.entries());
  return { ...otherInfo };
};

function parseJwtRole() {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const jsonPayload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const p = JSON.parse(jsonPayload);
    return p.role || null;
  } catch {
    return null;
  }
}

function canEditBusinessLanding() {
  const r = parseJwtRole();
  return r === "admin" || r === "superAdmin";
}

/** Mirrors server limits in `util/businessLanding.js` (trim + max length). */
const BL_OVERVIEW_LIMITS = {
  title: 500,
  subtitle: 1000,
  primaryCta: 200,
  primaryCtaUrl: 2000,
  seoTitle: 200,
  seoDescription: 500,
};

/**
 * @returns {{ ok: true, doc: object, isEmpty: boolean } | { ok: false, error: string }}
 */
function parseBusinessLandingJsonForOverview(str) {
  const t = (str ?? "").trim();
  if (!t) {
    return { ok: true, doc: {}, isEmpty: true };
  }
  try {
    const doc = JSON.parse(t);
    if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
      return { ok: false, error: "businessLanding must be a JSON object." };
    }
    return { ok: true, doc, isEmpty: false };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Invalid JSON",
    };
  }
}

function sliceOverviewFromBlDoc(doc) {
  const d = doc && typeof doc === "object" && !Array.isArray(doc) ? doc : {};
  const hero =
    d.hero && typeof d.hero === "object" && !Array.isArray(d.hero)
      ? d.hero
      : {};
  const seo =
    d.seo && typeof d.seo === "object" && !Array.isArray(d.seo) ? d.seo : {};
  const version =
    typeof d.version === "number" &&
    Number.isFinite(d.version) &&
    d.version >= 1
      ? d.version
      : 1;
  return {
    version,
    title: String(hero.title ?? ""),
    subtitle: String(hero.subtitle ?? ""),
    primaryCta: String(hero.primaryCta ?? ""),
    primaryCtaUrl: String(hero.primaryCtaUrl ?? ""),
    seoTitle: String(seo.title ?? ""),
    seoDescription: String(seo.description ?? ""),
  };
}

/**
 * @param {string} currentJson
 * @param {"title"|"subtitle"|"primaryCta"|"primaryCtaUrl"|"seoTitle"|"seoDescription"} field
 * @param {string} rawValue
 */
function mergeOverviewFieldIntoBusinessLandingJson(currentJson, field, rawValue) {
  const parsed = parseBusinessLandingJsonForOverview(currentJson);
  if (!parsed.ok) {
    return { ok: false };
  }
  const doc = parsed.isEmpty
    ? { version: 1 }
    : JSON.parse(JSON.stringify(parsed.doc));
  if (typeof doc !== "object" || doc === null) {
    return { ok: false };
  }
  if (
    typeof doc.version !== "number" ||
    !Number.isFinite(doc.version) ||
    doc.version < 1
  ) {
    doc.version = 1;
  }
  if (!doc.hero || typeof doc.hero !== "object" || Array.isArray(doc.hero)) {
    doc.hero = {};
  }
  if (!doc.seo || typeof doc.seo !== "object" || Array.isArray(doc.seo)) {
    doc.seo = {};
  }
  const trimSlice = (s, max) => {
    const t = String(s ?? "").trim();
    return t.length > max ? t.slice(0, max) : t;
  };
  if (field === "title") {
    const t = trimSlice(rawValue, BL_OVERVIEW_LIMITS.title);
    if (t) doc.hero.title = t;
    else delete doc.hero.title;
  } else if (field === "subtitle") {
    const t = trimSlice(rawValue, BL_OVERVIEW_LIMITS.subtitle);
    if (t) doc.hero.subtitle = t;
    else delete doc.hero.subtitle;
  } else if (field === "primaryCta") {
    const t = trimSlice(rawValue, BL_OVERVIEW_LIMITS.primaryCta);
    if (t) doc.hero.primaryCta = t;
    else delete doc.hero.primaryCta;
  } else if (field === "primaryCtaUrl") {
    const t = trimSlice(rawValue, BL_OVERVIEW_LIMITS.primaryCtaUrl);
    if (t) doc.hero.primaryCtaUrl = t;
    else delete doc.hero.primaryCtaUrl;
  } else if (field === "seoTitle") {
    const t = trimSlice(rawValue, BL_OVERVIEW_LIMITS.seoTitle);
    if (t) doc.seo.title = t;
    else delete doc.seo.title;
  } else if (field === "seoDescription") {
    const t = trimSlice(rawValue, BL_OVERVIEW_LIMITS.seoDescription);
    if (t) doc.seo.description = t;
    else delete doc.seo.description;
  }
  if (Object.keys(doc.hero).length === 0) {
    delete doc.hero;
  }
  if (Object.keys(doc.seo).length === 0) {
    delete doc.seo;
  }
  return { ok: true, json: JSON.stringify(doc, null, 2) };
}

const NEW_COUNTRY_VALUE = "__new_country__";

const INITIAL_FORM_VALUES = {
  _id: "",
  isPlatformDefault: true,
  marketCountryCode: "",
  aboutSection: "",
  email: "",
  phone: "",
  fbLink: "",
  xLink: "",
  instaLink: "",
  android: "",
};

const rowLabel = (row) => {
  if (!row) return "—";
  if (row.isPlatformDefault) return "Global default (all markets)";
  const c = row.marketCountryCode ? String(row.marketCountryCode).toUpperCase() : "";
  return c ? `Country: ${c}` : "Untitled row";
};

function transformToForm(values) {
  if (!values || typeof values !== "object") {
    return { ...INITIAL_FORM_VALUES };
  }
  return {
    ...INITIAL_FORM_VALUES,
    _id: values._id || "",
    isPlatformDefault: !!values.isPlatformDefault,
    marketCountryCode: values.marketCountryCode
      ? String(values.marketCountryCode).toUpperCase()
      : "",
    aboutSection: values.aboutSection || "",
    email: values.contactInfo?.email || "",
    phone: values.contactInfo?.phone || "",
    fbLink: values.socialMedia?.fb || "",
    xLink: values.socialMedia?.x || "",
    instaLink: values.socialMedia?.instagram || "",
    android: values?.otherInfo?.apps?.android || "",
    otherInfo: values.otherInfo,
  };
}

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [isEditingJson, setIsEditingJson] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [jsonContent, setJsonContent] = useState("");
  const [initialData, setInitialData] = useState({});
  const [publicSiteConfigJson, setPublicSiteConfigJson] = useState("");
  const [businessLandingJson, setBusinessLandingJson] = useState("");
  const [settingsRows, setSettingsRows] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState("");
  const formikRef = useRef(null);

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

  const syncSettingsFromServer = async (preferredRowId) => {
    const response = await apiHandler("GET", "setting", true);
    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
    setSettingsRows(rows);
    const sorted = [...rows].sort((a, b) => {
      if (a.isPlatformDefault && !b.isPlatformDefault) return -1;
      if (!a.isPlatformDefault && b.isPlatformDefault) return 1;
      return String(a.marketCountryCode || "").localeCompare(
        String(b.marketCountryCode || "")
      );
    });
    const pick =
      (preferredRowId &&
        rows.find((r) => String(r._id) === String(preferredRowId))) ||
      sorted.find((r) => r.isPlatformDefault) ||
      sorted[0] ||
      null;
    const fk = formikRef.current;
    if (pick && fk) {
      setSelectedRowId(String(pick._id));
      fk.setValues(transformToForm(pick));
      if (pick.otherInfo?.publicSiteConfig) {
        setPublicSiteConfigJson(
          JSON.stringify(pick.otherInfo.publicSiteConfig, null, 2)
        );
      } else {
        setPublicSiteConfigJson("");
      }
      if (pick.otherInfo?.businessLanding != null) {
        setBusinessLandingJson(
          JSON.stringify(pick.otherInfo.businessLanding, null, 2)
        );
      } else {
        setBusinessLandingJson("");
      }
    } else if (fk) {
      setSelectedRowId("");
      fk.setValues({ ...INITIAL_FORM_VALUES });
      setPublicSiteConfigJson("");
      setBusinessLandingJson("");
    }
  };

  const formik = useFormik({
    initialValues: INITIAL_FORM_VALUES,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const isUpdate = Boolean(values?._id);
        const url = isUpdate ? `setting/${values._id}` : "setting";
        const plain = toPlainOtherInfo(values.otherInfo);
        let otherInfoMerged = { ...plain };
        const androidUrl = (values.android || "").trim();
        if (androidUrl) {
          otherInfoMerged = {
            ...otherInfoMerged,
            apps: { ...(plain.apps || {}), android: androidUrl },
          };
        }
        if (!canEditBusinessLanding()) {
          delete otherInfoMerged.businessLanding;
        } else {
          const blTrim = businessLandingJson.trim();
          if (blTrim) {
            try {
              const parsedBl = JSON.parse(blTrim);
              if (
                parsedBl === null ||
                typeof parsedBl !== "object" ||
                Array.isArray(parsedBl)
              ) {
                Toast.fire({
                  icon: "error",
                  title: "Business landing must be a JSON object (or leave empty)",
                });
                return;
              }
              otherInfoMerged = {
                ...otherInfoMerged,
                businessLanding: parsedBl,
              };
            } catch {
              Toast.fire({
                icon: "error",
                title: "Business landing: invalid JSON",
              });
              return;
            }
          } else {
            delete otherInfoMerged.businessLanding;
          }
        }
        const trimmed = publicSiteConfigJson.trim();

        const payload = {
          aboutSection: values.aboutSection,
          socialMedia: {
            fb: values.fbLink,
            x: values.xLink,
            instagram: values.instaLink,
          },
          contactInfo: {
            email: values.email,
            phone: values.phone,
          },
        };

        if (!isUpdate) {
          if (selectedRowId === NEW_COUNTRY_VALUE) {
            const code = (values.marketCountryCode || "").trim().toUpperCase();
            if (!/^[A-Z]{2}$/.test(code)) {
              Toast.fire({
                icon: "error",
                title: "Enter a valid ISO 3166-1 alpha-2 country code (e.g. FI, SE).",
              });
              return;
            }
            payload.marketCountryCode = code;
            payload.isPlatformDefault = false;
          }
        } else {
          if (values.isPlatformDefault) {
            payload.isPlatformDefault = true;
          } else {
            const code = (values.marketCountryCode || "").trim().toUpperCase();
            if (!/^[A-Z]{2}$/.test(code)) {
              Toast.fire({
                icon: "error",
                title:
                  "Country code must be exactly 2 letters (ISO 3166-1 alpha-2).",
              });
              return;
            }
            payload.marketCountryCode = code;
          }
        }

        if (trimmed) {
          let parsed;
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            Toast.fire({
              icon: "error",
              title: "Public site config: invalid JSON",
            });
            return;
          }
          if (
            parsed === null ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
          ) {
            Toast.fire({
              icon: "error",
              title: "Public site config must be a JSON object",
            });
            return;
          }
          payload.otherInfo = { ...otherInfoMerged, publicSiteConfig: parsed };
        } else if (Object.keys(otherInfoMerged).length > 0) {
          payload.otherInfo = otherInfoMerged;
        }

        const res = await apiHandler("POST", url, true, false, payload);
        Toast.fire({
          icon: "success",
          title: "Settings updated successfully!",
        });
        const saved = res?.data?.data;
        const nextId =
          !isUpdate && saved?._id
            ? String(saved._id)
            : isUpdate
              ? String(values._id)
              : null;
        await syncSettingsFromServer(nextId);
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
    },
  });

  formikRef.current = formik;

  useEffect(() => {
    (async () => {
      try {
        await syncSettingsFromServer(null);
      } catch {
        Toast.fire({
          icon: "error",
          title: "Error getting settings data",
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (isEditingJson) {
      const fetchJsonData = async () => {
        setLoading(true);
        try {
          if (selectedRowId === NEW_COUNTRY_VALUE || !selectedRowId) {
            Toast.fire({
              icon: "warning",
              title: "Select a saved settings row before editing raw JSON.",
            });
            setIsEditingJson(false);
            return;
          }
          const response = await apiHandler("GET", "setting", true);
          const rows = Array.isArray(response.data?.data)
            ? response.data.data
            : [];
          const data = rows.find((r) => String(r._id) === String(selectedRowId));
          if (!data) {
            Toast.fire({ icon: "error", title: "Selected row not found." });
            setIsEditingJson(false);
            return;
          }
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
  }, [isEditingJson, selectedRowId]);

  const handleJsonSave = () => {
    try {
      const updatedData = {
        ...initialData,
        ...JSON.parse(jsonContent),
      };

      setLoading(true);

      apiHandler("POST", `/setting/${settingsId}`, true, false, updatedData)
        .then(async () => {
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
          if (updatedData?.otherInfo?.businessLanding != null) {
            setBusinessLandingJson(
              JSON.stringify(updatedData.otherInfo.businessLanding, null, 2)
            );
          } else {
            setBusinessLandingJson("");
          }
          await syncSettingsFromServer(settingsId);
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

  const handleBusinessLandingOverviewChange = (field) => (e) => {
    if (!canEditBusinessLanding()) return;
    const merged = mergeOverviewFieldIntoBusinessLandingJson(
      businessLandingJson,
      field,
      e.target.value,
    );
    if (merged.ok) {
      setBusinessLandingJson(merged.json);
    }
  };

  const businessLandingOverviewParse =
    parseBusinessLandingJsonForOverview(businessLandingJson);
  const businessLandingOverviewSlice = businessLandingOverviewParse.ok
    ? sliceOverviewFromBlDoc(businessLandingOverviewParse.doc)
    : sliceOverviewFromBlDoc({});
  const businessLandingOverviewFieldsDisabled =
    !businessLandingOverviewParse.ok;

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
              <FormSection title="Market / platform scope" showSection>
                <Typography variant="body2" sx={{ mb: 2, maxWidth: 900 }}>
                  <strong>Which row am I editing?</strong> Use the dropdown.{" "}
                  <strong>Global default</strong> is the baseline for every market. A{" "}
                  <strong>country row</strong> (e.g. FI) only needs values that differ;
                  when the app calls the API with <code>x-country-code: FI</code>, the
                  backend <em>merges</em> default + that row.
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, maxWidth: 900 }} color="text.secondary">
                  <strong>Contacts and social:</strong> the form fields below belong to
                  the <em>selected row</em>. For a country row, set the email/phone/social
                  values that should apply for that market; in the merged API response,
                  each field you set on the country row overrides the global default for
                  that field.{" "}
                  <strong>Privacy, terms, logos, legal copy, locales:</strong> these
                  usually live under <code>otherInfo</code> (same as today). Merge is{" "}
                  <strong>shallow on top-level keys</strong>: if both rows define the same{" "}
                  <code>otherInfo</code> key, the country row wins the whole value for
                  that key (e.g. one nested <code>locales</code> object replaces the
                  default&apos;s for that key). Use <strong>Edit JSON Data</strong> for
                  complex <code>otherInfo</code> structures, or duplicate keys you need
                  to override on the country row.
                </Typography>
                {settingsRows.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No settings rows yet. Save this form once to create the global
                    default; then you can add country-specific rows.
                  </Typography>
                ) : (
                  <>
                    <FormControl fullWidth sx={{ maxWidth: 480, mb: 2 }}>
                      <InputLabel id="settings-row-label">Settings row</InputLabel>
                      <Select
                        labelId="settings-row-label"
                        label="Settings row"
                        value={selectedRowId || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSelectedRowId(v);
                          if (v === NEW_COUNTRY_VALUE) {
                            const def =
                              settingsRows.find((r) => r.isPlatformDefault) ||
                              settingsRows[0];
                            formik.setValues({
                              ...transformToForm(def || {}),
                              _id: "",
                              isPlatformDefault: false,
                              marketCountryCode: "",
                            });
                            if (def?.otherInfo?.publicSiteConfig) {
                              setPublicSiteConfigJson(
                                JSON.stringify(
                                  def.otherInfo.publicSiteConfig,
                                  null,
                                  2
                                )
                              );
                            } else {
                              setPublicSiteConfigJson("");
                            }
                            if (def?.otherInfo?.businessLanding != null) {
                              setBusinessLandingJson(
                                JSON.stringify(def.otherInfo.businessLanding, null, 2)
                              );
                            } else {
                              setBusinessLandingJson("");
                            }
                          } else {
                            const doc = settingsRows.find(
                              (r) => String(r._id) === String(v)
                            );
                            if (doc) {
                              formik.setValues(transformToForm(doc));
                              if (doc.otherInfo?.publicSiteConfig) {
                                setPublicSiteConfigJson(
                                  JSON.stringify(
                                    doc.otherInfo.publicSiteConfig,
                                    null,
                                    2
                                  )
                                );
                              } else {
                                setPublicSiteConfigJson("");
                              }
                              if (doc.otherInfo?.businessLanding != null) {
                                setBusinessLandingJson(
                                  JSON.stringify(doc.otherInfo.businessLanding, null, 2)
                                );
                              } else {
                                setBusinessLandingJson("");
                              }
                            }
                          }
                        }}
                      >
                        {settingsRows.map((r) => (
                          <MenuItem key={String(r._id)} value={String(r._id)}>
                            {rowLabel(r)}
                          </MenuItem>
                        ))}
                        <MenuItem value={NEW_COUNTRY_VALUE}>
                          + Add country-specific row…
                        </MenuItem>
                      </Select>
                      <FormHelperText>
                        New rows require a unique 2-letter country code. The global
                        default row cannot duplicate an existing country row.
                      </FormHelperText>
                    </FormControl>
                    {selectedRowId === NEW_COUNTRY_VALUE ? (
                      <TextField
                        label="Country code (ISO alpha-2)"
                        placeholder="e.g. FI"
                        value={formik.values.marketCountryCode}
                        onChange={(e) =>
                          formik.setFieldValue(
                            "marketCountryCode",
                            e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z]/g, "")
                              .slice(0, 2)
                          )
                        }
                        sx={{ maxWidth: 220 }}
                        inputProps={{ maxLength: 2 }}
                        helperText="Must be unique; server rejects duplicates."
                      />
                    ) : formik.values.isPlatformDefault ? (
                      <Typography variant="body2" color="text.secondary">
                        This row is the global default (used when no country header
                        matches).
                      </Typography>
                    ) : (
                      <>
                        <TextField
                          label="Country code (ISO alpha-2)"
                          placeholder="e.g. FI"
                          value={formik.values.marketCountryCode}
                          onChange={(e) =>
                            formik.setFieldValue(
                              "marketCountryCode",
                              e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z]/g, "")
                                .slice(0, 2)
                            )
                          }
                          sx={{ maxWidth: 220, mb: 1 }}
                          inputProps={{ maxLength: 2 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          This row is used when{" "}
                          <code>x-country-code</code> matches this code. Changing
                          the code updates which requests use this row; the server
                          rejects a code already used by another row.
                        </Typography>
                      </>
                    )}
                  </>
                )}
              </FormSection>
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
                  title="Business landing (B2B)"
                  containerCSS={`margin-top: 20px;`}
                >
                  <Typography variant="body2" sx={{ mb: 2, maxWidth: 900 }}>
                    JSON for <code>otherInfo.businessLanding</code>. Published without auth
                    at <code>GET …/front/business-landing</code> for the marketing site. Do
                    not put this inside <code>publicSiteConfig</code> — the server strips
                    unknown keys there.
                  </Typography>

                  {businessLandingOverviewFieldsDisabled ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Fix invalid JSON in the full document below before using the overview
                      fields. Parser message:{" "}
                      <strong>{businessLandingOverviewParse.error}</strong>
                    </Alert>
                  ) : null}

                  <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5, fontWeight: 600 }}>
                    Overview template (hero + SEO)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, maxWidth: 900 }}>
                    These map to the B2B site <code>#hero</code> block and to{" "}
                    <code>businessLanding.seo</code> for document title and meta description.
                    Other keys in the JSON (features, FAQ, etc.) are left unchanged when you
                    edit here.
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 2 }}
                  >
                    Schema version:{" "}
                    <strong>{businessLandingOverviewSlice.version}</strong> — bump only in
                    JSON if you intentionally need a new version number.
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                      <FormLabel className="label" htmlFor="bl-hero-title">
                        Hero headline
                      </FormLabel>
                      <TextField
                        id="bl-hero-title"
                        fullWidth
                        size="small"
                        margin="dense"
                        value={businessLandingOverviewSlice.title}
                        onChange={handleBusinessLandingOverviewChange("title")}
                        inputProps={{ maxLength: BL_OVERVIEW_LIMITS.title }}
                        disabled={businessLandingOverviewFieldsDisabled}
                        InputProps={{
                          readOnly: !canEditBusinessLanding(),
                        }}
                        helperText={`hero.title · max ${BL_OVERVIEW_LIMITS.title} chars`}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormLabel className="label" htmlFor="bl-hero-primaryCta">
                        Primary button label
                      </FormLabel>
                      <TextField
                        id="bl-hero-primaryCta"
                        fullWidth
                        size="small"
                        margin="dense"
                        value={businessLandingOverviewSlice.primaryCta}
                        onChange={handleBusinessLandingOverviewChange("primaryCta")}
                        inputProps={{ maxLength: BL_OVERVIEW_LIMITS.primaryCta }}
                        disabled={businessLandingOverviewFieldsDisabled}
                        InputProps={{
                          readOnly: !canEditBusinessLanding(),
                        }}
                        helperText="hero.primaryCta"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormLabel className="label" htmlFor="bl-hero-primaryCtaUrl">
                        Primary button URL
                      </FormLabel>
                      <TextField
                        id="bl-hero-primaryCtaUrl"
                        fullWidth
                        size="small"
                        margin="dense"
                        value={businessLandingOverviewSlice.primaryCtaUrl}
                        onChange={handleBusinessLandingOverviewChange("primaryCtaUrl")}
                        inputProps={{ maxLength: BL_OVERVIEW_LIMITS.primaryCtaUrl }}
                        disabled={businessLandingOverviewFieldsDisabled}
                        InputProps={{
                          readOnly: !canEditBusinessLanding(),
                        }}
                        placeholder="https://…"
                        helperText="hero.primaryCtaUrl — server accepts https, mailto:, or a path."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormLabel className="label" htmlFor="bl-hero-subtitle">
                        Hero subcopy
                      </FormLabel>
                      <TextField
                        id="bl-hero-subtitle"
                        fullWidth
                        size="small"
                        margin="dense"
                        multiline
                        minRows={3}
                        value={businessLandingOverviewSlice.subtitle}
                        onChange={handleBusinessLandingOverviewChange("subtitle")}
                        inputProps={{ maxLength: BL_OVERVIEW_LIMITS.subtitle }}
                        disabled={businessLandingOverviewFieldsDisabled}
                        InputProps={{
                          readOnly: !canEditBusinessLanding(),
                        }}
                        helperText={`hero.subtitle · max ${BL_OVERVIEW_LIMITS.subtitle} chars`}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormLabel className="label" htmlFor="bl-seo-title">
                        SEO page title
                      </FormLabel>
                      <TextField
                        id="bl-seo-title"
                        fullWidth
                        size="small"
                        margin="dense"
                        value={businessLandingOverviewSlice.seoTitle}
                        onChange={handleBusinessLandingOverviewChange("seoTitle")}
                        inputProps={{ maxLength: BL_OVERVIEW_LIMITS.seoTitle }}
                        disabled={businessLandingOverviewFieldsDisabled}
                        InputProps={{
                          readOnly: !canEditBusinessLanding(),
                        }}
                        helperText="seo.title"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormLabel className="label" htmlFor="bl-seo-desc">
                        SEO meta description
                      </FormLabel>
                      <TextField
                        id="bl-seo-desc"
                        fullWidth
                        size="small"
                        margin="dense"
                        multiline
                        minRows={2}
                        value={businessLandingOverviewSlice.seoDescription}
                        onChange={handleBusinessLandingOverviewChange("seoDescription")}
                        inputProps={{ maxLength: BL_OVERVIEW_LIMITS.seoDescription }}
                        disabled={businessLandingOverviewFieldsDisabled}
                        InputProps={{
                          readOnly: !canEditBusinessLanding(),
                        }}
                        helperText={`seo.description · max ${BL_OVERVIEW_LIMITS.seoDescription} chars`}
                      />
                    </Grid>
                  </Grid>

                  <Typography
                    variant="subtitle1"
                    sx={{ mt: 2, mb: 1, fontWeight: 600 }}
                  >
                    Full document (JSON)
                  </Typography>

                  {!canEditBusinessLanding() ? (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Only <strong>admin</strong> or <strong>superAdmin</strong> can edit
                        this section. Current payload (read-only):
                      </Typography>
                      <TextField
                        label="businessLanding (read-only)"
                        value={businessLandingJson ? businessLandingJson : '(none)'}
                        fullWidth
                        multiline
                        minRows={8}
                        InputProps={{
                          readOnly: true,
                          sx: { fontFamily: "monospace", fontSize: "0.85rem" },
                        }}
                      />
                    </>
                  ) : (
                    <TextField
                      label="businessLanding (JSON)"
                      value={businessLandingJson}
                      onChange={(e) => setBusinessLandingJson(e.target.value)}
                      placeholder='{ "version": 1, "hero": { "title": "…", "primaryCtaUrl": "https://…" } }'
                      fullWidth
                      multiline
                      minRows={12}
                      InputProps={{
                        sx: { fontFamily: "monospace", fontSize: "0.85rem" },
                      }}
                      helperText="Leave empty to remove businessLanding on save. Invalid JSON is rejected by the server."
                    />
                  )}
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
