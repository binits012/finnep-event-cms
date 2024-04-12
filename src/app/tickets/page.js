"use client";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import FormSection from "@/components/FormSection";
import TextEditor from "@/components/TextEditor";
import { Grid, Typography, FormLabel, TextField, Button } from "@mui/material";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import Link from "next/link";

import { toast } from "react-toastify";

import styled from "styled-components";

const Tickets = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const getEvents = async () => {
      try {
        const response = await apiHandler("GET", "event", true);
        console.log(response, "check res");
        setEvents(response.data?.data);
      } catch (err) {
        console.log(err);
        toast.error("Error Getting details");
      }
    };
    getEvents();
  }, []);

  return (
    <FormWrapper>
      {" "}
      <CustomBreadcrumbs
        title={`Tickets `}
        links={[
          {
            path: "/tickets",
            title: "Tickets",
            active: true,
          },
        ]}
      />
      <h2> Check tickets for following individual events </h2>
      <div>
        {events.map((event, index) => (
          <div key={event._id} style={{ display: "flex", margin: 5 }}>
            <Link href={`/tickets/${event._id}`}>
              <span>{index + 1}</span>
              <h3>{event.eventTitle}</h3>
            </Link>
          </div>
        ))}
      </div>
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
export default Tickets;
