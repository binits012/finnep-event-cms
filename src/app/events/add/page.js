"use client";
import styled from "styled-components";
import { useState } from "react";
import AdapterDayjs from "@mui/x-date-pickers/AdapterDayjs";
import LocalizationProvider from "@mui/x-date-pickers/LocalizationProvider";
import DatePicker from "@mui/x-date-pickers/DatePicker";
import { TextField, Button } from "@mui/material";

const Wrapper = styled.div`
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 10px;
    justify-content: flex-start;
    width: 100%;
  }
  .form input,
  .form textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin: 5px 0px;
  }
  Button {
    margin: 5px 0px;
    width: 30px;
    height: 40px;
  }
`;

const AddEvents = () => {
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <Wrapper>
      <form className="form">
        <label>
          Title
          <input
            className="title"
            type="text"
            placeholder="Title"
            name="title"
            label="Title"
            required
          />
        </label>
        <label>
          Event
          <input type="text" placeholder="Event" name="event" required />
        </label>
        <label>
          {" "}
          Select Date
          <input type="date" placeholder="Date" name="date" required />
        </label>
        {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={handleDateChange}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider> */}
        <label>
          Location
          <textarea name="address" rows="2" placeholder="Location" />
        </label>
        <Button type="submit" variant="outlined" color="primary">
          Submit
        </Button>
      </form>
    </Wrapper>
  );
};

export default AddEvents;
