"use client";
import {
  Button,
  FormControlLabel,
  FormLabel,
  Grid,
  InputAdornment,
  TextField, Box, Typography, Chip, Select, MenuItem
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import { useFormik } from "formik";
import { DatePicker, StaticDatePicker } from "@mui/x-date-pickers";
import styled from "styled-components";
import FormSection from "@/components/FormSection";
import IOSSwitch from "@/components/IOSSwtich";
import { useEffect, useState } from "react";
import { addEvent, updateEvent, enableDisableEvent } from "@/RESTAPIs/events";
import { useParams } from "next/navigation";
import apiHandler from "@/RESTAPIs/helper";
import moment from "moment";
import dayjs from "dayjs";
import CustomBreadcrumbs from "../CustomBreadcrumbs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Swal from "sweetalert2";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Inline from "yet-another-react-lightbox/plugins/inline";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

registerPlugin(FilePondPluginImagePreview);

const AddEvent = ({ editMode }) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [ticketInfo, setTicketInfo] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [venueInfo, setVenueInfo] = useState(null);

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

  const addTicketRow = () => {
    setTicketInfo([...ticketInfo, { name: "", price: "", quantity: "" }]);
  };

  const handleTicketChange = (index, field, value) => {
    const newTickets = [...ticketInfo];
    newTickets[index][field] = value;
    setTicketInfo(newTickets);
  };



  const handleSubmit = async (values) => {
    setLoading(true);
    if(id){
      console.log("Toggling event active status", formik.values.active);
      console.log("Featured data", formik.values.featured);

      // Validate featured fields before submission (only when isFeatured is true)
      if (formik.values.featured?.isFeatured === true) {
        const featured = formik.values.featured;

        // Check priority (required for all featured types)
        if (!featured.priority || featured.priority < 1 || featured.priority > 100) {
          Toast.fire({
            icon: "error",
            title: "Priority must be between 1-100",
          });
          setLoading(false);
          return;
        }

        // Check dates based on featured type
        if (featured.featuredType === 'temporary') {
          // For temporary: both start and end dates are required
          if (!featured.startDate || featured.startDate === null || featured.startDate === undefined) {
            Toast.fire({
              icon: "error",
              title: "Start date is required for temporary featuring",
            });
            setLoading(false);
            return;
          }

          if (!featured.endDate || featured.endDate === null || featured.endDate === undefined) {
            Toast.fire({
              icon: "error",
              title: "End date is required for temporary featuring",
            });
            setLoading(false);
            return;
          }

          // Check if end date is after start date
          if (dayjs(featured.endDate).isBefore(dayjs(featured.startDate))) {
            Toast.fire({
              icon: "error",
              title: "End date must be after start date",
            });
            setLoading(false);
            return;
          }
        } else if (featured.featuredType === 'sticky') {
          // For sticky: only endDate is required (auto-populated with eventDate)
          if (!featured.endDate || featured.endDate === null || featured.endDate === undefined) {
            Toast.fire({
              icon: "error",
              title: "End date is required for sticky featuring",
            });
            setLoading(false);
            return;
          }

          // For sticky, startDate is optional (can be null/undefined)
          // But if provided, it should be before endDate
          if (featured.startDate && dayjs(featured.endDate).isBefore(dayjs(featured.startDate))) {
            Toast.fire({
              icon: "error",
              title: "End date must be after start date",
            });
            setLoading(false);
            return;
          }
        }
      }

      const payload = {
        active: formik.values.active, // Toggle to opposite of current slider
        featured: formik.values.featured
      };

      const res = await enableDisableEvent(id, payload);

      if(res.status === 200){
        Toast.fire({
          icon: "success",
          title: `Event ${formik.values.active ? "Activated" : "Deactivated"} !!`,
        });
        // Update formik to reflect the new status
        formik.setFieldValue("active", formik.values.active);
      } else {
        Toast.fire({
          icon: "error",
          title: `Error ${formik.values.active ? "Deactivating" : "Activating"} event !!`,
        });
      }
      setLoading(false);
    }
    /*
    if (id) {
      try {

        const res = await updateEvent(id, {
          ...values,
          eventDate: dayjs(values.eventDate),
          ticketInfo,
          socialMedia: {
            fb: values.fbLink,
            x: values.xLink,
            insta: values.igLink,
          },
          otherInfo:{
            emailTemplate:values?.emailTemplate,
            categoryName: values?.categoryName,
            subCategoryName: values?.subCategoryName,
            eventExtraInfo: {
              eventType: values?.eventType,
              doorSaleAllowed: values?.doorSaleAllowed,
              doorSaleExtraAmount: values?.doorSaleExtraAmount
            }
          }
        });

        Toast.fire({
          icon: "success",
          title: "Event Updated !!",
        });

        setLoading(false);
      } catch (err) {
        Toast.fire({
          icon: "error",
          title: "Error updating event !!",
        });

        setLoading(false);
      }
    } else {
      try {
        const res = await addEvent({
          ...values,
          eventDate: dayjs(values.eventDate),
          ticketInfo,
          socialMedia: {
            fb: values.fbLink,
            x: values.xLink,
          },
          otherInfo:{
            emailTemplate:values?.emailTemplate,
            categoryName: values?.categoryName,
            subCategoryName: values?.subCategoryName,
            eventExtraInfo: {
              eventType: values?.eventType,
              doorSaleAllowed: values?.doorSaleAllowed,
              doorSaleExtraAmount: values?.doorSaleExtraAmount
            }
          }
        });

        Toast.fire({
          icon: "success",
          title: "Event Added !!",
        });

        setLoading(false);
      } catch (err) {
        Toast.fire({
          icon: "error",
          title: "Error creating event !!",
        });

        setLoading(false);
      }
    }
    */
  };
  const formik = useFormik({
    initialValues: {
      eventTitle: "",
      eventName: "",
      eventDescription: "",
      eventTime: "4:44",
      eventDate: dayjs().toISOString(),
      eventPrice: "",
      occupancy: "",
      lang: "",
      socialMedia: {},
      position: "",
      eventLocationAddress: "",
      eventLocationGeoCode: "",
      eventPromotionPhoto: "",
      eventPhoto: [],
      transportLink: "",
      active: false,
      fbLink: "",
      xLink: "",
      igLink: "",
      emailTemplate: "",
      categoryName: "",
      subCategoryName: "",
      eventType: "",
      doorSaleAllowed: false,
      doorSaleExtraAmount: "",
      featured: {
        isFeatured: false,
        featuredType: "temporary",
        priority: 0,
        startDate: null,
        endDate: null
      }
    },
    onSubmit: (values) => handleSubmit(values),
  });
  const [index, setIndex] = useState(0);
  const { id } = useParams();

  const transformObtainedValuesToForm = (values, tz) => {
    return {
      ...values,
      eventDate: values.eventDate
        ? dayjs(values.eventDate).tz(tz).toISOString() // Ensure eventDate is properly handled with timezone
        : null,
      eventTime: null, // Convert or set as required later
      fbLink: values.socialMedia?.fb || values.socialMedia?.facebook || "", // Fallback to empty string if missing
      xLink: values.socialMedia?.x || values.socialMedia?.twitter || "",
      igLink: values.socialMedia?.insta || values.socialMedia?.instagram ||  "",
      tiktok: values.socialMedia?.tiktok || values.socialMedia?.tiktok ||  "",
      eventPrice: values.eventPrice || 0, // Fallback in case eventPrice is undefined
      timeZone: tz, // Preserve passed timezone
      emailTemplate: values?.otherInfo?.emailTemplate,
      categoryName: values?.otherInfo?.categoryName || "",
      subCategoryName: values?.otherInfo?.subCategoryName || "",
      eventType: values?.otherInfo?.eventExtraInfo?.eventType || "",
      doorSaleAllowed: values?.otherInfo?.eventExtraInfo?.doorSaleAllowed || false,
      doorSaleExtraAmount: values?.otherInfo?.eventExtraInfo?.doorSaleExtraAmount || "",
      featured: {
        isFeatured: values.featured?.isFeatured || false,
        featuredType: values.featured?.featuredType || "temporary",
        priority: values.featured?.priority || 0,
        startDate: values.featured?.startDate ? dayjs(values.featured.startDate) : null,
        endDate: values.featured?.endDate ? dayjs(values.featured.endDate) : null
      }
    };
  };

  useEffect(() => {
    if (editMode) {
      const fetchEventById = async () => {
        try {
          const res = await apiHandler("GET", `event/${id}`, true);
          // formik.setValues(res.data.data);
          formik.setValues(
            transformObtainedValuesToForm(res.data.data, res.data.timeZone)
          );
          setTicketInfo(res.data.data.ticketInfo || []);
          // Store pricingConfig from response if available
          setPricingConfig(res.data.pricingConfig || null);
          // Store venue info to check if we should hide ticket info
          setVenueInfo(res.data.data.venue || null);
        } catch (err) {
          Toast.fire({
            icon: "error",
            title: `Error fetching event: ${err.message}`,
          });
        }
      };
      fetchEventById();
    }
  }, [editMode]);

  const uploadFile = async () => {
    if (files.length === 0) {
      Toast.fire({
        icon: "error",
        title: "No files selected",
      });
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await apiHandler(
        "POST",
        `event/${id}/eventPhoto`,
        true,
        true,
        formData,
        {}
      );

      Toast.fire({
        icon: "success",
        title: "Files uploaded successfully!",
      });

      setFiles([]);
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Upload failed. Please try again.",
      });
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const photoevents = formik.values.eventPhoto;

  if (!Array.isArray(photoevents)) {
    console.error("Expected photoevents to be an array but got:", photoevents);
    return;
  }

  const validPhotoevents = photoevents.filter(Boolean);

  const slides = validPhotoevents.map((url) => ({
    src: url,
  }));

  return (
    <FormWrapper>
      <CustomBreadcrumbs
        title={`${editMode ? "Edit" : "Add New"} Event: ${
          formik.values.eventTitle
        }`}
        links={[
          {
            path: "/events",
            title: "Events",
          },
          {
            path: "/events/add",
            title: editMode ? "View Event" : "Add Event",
            active: true,
          },
        ]}
      />
      <form>
        <Grid container direction="column" spacing={0}>
          <FormSection title="Introduce">
            <Grid container spacing={2}>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="eventTitle" className="label">
                  Event Title
                </FormLabel>
                <TextField
                  id="eventTitle"
                  name="eventTitle"
                  value={formik.values.eventTitle}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Event Title"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>{" "}
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="eventName" className="label">
                  Event Name
                </FormLabel>
                <TextField
                  id="eventName"
                  name="eventName"
                  value={formik.values.eventName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Event Name"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="eventTitle" className="label">
                  Describe it.
                </FormLabel>
                <TextField
                  id="eventDescription"
                  name="eventDescription"
                  value={formik.values.eventDescription}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Event Description"
                  multiline
                  // rows={3}
                  minRows={3}
                  maxRows={5}
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection
            title={`When? ${
              formik.values.eventDate
                ? dayjs(formik.values.eventDate).format("ddd, DD MMM YYYY HH:mm")
                : null
            }`}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2}>
                <Grid item container md={5} direction={"column"}>
                  <FormLabel htmlFor="eventTitle" className="label">
                    Event Date/ Time
                  </FormLabel>
                  <DateTimePicker
                    disablePast
                    sx={{
                      margin: 0,
                    }}
                    id="eventDate"
                    name="eventDate"
                    value={
                      formik.values.eventDate
                        ? dayjs(formik.values.eventDate)
                        : null
                    }
                    onChange={(value) => {
                      // Convert selected date to local time before saving to Formik
                      formik.setFieldValue(
                        "eventDate",
                        value ? dayjs(value): null
                      );
                    }}
                    onBlur={formik.handleBlur}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </FormSection>

          <FormSection title="Tickets">
           {/*
            <Button
              variant="contained"
              color="primary"
              onClick={addTicketRow}
              style={{ marginBottom: "20px" }}
            >
              + Add Ticket
            </Button>
            */}
            {/* Display Pricing Configuration if available */}
            {pricingConfig && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  border: '2px solid #2196F3',
                  borderRadius: '8px',
                  backgroundColor: '#e3f2fd'
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#0d47a1' }}>
                  Pricing Configuration
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4} md={3}>
                    <Typography variant="caption" color="textSecondary">Currency</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {pricingConfig.currency || 'EUR'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <Typography variant="caption" color="textSecondary">Order Fee</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {pricingConfig.orderFee || 0} {pricingConfig.currency || 'EUR'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <Typography variant="caption" color="textSecondary">Order Tax</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {pricingConfig.orderTax || 0}%
                    </Typography>
                  </Grid>
                </Grid>

                {pricingConfig.tiers && pricingConfig.tiers.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#1976d2' }}>
                      Pricing Tiers
                    </Typography>
                    {pricingConfig.tiers.map((tier, index) => (
                      <Box
                        key={tier._id || index}
                        sx={{
                          mb: 2,
                          p: 2,
                          border: '1px solid #90caf9',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Tier {tier.id || index}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="textSecondary">Base Price</Typography>
                            <Typography variant="body2">{tier.basePrice} {pricingConfig.currency || 'EUR'}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="textSecondary">Tax (VAT)</Typography>
                            <Typography variant="body2">{tier.tax || 0}%</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="textSecondary">Service Fee</Typography>
                            <Typography variant="body2">{tier.serviceFee || 0} {pricingConfig.currency || 'EUR'}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="textSecondary">Service Tax</Typography>
                            <Typography variant="body2">{tier.serviceTax || 0}%</Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Only show regular ticket info if NOT using pricing_configuration model */}
            {!(venueInfo?.venueId && venueInfo?.pricingModel === 'pricing_configuration') &&
              ticketInfo.map((ticket, index) => (
              <Box
              key={index}
              sx={{
                mb: 3,
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                {ticket.name}
              </Typography>

              <Grid container spacing={2}>
                {/* First row */}
                <Grid item xs={12} sm={4} md={3}>
                  <Typography variant="caption" color="textSecondary">Price</Typography>
                  <Typography variant="body1">{ticket.price} €</Typography>
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                  <Typography variant="caption" color="textSecondary">Quantity</Typography>
                  <Typography variant="body1">{ticket.quantity}</Typography>
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                  <Typography variant="caption" color="textSecondary">Service Fee</Typography>
                  <Typography variant="body1">{ticket.serviceFee} €</Typography>
                </Grid>

                {/* Second row */}
                <Grid item xs={12} sm={4} md={3}>
                  <Typography variant="caption" color="textSecondary">VAT</Typography>
                  <Typography variant="body1">{ticket.vat}%</Typography>
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                  <Typography variant="caption" color="textSecondary">Available</Typography>
                  <Typography variant="body1">{ticket.available}</Typography>
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                  <Typography variant="caption" color="textSecondary">Status</Typography>
                  <Chip
                    label={ticket.status || 'N/A'}
                    size="small"
                    sx={{
                      backgroundColor: ticket.status === 'available' ? '#e3f2fd' :
                                      ticket.status === 'sold out' ? '#ffebee' :
                                      '#f5f5f5',
                      color: ticket.status === 'available' ? '#0d47a1' :
                            ticket.status === 'sold out' ? '#b71c1c' :
                            '#616161',
                      fontWeight: 'medium'
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
            ))}
          </FormSection>

          <FormSection title="Business">
            <Grid container spacing={2}>
              <Grid item container md={5} direction={"column"}>
                <FormLabel htmlFor="occupancy" className="label">
                  Occupancy
                </FormLabel>
                <TextField
                  id="occupancy"
                  name="occupancy"
                  value={formik.values.occupancy}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Occupancy"
                  fullWidth
                  type="number"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            </Grid>
          </FormSection>
          <FormSection title="Where?">
            <Grid container spacing={2}>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="eventLocationAddress" className="label">
                  Address Details
                </FormLabel>
                <TextField
                  id="eventLocationAddress"
                  name="eventLocationAddress"
                  value={formik.values.eventLocationAddress}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Address Details"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="eventLocationGeoCode" className="label">
                  Geo Code
                </FormLabel>
                <TextField
                  id="eventLocationGeoCode"
                  name="eventLocationGeoCode"
                  value={formik.values.eventLocationGeoCode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Geo Code"
                  fullWidth
                  // type="number"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            </Grid>
          </FormSection>
          <FormSection title="Photos">
            <Grid container spacing={2}>
              <Grid item container md={10}>
                <FormLabel htmlFor="eventPromotionPhoto" className="label">
                  Promotion Photo
                </FormLabel>
                <TextField
                  id="eventPromotionPhoto"
                  name="eventPromotionPhoto"
                  value={formik.values.eventPromotionPhoto}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Promotion Photo"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
                {formik.values.eventPromotionPhoto && (
                  <img
                    src={formik.values.eventPromotionPhoto}
                    alt="Event"
                    width="350px"
                    style={{ margin: "20px auto" }}
                  />
                )}
              </Grid>
            </Grid>
          </FormSection>
          {editMode && (
            <FormSection title="Event Photos">
              <FormLabel htmlFor="eventPhotos" className="label">
                Event Photos
              </FormLabel>
              <Grid sx={{ margin: "0 auto", width: "500px" }}>
                <FilePond
                  files={files}
                  onupdatefiles={(fileItems) => {
                    setFiles(fileItems.map((fileItem) => fileItem.file));
                  }}
                  allowMultiple={true}
                  name="file"
                  labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
                />
                {/*
                <Button
                  variant="contained"
                  color="primary"
                  onClick={uploadFile}
                  disabled={uploading}
                  style={{ marginTop: "20px", width: "100%" }}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
                */}
                {uploadError && <p style={{ color: "red" }}>{uploadError}</p>}

                {validPhotoevents.length > 0 && (
                  <div
                    style={{
                      width: "500px",
                      height: "400px",
                      marginTop: "20px",
                    }}
                  >
                    <Lightbox
                      open={true}
                      slides={slides}
                      index={index}
                      carousel={{
                        preload: 1,
                        padding: 0,
                        imageFit: "contain",
                      }}
                      plugins={[Inline]}
                      inline={{
                        style: {
                          width: "100%",
                          height: "100%",
                        },
                      }}
                    />
                  </div>
                )}
              </Grid>
            </FormSection>
          )}
          <FormSection title="Social Media">
            <Grid container spacing={2}>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="fbLink" className="label">
                  Facebook Link
                </FormLabel>
                <TextField
                  id="fbLink"
                  name="fbLink"
                  value={formik.values.fbLink }
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Facebook Link"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="igLink" className="label">
                  Instagram Link
                </FormLabel>
                <TextField
                  id="igLink"
                  name="igLink"
                  value={formik.values.igLink}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Instagram Link"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="xLink" className="label">
                  X{"("}Twitter {")"} Link
                </FormLabel>
                <TextField
                  id="xLink"
                  name="xLink"
                  value={formik.values.xLink}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="X (Twitter) Link"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="tikTok" className="label">
                  Tiktok Link
                </FormLabel>
                <TextField
                  id="tikTokLink"
                  name="tikTokLink"
                  value={formik.values.tiktok }
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Tiktok Link"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="Featured">
            <Grid container spacing={2}>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="isFeatured" className="label">
                  Featured Event
                </FormLabel>
                <FormControlLabel
                  control={
                    <IOSSwitch
                      sx={{ m: 1 }}
                      checked={formik.values.featured?.isFeatured || false}
                      id="isFeatured"
                      name="isFeatured"
                    />
                  }
                  htmlFor="isFeatured"
                  label="Is this event featured?"
                  value={formik.values.featured?.isFeatured || false}
                  onChange={(e) => {
                    const newFeaturedStatus = !formik.values.featured?.isFeatured;
                    formik.setFieldValue("featured.isFeatured", newFeaturedStatus);

                    // Auto-populate startDate when enabling featured for temporary type
                    if (newFeaturedStatus && formik.values.featured?.featuredType === 'temporary') {
                      formik.setFieldValue("featured.startDate", dayjs());
                    }
                  }}
                />
              </Grid>

              {formik.values.featured?.isFeatured && (
                <>
                  <Grid item container md={10} direction={"column"}>
                    <FormLabel htmlFor="featuredType" className="label">
                      Featured Type
                    </FormLabel>
                    <Select
                      id="featuredType"
                      name="featuredType"
                      value={formik.values.featured?.featuredType || 'temporary'}
                      onChange={(e) => {
                        const newType = e.target.value;
                        formik.setFieldValue("featured.featuredType", newType);

                        // Auto-populate endDate with eventDate for sticky
                        if (newType === 'sticky' && formik.values.eventDate) {
                          formik.setFieldValue("featured.endDate", dayjs(formik.values.eventDate));
                        }

                        // Auto-populate startDate with current date/time for temporary
                        if (newType === 'temporary') {
                          formik.setFieldValue("featured.startDate", dayjs());
                        }
                      }}
                      fullWidth
                    >
                      <MenuItem value="sticky">Sticky (Always at top)</MenuItem>
                      <MenuItem value="temporary">Temporary (Time-based)</MenuItem>
                    </Select>
                  </Grid>

                  <Grid item container md={10} direction={"column"}>
                    <FormLabel htmlFor="priority" className="label">
                      Priority (0-100)
                    </FormLabel>
                    <TextField
                      id="priority"
                      name="priority"
                      value={formik.values.featured?.priority || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          formik.setFieldValue("featured.priority", '');
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            formik.setFieldValue("featured.priority", numValue);
                          }
                        }
                      }}
                      onBlur={formik.handleBlur}
                      placeholder="Priority (1-100)"
                      fullWidth
                      type="number"
                      inputProps={{ min: 0, max: 100 }}
                      required={formik.values.featured?.isFeatured === true}
                      error={formik.values.featured?.isFeatured === true && (formik.values.featured?.priority === '' || formik.values.featured?.priority === undefined || formik.values.featured.priority < 1 || formik.values.featured.priority > 100)}
                      helperText={formik.values.featured?.isFeatured === true && (formik.values.featured?.priority === '' || formik.values.featured?.priority === undefined || formik.values.featured.priority < 1 || formik.values.featured.priority > 100) ? "Priority is required (1-100)" : ""}
                    />
                  </Grid>

                  {formik.values.featured?.featuredType === 'temporary' && (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Grid item container md={5} direction={"column"}>
                        <FormLabel htmlFor="startDate" className="label">
                          Start Date
                        </FormLabel>
                        <DateTimePicker
                          disablePast
                          sx={{ margin: 0 }}
                          id="startDate"
                          name="startDate"
                          value={formik.values.featured?.startDate ? dayjs(formik.values.featured.startDate) : null}
                          onChange={(value) => {
                            formik.setFieldValue("featured.startDate", value ? dayjs(value) : null);
                          }}
                          onBlur={formik.handleBlur}
                          slotProps={{
                            textField: {
                              required: formik.values.featured?.isFeatured === true && formik.values.featured?.featuredType === 'temporary',
                              error: formik.values.featured?.isFeatured === true && formik.values.featured?.featuredType === 'temporary' && (formik.values.featured?.startDate === null || formik.values.featured?.startDate === undefined || formik.values.featured?.startDate === ''),
                              helperText: formik.values.featured?.isFeatured === true && formik.values.featured?.featuredType === 'temporary' && (formik.values.featured?.startDate === null || formik.values.featured?.startDate === undefined || formik.values.featured?.startDate === '') ? "Start date is required" : ""
                            }
                          }}
                        />
                      </Grid>

                      <Grid item container md={5} direction={"column"}>
                        <FormLabel htmlFor="endDate" className="label">
                          End Date
                        </FormLabel>
                        <DateTimePicker
                          disablePast
                          minDateTime={formik.values.featured?.startDate ? dayjs(formik.values.featured.startDate) : dayjs()}
                          sx={{ margin: 0 }}
                          id="endDate"
                          name="endDate"
                          value={formik.values.featured?.endDate ? dayjs(formik.values.featured.endDate) : null}
                          onChange={(value) => {
                            formik.setFieldValue("featured.endDate", value ? dayjs(value) : null);
                          }}
                          onBlur={formik.handleBlur}
                          slotProps={{
                            textField: {
                              required: formik.values.featured?.isFeatured === true && formik.values.featured?.featuredType === 'temporary',
                              error: formik.values.featured?.isFeatured === true && formik.values.featured?.featuredType === 'temporary' && (formik.values.featured?.endDate === null || formik.values.featured?.endDate === undefined || formik.values.featured?.endDate === ''),
                              helperText: formik.values.featured?.isFeatured === true && formik.values.featured?.featuredType === 'temporary' && (formik.values.featured?.endDate === null || formik.values.featured?.endDate === undefined || formik.values.featured?.endDate === '') ? "End date is required" : ""
                            }
                          }}
                        />
                      </Grid>
                    </LocalizationProvider>
                  )}
                </>
              )}
            </Grid>
          </FormSection>

          <FormSection title="Others">
            <Grid container spacing={2}>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="active" className="label">
                  Active?
                </FormLabel>
                <FormControlLabel
                  control={
                    <IOSSwitch
                      sx={{ m: 1 }}
                      checked={formik.values.active}
                      id="active"
                      name="active"
                    />
                  }
                  htmlFor="active"
                  label="Is this event acitve, happening?"
                  value={formik.values.active}
                  onChange={(e) =>
                    formik.setFieldValue("active", !formik.values.active)
                  }
                />
              </Grid>
            </Grid>
            <Grid item container md={10} direction={"column"} mt={3}>
              <FormLabel htmlFor="transportLink" className="label">
                Transport Link
              </FormLabel>
              <TextField
                id="transportLink"
                name="transportLink"
                value={formik.values.transportLink}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Transport Link"
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item container md={10} direction={"column"} mt={3}>
              <FormLabel htmlFor="position" className="label">
                Order Of Event
              </FormLabel>
              <TextField
                id="position"
                name="position"
                value={formik.values.position}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Order of event"
                fullWidth
                type="number"
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            {/*
            <Grid item container md={10} direction={"column"} mt={3}>
              <FormLabel htmlFor="EmailTemplate" className="label">
                Email Template
              </FormLabel>
              <TextField
                id="emailTemplate"
                name="emailTemplate"
                label="Email HTML"
                value={formik.values.emailTemplate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                multiline
                rows={30} // Number of visible rows
                variant="outlined" // Can be "filled" or "standard"
                fullWidth // Makes it take the full width of its container
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            */}

            {/* Category Information */}
            <Grid item container md={10} direction={"column"} mt={3}>
              <FormLabel htmlFor="categoryName" className="label">
                Category Name
              </FormLabel>
              <TextField
                id="categoryName"
                name="categoryName"
                value={formik.values.categoryName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Category Name"
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item container md={10} direction={"column"} mt={3}>
              <FormLabel htmlFor="subCategoryName" className="label">
                Sub Category Name
              </FormLabel>
              <TextField
                id="subCategoryName"
                name="subCategoryName"
                value={formik.values.subCategoryName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Sub Category Name"
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            {/* Event Extra Information */}
            <Grid item container md={10} direction={"column"} mt={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Event Extra Information
              </Typography>
            </Grid>

            <Grid item container md={10} direction={"column"} mt={2}>
              <FormLabel htmlFor="eventType" className="label">
                Event Type
              </FormLabel>
              <TextField
                id="eventType"
                name="eventType"
                value={formik.values.eventType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Event Type (e.g., paid, free)"
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item container md={10} direction={"column"} mt={3}>
              <FormLabel htmlFor="doorSaleAllowed" className="label">
                Door Sale Allowed?
              </FormLabel>
              <TextField
                id="doorSaleAllowed"
                name="doorSaleAllowed"
                value={formik.values.doorSaleAllowed ? "Yes" : "No"}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Door Sale Allowed"
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item container md={10} direction={"column"} mt={3}>
              <FormLabel htmlFor="doorSaleExtraAmount" className="label">
                Door Sale Extra Amount
              </FormLabel>
              <TextField
                id="doorSaleExtraAmount"
                name="doorSaleExtraAmount"
                value={formik.values.doorSaleExtraAmount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Extra amount for door sales"
                fullWidth
                type="number"
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
          </FormSection>
        </Grid>

        <Grid container justifyContent="flex-end">
          {
          <Button
            id="submit"
            onClick={formik.handleSubmit}
            variant="contained"
            color={formik.values.active ? "success" : "error"}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Processing..." : (formik.values.active ? "Activate" : "Deactivate")}
          </Button>
          }
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

export default AddEvent;
