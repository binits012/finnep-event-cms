"use client";
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import { FaPlus } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";
import Modal from "@/components/Modal";
import { Button, Grid, MenuItem, Select } from "@mui/material";
import { useFormik } from "formik";
import TextEditor from "@/components/TextEditor";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import toast from "react-hot-toast";

export default function NotificationPage() {
  const [showModal, setShowModal] = useState(false);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await apiHandler("get", "notification", true, false);
      const data = response.data || [];
      const formattedRows = data.data.map((notification) => ({
        id: notification._id,
        type: notification.notificationType.name,
        "start date": new Date(notification.startDate).toLocaleDateString(),
        "end date": new Date(notification.endDate).toLocaleDateString(),
        notification: notification.notification.replace(/<[^>]+>/g, ""),
      }));
      setFilteredRows(formattedRows);
      setNotifications(data);
    } catch (error) {
      toast.error("Error fetching notifications");
    }
  };

  const mutation = async (values) => {
    const endpoint = editMode
      ? `notification/${selectedCategoryId}`
      : "notification";
    const method = editMode ? "patch" : "post";

    try {
      const response = await apiHandler(method, endpoint, true, false, values);
      const newData = response.data;

      if (editMode) {
        const updatedNotifications = notifications.map((notification) =>
          notification._id === newData._id ? newData : notification
        );
        setNotifications(updatedNotifications);
      } else {
        setNotifications([...notifications, newData]);
      }
      toast.success(
        `Notification ${editMode ? "updated" : "created"} successfully!`
      );
    } catch (error) {
      toast.error("Error saving notification");
      setShowModal(false);
      setEditMode(false);
      setSelectedNotification(null);
    }
  };

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchText(value);

    const notificationsArray = Array.isArray(notifications)
      ? notifications
      : notifications?.data || [];

    const filteredData = notificationsArray.filter((notification) => {
      const notificationType = notification.notificationType || "";
      const notificationText = notification.notification || "";

      return (
        notificationType.toLowerCase().includes(value) ||
        notificationText.toLowerCase().includes(value)
      );
    });

    const formattedRows = filteredData.map((notification) => ({
      id: notification._id,
      type: notification.notificationType || "",
      "start date": new Date(notification.startDate).toLocaleDateString(),
      "end date": new Date(notification.endDate).toLocaleDateString(),
      notification: (notification.notification || "").replace(/<[^>]+>/g, ""),
    }));

    setFilteredRows(formattedRows);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
  };

  const fetchNotificationById = async (id) => {
    try {
      const response = await apiHandler(
        "get",
        `notification/${id}`,
        true,
        false
      );
      return response.data;
    } catch (error) {
      toast.error("Error fetching notification");
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
          notificationType: notification.name,
          notification: notification.data.notification,
          startDate: startDate,
          endDate: endDate,
          publish: notification.data.publish,
          lang: notification.data.lang,
        });
        setEditMode(true);
        setShowModal(true);
      }
    } catch (error) {
      toast.error("Error editing notification");
    }
  };

  const columns = [
    {
      field: "type",
      headerName: "Type",
      width: 110,
      align: "left",
    },
    { field: "start date", headerName: "Start Date", width: 150 },
    { field: "end date", headerName: "End Date", width: 150 },
    { field: "notification", headerName: "Notification", width: 500 },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Button onClick={() => handleEditNotification(params.id)}>Edit</Button>
      ),
    },
  ];

  const handleSubmit = (values) => {
    const apiEndpoint = editMode
      ? `notification/${selectedNotification._id}`
      : "notification";

    mutation({
      ...values,
    });

    fetchNotifications();
  };

  const formik = useFormik({
    initialValues: {
      notificationType: "",
      notification: "",
      startDate: "",
      endDate: "",
      publish: false,
      lang: "en",
    },
    onSubmit: handleSubmit,
  });

  return (
    <>
      <div>
        <CustomBreadcrumbs
          title={`Notification`}
          links={[
            {
              path: "/notification",
              title: "Notification",
              active: true,
            },
          ]}
        />

        <div style={{ margin: "50px 0px", background: "#F6F6F6" }}>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <p style={{ margin: "10px" }}>Notification List</p>
              <div
                style={{
                  display: "flex",
                  width: "50px",
                  height: "35px",
                  borderRadius: "5px",
                  background: "#007BFF",
                  color: "white",
                  justifyContent: "center",
                  margin: "10px",
                }}
              >
                <FaPlus
                  style={{
                    width: "30px",
                    height: "auto",
                    padding: "5px",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowModal(true)}
                />
              </div>
            </div>
          </div>

          <Box sx={{ margin: "0 10px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                border: "1px solid #E0E0E0",
                alignItems: "center",
                padding: "10px",
              }}
            >
              <div>
                Show
                <Select
                  value={pageSize}
                  onChange={(e) =>
                    handlePageSizeChange(parseInt(e.target.value, 10))
                  }
                  style={{ height: "40px", padding: "5px", margin: "0 10px" }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                </Select>
                entries
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "10px",
                  gap: "10px",
                }}
              >
                Search:
                <input
                  value={searchText}
                  onChange={handleSearch}
                  style={{
                    width: "200px",
                    height: "40px",
                    padding: "5px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: "#fff",
                  }}
                />
              </div>
            </div>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: pageSize,
                  },
                },
              }}
              pageSizeOptions={[5, 10, 20]}
              autoHeight
            />
          </Box>

          <Modal
            isVisible={showModal}
            onClose={() => {
              setShowModal(false);
              setEditMode(false);
              setSelectedNotification(null);
            }}
            selectedNotification={selectedNotification}
          >
            <Grid item xs={12} sm={6} md={4}>
              <form
                style={{
                  padding: "20px",
                  maxWidth: "600px",
                  margin: "auto",
                  border: "1px solid #E0E0E0",
                  borderRadius: "8px",
                  background: "#f9f9f9",
                }}
                onSubmit={formik.handleSubmit}
              >
                <Grid container direction="column" spacing={2}>
                  <Grid item>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingBottom: "10px",
                        borderBottom: "1px solid #E0E0E0",
                      }}
                    >
                      <h1 style={{ margin: 0 }}>
                        {editMode ? "Update" : "Add"} Notification
                      </h1>
                      <RxCross1
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setShowModal(false);
                          setEditMode(false);
                        }}
                      />
                    </div>
                  </Grid>

                  <Grid item>
                    <div>
                      <h4 style={{ margin: "10px 0" }}>Notification Type</h4>
                      <select
                        name="notificationType"
                        value={formik.values.notificationType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "5px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          backgroundColor: "#fff",
                        }}
                      >
                        <option value="12431f23s1f2">Pop-up</option>
                        <option value="12431f23s1f3">Pop-over</option>
                        <option value="12431f23s1f4">In-between</option>
                      </select>
                    </div>
                  </Grid>

                  <Grid item>
                    <div>
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
                      />
                    </div>
                  </Grid>

                  <Grid item>
                    <div>
                      <h4 style={{ margin: "10px 0" }}>Start Date</h4>
                      <input
                        type="datetime-local"
                        name="startDate"
                        value={formik.values.startDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "5px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          backgroundColor: "#fff",
                        }}
                      />
                    </div>
                  </Grid>

                  <Grid item>
                    <div>
                      <h4 style={{ margin: "10px 0" }}>End Date</h4>
                      <input
                        type="datetime-local"
                        name="endDate"
                        value={formik.values.endDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "5px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          backgroundColor: "#fff",
                        }}
                      />
                    </div>
                  </Grid>

                  <Grid item>
                    <div>
                      <h4 style={{ margin: "10px 0" }}>Publish</h4>
                      <select
                        name="publish"
                        value={formik.values.publish}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "5px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          backgroundColor: "#fff",
                        }}
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </div>
                  </Grid>

                  <Grid item>
                    <div>
                      <h4 style={{ margin: "10px 0" }}>Language</h4>
                      <select
                        name="lang"
                        value={formik.values.lang}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "5px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          backgroundColor: "#fff",
                        }}
                      >
                        <option value="en">English</option>
                        <option value="fi">Finnish</option>
                      </select>
                    </div>
                  </Grid>
                </Grid>
              </form>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "28px",
                }}
              >
                <Button
                  id="cancel"
                  variant="outlined"
                  onClick={() => {
                    setShowModal(false);
                    setEditMode(false);
                  }}
                >
                  Cancel
                </Button>

                <Button
                  id="submit"
                  onClick={formik.handleSubmit}
                  variant="contained"
                  type="submit"
                >
                  {editMode ? "Update" : "Create"}
                </Button>
              </div>
            </Grid>
          </Modal>
        </div>
      </div>
    </>
  );
}
