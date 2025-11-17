"use client";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import { Input, Button, CircularProgress, Select, MenuItem, FormControl, InputLabel, Box, Typography, Grid } from "@mui/material";
import { useEffect, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { DataGrid } from "@mui/x-data-grid";
import { RxCross1 } from "react-icons/rx";
import { IoIosSearch } from "react-icons/io";
import Swal from "sweetalert2";
import moment from "moment";
import FinancialReportModal from "./components/FinancialReportModal";

const Tickets = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(100); // Backend limit, but DataGrid will cap at 100
  const [pagination, setPagination] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [countries, setCountries] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedEventForReport, setSelectedEventForReport] = useState(null);

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

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await apiHandler(`GET`, `event/filters/options`, true);
        setCountries(response.data.data.countries || []);
        setMerchants(response.data.data.merchants || []);

        // Get unique categories from events
        const eventsResponse = await apiHandler("GET", "event", true, null, undefined, { page: 1, limit: 1000 });
        const allEvents = eventsResponse.data?.data || [];
        const uniqueCategories = [...new Set(
          allEvents
            .map(event => event.otherInfo?.categoryName)
            .filter(cat => cat && cat.trim() !== '')
        )].sort();
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch events with pagination and filters
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = { page, limit };
        if (selectedCountry) {
          params.country = selectedCountry;
        }
        if (selectedMerchant) {
          params.merchantId = selectedMerchant;
        }
        if (selectedCategory) {
          params.category = selectedCategory;
        }

        const response = await apiHandler(`GET`, `event`, true, null, undefined, params);
        setEvents(response.data.data || []);
        setPagination(response.data.pagination);
      } catch (err) {
        console.log(err);
        Toast.fire({
          icon: "error",
          title: "Error Getting events",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [page, limit, selectedCountry, selectedMerchant, selectedCategory]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return moment(dateString).format("YYYY-MM-DD HH:mm");
  };

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
    setPage(1);
  };

  const handleMerchantChange = (event) => {
    setSelectedMerchant(event.target.value);
    setPage(1);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setPage(1);
  };

  // Client-side search filtering only (category is now server-side)
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.eventTitle?.toLowerCase().includes(search.toLowerCase()) ||
      event.merchant?.name?.toLowerCase().includes(search.toLowerCase()) ||
      event.otherInfo?.categoryName?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const COLUMNS = [
    {
      field: "eventTitle",
      headerName: "Event Title",
      width: 250,
      headerClassName: "column-header",
      cellClassName: "column-cell",
    },
    {
      field: "eventDate",
      headerName: "Event Time",
      width: 180,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      renderCell: ({ row }) => {
        return <span>{formatDate(row.eventDate)}</span>;
      },
    },
    {
      field: "merchant",
      headerName: "Merchant",
      width: 200,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      renderCell: ({ row }) => {
        return (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {row.merchant?.name || "N/A"}
            </Typography>
            {row.merchant?.country && (
              <Typography variant="caption" color="textSecondary">
                {row.merchant.country}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      renderCell: ({ row }) => {
        return <span>{row.otherInfo?.categoryName || "N/A"}</span>;
      },
    },
    {
      field: "occupancy",
      headerName: "Occupancy",
      width: 120,
      headerClassName: "column-header",
      cellClassName: "column-cell",
      align: "center",
    },
    {
      field: "action",
      headerName: "Actions",
      headerClassName: "column-header",
      cellClassName: "column-cell",
      width: 250,
      sortable: false,
      renderCell: ({ row }) => {
        return (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Link href={`/tickets/${row._id}`}>
              <Button
                variant="contained"
                size="small"
                sx={{ background: row.active ? "" : "gray" }}
              >
                View Details
              </Button>
            </Link>
            {row.status === "completed" && (
              <Button
                variant="outlined"
                size="small"
                color="success"
                onClick={() => {
                  setSelectedEventForReport(row._id);
                  setReportModalOpen(true);
                }}
              >
                View Report
              </Button>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <FormWrapper>
      <CustomBreadcrumbs
        title={`Tickets`}
        links={[
          {
            path: "/tickets",
            title: "Tickets",
            active: true,
          },
        ]}
      />
      <h2>Events - Ticket Management</h2>

      {/* Filter Section */}
      <FilterSection>
        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Country</InputLabel>
              <Select
                value={selectedCountry}
                label="Country"
                onChange={handleCountryChange}
              >
                <MenuItem value="">All Countries</MenuItem>
                {countries.map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Merchant</InputLabel>
              <Select
                value={selectedMerchant}
                label="Merchant"
                onChange={handleMerchantChange}
              >
                <MenuItem value="">All Merchants</MenuItem>
                {merchants.map((merchant) => (
                  <MenuItem key={merchant._id} value={merchant._id}>
                    {merchant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={handleCategoryChange}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Input
              placeholder="Search events..."
              value={search}
              sx={{
                width: "100%",
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
              onChange={(e) => setSearch(e.target.value)}
              endAdornment={
                search && search !== " " ? (
                  <RxCross1
                    size={25}
                    style={{
                      margin: 8,
                      cursor: "pointer",
                    }}
                    onClick={(e) => setSearch("")}
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
        </Grid>
      </FilterSection>

      <StyledDataGrid
        rows={filteredEvents}
        columns={COLUMNS}
        loading={loading}
        paginationMode="server"
        rowCount={pagination?.totalItems || 0}
        pageSizeOptions={[ 25, 50, 100]}
        paginationModel={{
          page: (pagination?.currentPage || 1) - 1,
          pageSize: Math.min(pagination?.itemsPerPage || limit, 100),
        }}
        onPaginationModelChange={(model) => {
          setPage(model.page + 1);
          // Note: pageSize changes are handled by DataGrid, but backend will use limit=100
          // If user selects a pageSize > 100, it will be capped by DataGrid
        }}
        getRowId={(row) => row._id}
        isRowSelectable={() => false}
        slots={{
          noRowsOverlay: () => (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="100%"
            >
              <Typography variant="h6" color="textSecondary">
                No events found
              </Typography>
            </Box>
          ),
        }}
      />
      <FinancialReportModal
        open={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setSelectedEventForReport(null);
        }}
        eventId={selectedEventForReport}
      />
    </FormWrapper>
  );
};

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

export default Tickets;
