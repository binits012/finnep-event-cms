"use client";
import {
  Button,
  FormControlLabel,
  FormLabel,
  Grid,
  TextField,
} from "@mui/material";
// import * as React from "react";
// import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import { useFormik } from "formik";
import { DatePicker, StaticDatePicker } from "@mui/x-date-pickers";
import styled from "styled-components";
import FormSection from "@/components/FormSection";
import IOSSwitch from "@/components/IOSSwtich";
import { useEffect, useState } from "react";
import DropZone from "@/components/DropZone";
import { toast } from "react-toastify";
import { addEvent, updateEvent, updateEvents } from "@/RESTAPIs/events";
import { useParams, useRouter } from "next/navigation";
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
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginImageEdit from "filepond-plugin-image-edit";
import FilePondPluginImageTransform from "filepond-plugin-image-transform";
function convertTime(minutes) {
  // Create a moment duration from minutes
  const duration = moment.duration(minutes, "minutes");

  // Format the duration as H:mm
  const formattedTime = moment.utc(duration.asMilliseconds()).format("H:mm");

  return formattedTime;
}
const AddEvent = ({ editMode }) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const handleSubmit = async (values) => {
    setLoading(true);
    if (id) {
      try {
        // const res = await apiHandler("PUT", `event/${id}`, true, values);.
        const res = await updateEvent(id, {
          ...values,
          eventDate: dayjs(values.eventDate).toISOString(),
          socialMedia: {
            fb: values.fbLink,
            x: values.xLink,
          },
          // eventPrice: {
          //   $numberDecimal: values.eventPrice,
          // },
        });
        console.log(res, "check res");
        toast.success("Event Updated!!");
        setLoading(false);
      } catch (err) {
        console.log(err);
        toast.error("Error updating event!!");

        setLoading(false);
      }
    } else {
      try {
        const res = await addEvent({
          ...values,
          eventDate: dayjs(values.eventDate).toISOString(),
          socialMedia: {
            fb: values.fbLink,
            x: values.xLink,
          },
          eventName: "test",
          // eventPrice: {
          //   $numberDecimal: values.eventPrice,
          // },
        });
        console.log(res, "check res");
        toast.success("Event Added!!");
        setLoading(false);
      } catch (err) {
        console.log(err);
        toast.error("Error creating event!!");
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
      eventDate: null,
      eventPrice: "",
      occupancy: "",
      lang: "",
      socialMedia: "",
      position: "",
      eventLocationAddress: "",
      eventLocationGeoCode: "",
      eventPromotionPhoto: "",
      eventPhoto: "",
      transportLink: "",
      active: "",
      fbLink: "",
      xLink: "",
      igLink: "",
    },
    onSubmit: (values) => handleSubmit(values),
  });
  const [promotionPhotos, setPromotionPhotos] = useState([]);
  const [eventPhotos, setEventPhotos] = useState([]);

  const { id } = useParams();

  const transformObtainedValuesToForm = (values, tz) => {
    console.log(values);
    return {
      ...values,
      eventDate: dayjs(
        moment.utc(values.eventDate).format("YYYY-MM-DDTHH:mm:sss")
      ),
      // eventTime: convertTime(values.eventTime),
      eventTime: null,
      fbLink: values.socialMedia.fb,
      xLink: values.socialMedia.x,
      eventPrice: values.eventPrice["$numberDecimal"],
      timeZone: tz,
      //  fbLink: values.socialMedia.fb,
    };
  };
  useEffect(() => {
    if (editMode) {
      const fetchEventById = async () => {
        try {
          const res = await apiHandler("GET", `event/${id}`, true);
          console.log(res, "check res");
          // formik.setValues(res.data.data);
          formik.setValues(
            transformObtainedValuesToForm(res.data.data, res.data.timeZone)
          );
        } catch (err) {
          console.log(err);
          toast.error("Error getting the event details!");
        }
      };
      fetchEventById();
    }
  }, [editMode]);
  // console.log(
  //   promotionPhotos,
  //   eventPhotos,
  //   formik.values,
  //   // convertTime(formik.values.eventTime),
  //   "testtt"
  // );

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
                ? dayjs(formik.values.eventDate).format("MMMM DD, YYYY hh:mm A")
                : ""
            }${
              formik.values.eventDate &&
              dayjs(formik.values.eventDate).isAfter(dayjs())
                ? `(${dayjs(formik.values.eventDate).diff(
                    dayjs(),
                    "days"
                  )} days to go)`
                : ""
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
                    value={formik.values.eventDate}
                    onChange={(value) => {
                      console.log(value);
                      formik.setFieldValue("eventDate", value);
                    }}
                    onBlur={formik.handleBlur}
                  />
                </Grid>
                {/* <Grid item container md={5} direction={"column"}>
                  <FormLabel htmlFor="eventTitle" className="label">
                    Date
                  </FormLabel>
                  <StaticDatePicker
                    id="eventDate"
                    name="eventDate"
                    value={dayjs(formik.values.eventDate)}
                    onChange={(e) => setFieldValue("eventDate", e.target.value)}
                  />
                </Grid> */}
              </Grid>
            </LocalizationProvider>
          </FormSection>

          <FormSection showSection title="Business">
            <Grid container spacing={2}>
              <Grid item container md={5} direction={"column"}>
                <FormLabel htmlFor="eventPrice" className="label">
                  Ticket Price
                </FormLabel>
                <TextField
                  id="eventPrice"
                  name="eventPrice"
                  value={formik.values.eventPrice}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Ticket Price"
                  fullWidth
                  type="number"
                />
              </Grid>
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
              <Grid item container md={10} direction={"column"}>
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
                {/* <DropZone
                  files={promotionPhotos}
                  setFiles={setPromotionPhotos}
                  multiple={false}
                  maxSize={1024 * 1024 * 2}
                  accept={{
                    "image/*": [],
                  }}
                /> */}
              </Grid>
              {/* <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="eventLocationGeoCode" className="label">
                  After Event Photos
                </FormLabel>
                <DropZone files={eventPhotos} setFiles={setEventPhotos} />
              </Grid> */}
            </Grid>
          </FormSection>
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
