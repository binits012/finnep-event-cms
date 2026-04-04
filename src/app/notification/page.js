"use client";
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DataGrid } from "@mui/x-data-grid";
import { RxCross1 } from "react-icons/rx";
import { IoIosSearch } from "react-icons/io";
import Modal from "@/components/Modal";
import {
  Button,
  FormControlLabel,
  Switch,
  Grid,
  Input,
} from "@mui/material";
import styled from "styled-components";
import { useFormik } from "formik";
import TextEditor from "@/components/TextEditor";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import Swal from "sweetalert2";

export default function NotificationPage() {
  const [showModal, setShowModal] = useState(false);
  const [filteredRows, setFilteredRows] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationTypes, setNotificationTypes] = useState([]);

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

  useEffect(() => {
    fetchNotifications();
    fetchNotificationTypes();
  }, []);

  const fetchNotificationTypes = async () => {
    try {
      const response = await apiHandler("get", "dashboard", true, false);
      const types = response.data.data.notificationType;
      setNotificationTypes(types);
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Error fetching notification types",
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiHandler("get", "notification", true, false);
      const data = response.data || [];

      const notificationsArray = Array.isArray(data.data) ? data.data : [];
      const formattedRows = notificationsArray.map((notification) => ({
        id: notification._id,
        type: notification.notificationType
          ? notification.notificationType.name
          : "Unknown",
        "start date": new Date(notification.startDate).toISOString(),
        "end date": new Date(notification.endDate).toISOString(),
        notification: notification.notification.replace(/<[^>]+>/g, ""),
      }));

      setFilteredRows(formattedRows);
      setNotifications(notificationsArray);
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Error fetching notifications",
      });
    }
  };

  const mutation = async (values) => {
    const endpoint = editMode
      ? `notification/${selectedCategoryId}`
      : "notification";
    const method = editMode ? "patch" : "post";
    const payload = { ...values, lang: "en" };

    try {
      const response = await apiHandler(method, endpoint, true, false, payload);
      const newData = response.data;

      if (Array.isArray(notifications)) {
        if (editMode) {
          const updatedNotifications = notifications.map((notification) =>
            notification._id === newData._id ? newData : notification
          );
          setNotifications(updatedNotifications);
        } else {
          setNotifications([...notifications, newData]);
        }
      } else {
        console.error("Notifications is not an array:", notifications);
      }
      Toast.fire({
        icon: "success",
        title: `Notification ${editMode ? "updated" : "created"} successfully!`,
      });

      closeModal();

      fetchNotifications();
    } catch (error) {
      console.error("Error details:", error);
      Toast.fire({
        icon: "error",
        title: "Error saving notification",
      });
    }
  };

  const handleSearch = (event) => {
    const raw = event.target.value;
    setSearch(raw);
    const value = raw.toLowerCase();

    const notificationsArray = Array.isArray(notifications)
      ? notifications
      : notifications?.data || [];

    const filteredData = notificationsArray.filter((notification) => {
      const notificationType = notification.notificationType?.name || "";
      const notificationText = notification.notification || "";

      return (
        notificationType.toLowerCase().includes(value) ||
        notificationText.toLowerCase().includes(value)
      );
    });

    const formattedRows = filteredData.map((notification) => ({
      id: notification._id,
      type: notification.notificationType?.name || "Unknown",
      "start date": new Date(notification.startDate).toISOString(),
      "end date": new Date(notification.endDate).toISOString(),
      notification: (notification.notification || "").replace(/<[^>]+>/g, ""),
    }));

    setFilteredRows(formattedRows);
  };

  const fetchNotificationById = async (id) => {
    try {
      const response = await apiHandler(
        "get",
        `notification/${id}`,
        true,
        false
      );
      return response.data || {};
    } catch (error) {
      throw error;
    }
  };

  const handleEditNotification = async (id) => {
    try {
      const notification = await fetchNotificationById(id);
      setSelectedCategoryId(id);

      if (notification) {
        setSelectedNotification(notification);

        const startDate = new Date(notification.data.startDate)
          .toISOString()
          .slice(0, 16);
        const endDate = new Date(notification.data.endDate)
          .toISOString()
          .slice(0, 16);

        formik.setValues({
          notificationType: notification.data.notificationType?._id || "",
          notification: notification.data.notification,
          startDate: startDate,
          endDate: endDate,
          publish: notification.data.publish,
        });
        setEditMode(true);
        setShowModal(true);
      }
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Error editing notification",
      });
    }
  };

  const columns = [
    {
      field: "type",
      headerName: "Type",
      width: 130,
      align: "left",
      headerClassName: "column-header",
      cellClassName: "column-cell",
    },
    {
      field: "start date",
      headerName: "Start Date",
      width: 170,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      valueFormatter: (params) => {
        const v = params?.value;
        if (!v) return "";
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
      },
    },
    {
      field: "end date",
      headerName: "End Date",
      width: 170,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      valueFormatter: (params) => {
        const v = params?.value;
        if (!v) return "";
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
      },
    },
    {
      field: "notification",
      headerName: "Notification",
      flex: 1,
      minWidth: 220,
      headerClassName: "column-header",
      cellClassName: "column-cell",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleEditNotification(params.id)}
        >
          Edit
        </Button>
      ),
    },
  ];

  const handleSubmit = (values) => {
    mutation({
      ...values,
    });
  };

  const formik = useFormik({
    initialValues: {
      notificationType: "",
      notification: "",
      startDate: "",
      endDate: "",
      publish: false,
    },
    onSubmit: handleSubmit,
  });

  const closeModal = () => {
    formik.resetForm();
    setShowModal(false);
    setEditMode(false);
    setSelectedNotification(null);
  };

  const openCreateModal = () => {
    formik.resetForm();
    setEditMode(false);
    setSelectedNotification(null);
    setShowModal(true);
  };

  return (
    <FormWrapper>
      <CustomBreadcrumbs
        title="Notifications"
        links={[
          {
            path: "/notification",
            title: "Notifications",
            active: true,
          },
        ]}
      />
      <h2>Site notifications</h2>

      <FilterSection>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Input
              placeholder="Search by type or text..."
              value={search}
              fullWidth
              sx={{
                "--Input-focusedInset": "var(--any, )",
                "--Input-focusedThickness": "0.50rem",
                "--Input-focusedHighlight": "rgba(13,110,253,.25)",
                "&::before": {
                  transition: "box-shadow .15s ease-in-out",
                },
                "&:focus-within": {
                  borderColor: "#86b7fe",
                },
              }}
              onChange={handleSearch}
              endAdornment={
                search && search !== " " ? (
                  <RxCross1
                    size={25}
                    style={{
                      margin: 8,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSearch("");
                      handleSearch({
                        target: { value: "" },
                      });
                    }}
                  />
                ) : (
                  <IoIosSearch
                    size={30}
                    style={{
                      margin: 8,
                      cursor: "pointer",
                    }}
                  />
                )
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "stretch", md: "flex-end" },
              }}
            >
              <Button
                variant="contained"
                onClick={openCreateModal}
                sx={{ width: { xs: "100%", md: "auto" } }}
              >
                + Add notification
              </Button>
            </Box>
          </Grid>
        </Grid>
      </FilterSection>

      <StyledDataGrid
        rows={filteredRows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        pageSizeOptions={[10, 15, 20]}
        autoHeight
        disableRowSelectionOnClick
        isRowSelectable={() => false}
        sx={{
          width: "100%",
          minHeight: 360,
          "& .MuiDataGrid-main": { overflow: "auto" },
        }}
      />

      <Modal
        isVisible={showModal}
        onClose={closeModal}
        selectedNotification={selectedNotification}
      >
            <Box
              component="form"
              onSubmit={formik.handleSubmit}
              sx={{
                width: "100%",
                maxWidth: 720,
                mx: "auto",
                py: 1,
              }}
            >
              <Stack spacing={2.5}>
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{
                    pb: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box>
                    <Typography variant="h6" component="h1" sx={{ m: 0 }}>
                      {editMode ? "Edit notification" : "New notification"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Shown in English on the public site during the scheduled
                      window.
                    </Typography>
                  </Box>
                  <Box
                    component="button"
                    type="button"
                    onClick={closeModal}
                    sx={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      p: 0.5,
                      lineHeight: 0,
                      color: "text.secondary",
                      "&:hover": { color: "text.primary" },
                    }}
                    aria-label="Close"
                  >
                    <RxCross1 size={22} />
                  </Box>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notification type
                  </Typography>
                  <Box
                    component="select"
                    name="notificationType"
                    value={formik.values.notificationType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    sx={{
                      width: "100%",
                      height: 42,
                      px: 1,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="">Select notification type</option>
                    {notificationTypes.map((type) => (
                      <option key={type._id} value={type._id}>
                        {type.name}
                      </option>
                    ))}
                  </Box>
                </Stack>

                <Box>
                  <TextEditor
                    name="notification"
                    id="notification"
                    label="Notification"
                    placeholder="Enter your notification here..."
                    handleChange={(text) => {
                      formik.setFieldValue("notification", text);
                    }}
                    value={formik.values.notification}
                    error={
                      formik.touched.notification &&
                      formik.errors.notification
                    }
                    required={true}
                    enableRichToolbar
                  />
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ width: "100%" }}
                >
                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Start date
                    </Typography>
                    <Box
                      component="input"
                      type="datetime-local"
                      name="startDate"
                      value={formik.values.startDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      sx={{
                        width: "100%",
                        height: 42,
                        px: 1,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        fontSize: "0.875rem",
                      }}
                    />
                  </Stack>
                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      End date
                    </Typography>
                    <Box
                      component="input"
                      type="datetime-local"
                      name="endDate"
                      value={formik.values.endDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      sx={{
                        width: "100%",
                        height: 42,
                        px: 1,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        fontSize: "0.875rem",
                      }}
                    />
                  </Stack>
                </Stack>

                <FormControlLabel
                  control={
                    <Switch
                      name="publish"
                      checked={Boolean(formik.values.publish)}
                      onChange={(e) =>
                        formik.setFieldValue("publish", e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="Published on website"
                />

                <Stack
                  direction="row"
                  spacing={2}
                  justifyContent="flex-end"
                  sx={{ pt: 1 }}
                >
                  <Button
                    id="cancel"
                    variant="outlined"
                    type="button"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="submit"
                    variant="contained"
                    type="submit"
                  >
                    {editMode ? "Update" : "Create"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
      </Modal>
    </FormWrapper>
  );
}

const FilterSection = styled.div`
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
`;

const StyledDataGrid = styled(DataGrid)`
  .column-header {
    font-size: 16px;
    font-weight: 600;
  }

  .column-cell {
    font-size: 14px;
  }
  .MuiDataGrid-cell:focus,
  .MuiDataGrid-cell:focus-within {
    outline: none !important;
  }
`;

const FormWrapper = styled.div`
  width: 100%;
  padding: 30px;
  h1,
  h2 {
    margin-bottom: 30px;
  }
  .MuiTimeClock-root {
    margin: 0;
  }
  .MuiDialogActions-root {
    justify-content: flex-start;
  }
`;
