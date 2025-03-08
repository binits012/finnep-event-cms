"use client";
import {
  Button,
  FormControlLabel,
  FormLabel,
  Grid,
  InputAdornment,
  TextField
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
import { addEvent, updateEvent } from "@/RESTAPIs/events";
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
            emailTemplate:values?.emailTemplate
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
            emailTemplate:values?.emailTemplate
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
      emailTemplate:""
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
      fbLink: values.socialMedia?.fb || "", // Fallback to empty string if missing
      xLink: values.socialMedia?.x || "",
      igLink: values.socialMedia?.insta || "",
      eventPrice: values.eventPrice || 0, // Fallback in case eventPrice is undefined
      timeZone: tz, // Preserve passed timezone
      emailTemplate: values?.otherInfo?.emailTemplate
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
            title: editMode ? "Edit Event" : "Add Event",
            active: true,
          },
        ]}
      />
      <form>
        <Grid container direction="column" spacing={0}>
          <FormSection showSection title="Introduce">
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
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection
            showSection
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

          <FormSection showSection title="Tickets">
            <Button
              variant="contained"
              color="primary"
              onClick={addTicketRow}
              style={{ marginBottom: "20px" }}
            >
              + Add Ticket
            </Button>
            {ticketInfo.map((ticket, index) => (
              <Grid container spacing={2} key={index}>
                <Grid item container md={3}>
                  <TextField
                    placeholder="Name"
                    value={ticket.name}
                    onChange={(e) =>
                      handleTicketChange(index, "name", e.target.value)
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item container md={3}>
                  <TextField
                    placeholder="Price"
                    value={ticket.price}
                    onChange={(e) =>
                      handleTicketChange(index, "price", e.target.value)
                    }
                    fullWidth
                    type="number"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment
                          position="end"
                          sx={{ marginLeft: "-190px" }}
                        >
                          €
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item container md={3}>
                  <TextField
                    placeholder="Quantity"
                    value={ticket.quantity}
                    onChange={(e) =>
                      handleTicketChange(index, "quantity", e.target.value)
                    }
                    fullWidth
                    type="number"
                  />
                </Grid>
              </Grid>
            ))}
          </FormSection>

          <FormSection showSection title="Business">
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
                />
              </Grid>
            </Grid>
          </FormSection>
          <FormSection showSection title="Where?">
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
                />
              </Grid>
            </Grid>
          </FormSection>
          <FormSection showSection title="Photos">
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
            <FormSection showSection title="Event Photos">
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
                <Button
                  variant="contained"
                  color="primary"
                  onClick={uploadFile}
                  disabled={uploading}
                  style={{ marginTop: "20px", width: "100%" }}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
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
          <FormSection showSection title="Social Media">
            <Grid container spacing={2}>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="fbLink" className="label">
                  Facebook Link
                </FormLabel>
                <TextField
                  id="fbLink"
                  name="fbLink"
                  value={formik.values.fbLink}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Facebook Link"
                  fullWidth
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
                />
              </Grid>
            </Grid>
          </FormSection>
          <FormSection showSection title="Others">
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
              />
            </Grid>
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
              />
            </Grid>
          </FormSection>
        </Grid>

        <Grid container justifyContent="flex-end">
          <Button id="submit" onClick={formik.handleSubmit} variant="contained">
            {editMode ? "Update " : " Add"} Event
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

export default AddEvent;
