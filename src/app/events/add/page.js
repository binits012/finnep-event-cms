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
import { StaticDatePicker } from "@mui/x-date-pickers";
import styled from "styled-components";
import FormSection from "@/components/FormSection";
import IOSSwitch from "@/components/IOSSwtich";
import { useState } from "react";
import DropZone from "@/components/DropZone";

const AddEvent = () => {
  const formik = useFormik({
    initialValues: {
      eventTitle: "",
      eventDescription: "",
      eventTime: null,
      eventDate: "",
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
    },
    onSubmit: (values) => console.log(values),
  });
  const [promotionPhotos, setPromotionPhotos] = useState([]);
  const [eventPhotos, setEventPhotos] = useState([]);

  console.log(promotionPhotos, eventPhotos, "testtt");
  return (
    <FormWrapper>
      <h1>Add New Event: {formik.values.eventTitle}</h1>
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

          <FormSection title="When?">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2}>
                <Grid item container md={5} direction={"column"}>
                  <FormLabel htmlFor="eventTitle" className="label">
                    Event Time
                  </FormLabel>
                  <StaticTimePicker
                    sx={{
                      margin: 0,
                    }}
                    id="eventTime"
                    name="eventTime"
                    value={formik.values.eventTime}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    //  value={formik.values.eventTime}
                  />
                </Grid>
                <Grid item container md={5} direction={"column"}>
                  <FormLabel htmlFor="eventTitle" className="label">
                    Date
                  </FormLabel>
                  <StaticDatePicker />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </FormSection>

          <FormSection title="Business">
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
          <FormSection title="Photos">
            <Grid container spacing={2}>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="eventLocationAddress" className="label">
                  Promotion Photo
                </FormLabel>
                <DropZone
                  files={promotionPhotos}
                  setFiles={setPromotionPhotos}
                  multiple={false}
                  maxSize={1024 * 1024 * 2}
                  accept={{
                    "image/*": [],
                  }}
                />
              </Grid>
              <Grid item container md={10} direction={"column"}>
                <FormLabel htmlFor="eventLocationGeoCode" className="label">
                  After Event Photos
                </FormLabel>
                <DropZone files={eventPhotos} setFiles={setEventPhotos} />
              </Grid>
            </Grid>
          </FormSection>
          <FormSection title="Social Media">
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
                      checked={!+formik.values.hidden}
                      id="active"
                      name="active"
                    />
                  }
                  htmlFor="active"
                  label=""
                  value={formik.values.active}
                  onChange={(e) =>
                    formik.setFieldValue("active", !+formik.values.active)
                  }
                />
              </Grid>
            </Grid>
          </FormSection>
        </Grid>
        <Grid container>
          <Button id="submit" onClick={formik.handleSubmit} variant="contained">
            Add Event
          </Button>
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
