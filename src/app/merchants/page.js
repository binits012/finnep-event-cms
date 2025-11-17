"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  Button,
  Grid,
  Modal,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import apiHandler from "@/RESTAPIs/helper";
import { formatDate } from "@/utils/dateUtils";
import Toast from "react-hot-toast";

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState([]);
  const [filteredMerchants, setFilteredMerchants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [otherInfo, setOtherInfo] = useState({});
  const [otherInfoChanged, setOtherInfoChanged] = useState(false);
  const [savingOtherInfo, setSavingOtherInfo] = useState(false);

  // Get available status options based on current status
  const getAvailableStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case "pending":
        return ["active", "suspended"]; // Can only go to active or suspended
      case "active":
        return ["suspended"]; // Can only go to suspended
      case "suspended":
        return ["active"]; // Can only go to active
      default:
        return ["pending", "active", "suspended"]; // Default for unknown status
    }
  };

  // Fetch merchants data
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await apiHandler("GET","merchant", true);
        console.log("API Response:", response);
        console.log("Merchants data:", response.data);
        if (response.status === 200) {
          setMerchants(response.data);
          setFilteredMerchants(response.data);
          console.log("Merchants set successfully:", response.data.length, "merchants");
        } else {
          Toast.error("Failed to fetch merchants");
        }
      } catch (error) {
        console.error("Error fetching merchants:", error);
        Toast.error("Error fetching merchants");
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  // Get unique countries from merchants
  const getUniqueCountries = () => {
    const countries = merchants
      .map((merchant) => merchant.country)
      .filter((country) => country && country.trim() !== "");
    return [...new Set(countries)].sort();
  };

  // Handle filtering (search, country, status)
  useEffect(() => {
    let filtered = [...merchants];

    // Filter by search query (name)
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((merchant) =>
        merchant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.orgName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by country
    if (countryFilter !== "") {
      filtered = filtered.filter((merchant) => merchant.country === countryFilter);
    }

    // Filter by status
    if (statusFilter !== "") {
      filtered = filtered.filter((merchant) => merchant.status === statusFilter);
    }

    setFilteredMerchants(filtered);
  }, [searchQuery, countryFilter, statusFilter, merchants]);

  // Handle status change
  const handleStatusChange = async (merchantId, newStatus) => {
    setUpdating(merchantId);
    try {
      const response = await apiHandler("PATCH",`merchant/${merchantId}`, true, null, {
        status: newStatus,
      });

      if (response.status === 200) {
        // Update local state
        const updatedMerchants = merchants.map((merchant) =>
          merchant._id === merchantId
            ? { ...merchant, status: newStatus }
            : merchant
        );
        setMerchants(updatedMerchants);
        setFilteredMerchants(
          filteredMerchants.map((merchant) =>
            merchant._id === merchantId
              ? { ...merchant, status: newStatus }
              : merchant
          )
        );
        Toast.success("Merchant status updated successfully");
      } else {
        Toast.error(response.message || "Failed to update merchant status");
      }
    } catch (error) {
      console.error("Error updating merchant status:", error);
      Toast.error("Error updating merchant status");
    } finally {
      setUpdating(null);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#4caf50"; // green
      case "suspended":
        return "#f44336"; // red
      case "pending":
        return "#ff9800"; // orange
      default:
        return "#9e9e9e"; // grey
    }
  };

  // Get status transition description
  const getStatusTransitionDescription = (currentStatus) => {
    switch (currentStatus) {
      case "pending":
        return "Can activate or suspend";
      case "active":
        return "Can only suspend";
      case "suspended":
        return "Can only activate";
      default:
        return "Status transition available";
    }
  };

  // Handle modal open
  const handleViewMerchant = (merchant) => {
    setSelectedMerchant(merchant);
    // Initialize otherInfo from merchant data
    // Handle both string and number values from API
    const initialOtherInfo = merchant.otherInfo || {};
    const stripeValue = initialOtherInfo.stripe !== undefined && initialOtherInfo.stripe !== null
      ? (typeof initialOtherInfo.stripe === 'string' ? parseFloat(initialOtherInfo.stripe) : initialOtherInfo.stripe)
      : '';

    setOtherInfo({
      stripe: isNaN(stripeValue) ? '' : stripeValue
    });
    setOtherInfoChanged(false);
    setModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMerchant(null);
    setOtherInfo({});
    setOtherInfoChanged(false);
  };

  // Handle otherInfo input change
  const handleOtherInfoChange = (key, value) => {
    const numericValue = value === '' ? '' : parseFloat(value);
    if (value === '' || (!isNaN(numericValue) && numericValue >= 0)) {
      const updatedOtherInfo = { ...otherInfo, [key]: numericValue };
      setOtherInfo(updatedOtherInfo);

      // Check if values have changed from original
      const originalOtherInfo = selectedMerchant?.otherInfo || {};
      const originalStripe = originalOtherInfo.stripe !== undefined ? Number(originalOtherInfo.stripe) : '';
      const originalRevolut = originalOtherInfo.revolut !== undefined ? Number(originalOtherInfo.revolut) : '';

      const currentStripe = updatedOtherInfo.stripe === '' ? '' : Number(updatedOtherInfo.stripe || 0);
      const currentRevolut = updatedOtherInfo.revolut === '' ? '' : Number(updatedOtherInfo.revolut || 0);

      const hasChanged = currentStripe !== originalStripe || currentRevolut !== originalRevolut;
      setOtherInfoChanged(hasChanged);
    }
  };

  // Handle save otherInfo
  const handleSaveOtherInfo = async () => {
    if (!selectedMerchant?._id) return;

    setSavingOtherInfo(true);
    try {
      // Convert empty strings to 0 and ensure all values are numbers
      const payload = {
        otherInfo: {
          stripe: otherInfo.stripe === '' ? 0 : Number(otherInfo.stripe || 0),
          revolut: otherInfo.revolut === '' ? 0 : Number(otherInfo.revolut || 0)
        }
      };

      const response = await apiHandler(
        "PATCH",
        `merchant/${selectedMerchant._id}/otherInfo`,
        true,
        null,
        payload
      );

      if (response.status === 200) {
        // Update the merchant in the list
        const updatedMerchants = merchants.map((merchant) =>
          merchant._id === selectedMerchant._id
            ? { ...merchant, otherInfo: payload.otherInfo }
            : merchant
        );
        setMerchants(updatedMerchants);

        // Update selected merchant
        setSelectedMerchant({ ...selectedMerchant, otherInfo: payload.otherInfo });
        setOtherInfoChanged(false);
        Toast.success("Platform commission updated successfully");
      } else {
        Toast.error(response.message || "Failed to update platform commission");
      }
    } catch (error) {
      console.error("Error updating platform commission:", error);
      Toast.error("Error updating platform commission");
    } finally {
      setSavingOtherInfo(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Merchants
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              placeholder="Search by name"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
              sx={{ width: "300px", minWidth: "200px" }}
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                displayEmpty
                sx={{ backgroundColor: "background.paper" }}
              >
                <MenuItem value="">
                  <em>All Countries</em>
                </MenuItem>
                {getUniqueCountries().map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
                sx={{ backgroundColor: "background.paper" }}
              >
                <MenuItem value="">
                  <em>All Statuses</em>
                </MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={() => {
                setSearchQuery("");
                setCountryFilter("");
                setStatusFilter("");
              }}
              disabled={searchQuery === "" && countryFilter === "" && statusFilter === ""}
            >
              Clear Filters
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "300px",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell>Organization</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {console.log("Rendering merchants:", filteredMerchants.length, "merchants")}
                  {filteredMerchants.length > 0 ? (
                    filteredMerchants.map((merchant) => {
                      console.log("Rendering merchant:", merchant);
                      return (
                      <TableRow key={merchant._id}>
                        <TableCell>{merchant.orgName || 'N/A'}</TableCell>
                        <TableCell>{merchant.country || 'N/A'}</TableCell>
                        <TableCell>{merchant.companyEmail || 'N/A'}</TableCell>
                        <TableCell>
                          {formatDate(merchant.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={merchant.status}
                                onChange={(e) =>
                                  handleStatusChange(merchant._id, e.target.value)
                                }
                                disabled={updating === merchant._id}
                                sx={{
                                  color: getStatusColor(merchant.status),
                                  fontWeight: "bold",
                                }}
                              >
                                {/* Current status (always available) */}
                                <MenuItem
                                  key={merchant.status}
                                  value={merchant.status}
                                  sx={{
                                    color: getStatusColor(merchant.status),
                                    fontWeight: "bold",
                                  }}
                                >
                                  {merchant.status.charAt(0).toUpperCase() +
                                    merchant.status.slice(1)}
                                </MenuItem>

                                {/* Available transition options */}
                                {getAvailableStatusOptions(merchant.status).map((status) => (
                                  <MenuItem
                                    key={status}
                                    value={status}
                                    sx={{
                                      color: getStatusColor(status),
                                      fontWeight: "normal",
                                    }}
                                  >
                                    {status.charAt(0).toUpperCase() +
                                      status.slice(1)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {updating === merchant._id && (
                              <CircularProgress size={20} />
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.7rem",
                              display: "block",
                              mt: 0.5
                            }}
                          >
                            {getStatusTransitionDescription(merchant.status)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleViewMerchant(merchant)}
                            color="primary"
                            size="small"
                            title="View Details"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No merchants found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </Grid>

      {/* Merchant Details Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="merchant-details-modal"
        aria-describedby="merchant-details-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '80%', md: '70%', lg: '60%' },
            maxWidth: '800px',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 0,
            overflow: 'hidden',
          }}
        >
          {selectedMerchant && (
            <>
              {/* Modal Header */}
              <Box
                sx={{
                  p: 3,
                  pb: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                  {selectedMerchant.name || 'Merchant Details'}
                </Typography>
                <IconButton
                  onClick={handleCloseModal}
                  size="small"
                  sx={{ color: 'text.secondary' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Modal Content */}
              <Box sx={{ p: 3, maxHeight: '70vh', overflow: 'auto' }}>
                <Grid container spacing={3}>
                  {/* Basic Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      Basic Information
                    </Typography>

                    {/* Company Logo */}
                    {selectedMerchant.logo && (
                      <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Company Logo
                        </Typography>
                        <Box
                          sx={{
                            display: 'inline-block',
                            p: 2,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            backgroundColor: 'grey.50',
                          }}
                        >
                          <img
                            src={selectedMerchant.logo}
                            alt={`${selectedMerchant.name || 'Company'} logo`}
                            style={{
                              maxWidth: '200px',
                              maxHeight: '100px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <Box
                            style={{
                              display: 'none',
                              padding: '20px',
                              textAlign: 'center',
                              color: 'text.secondary',
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Logo not available
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Organization Name
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {selectedMerchant.orgName || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Country
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {selectedMerchant.country || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Business Code
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {selectedMerchant.code || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Status
                        </Typography>
                        <Chip
                          label={selectedMerchant.status?.charAt(0).toUpperCase() + selectedMerchant.status?.slice(1)}
                          sx={{
                            backgroundColor: getStatusColor(selectedMerchant.status),
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Contact Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      Contact Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Company Email
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {selectedMerchant.companyEmail || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Personal Email
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {selectedMerchant.email || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Phone Number
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {selectedMerchant.companyPhoneNumber || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Website
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {selectedMerchant.website ? (
                            <a
                              href={selectedMerchant.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#1976d2', textDecoration: 'none' }}
                            >
                              {selectedMerchant.website}
                            </a>
                          ) : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Address
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {selectedMerchant.companyAddress || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Technical Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      Technical Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Merchant ID
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1, fontFamily: 'monospace' }}>
                          {selectedMerchant.merchantId || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Stripe Account
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1, fontFamily: 'monospace' }}>
                          {selectedMerchant.stripeAccount || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Schema Name
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1, fontFamily: 'monospace' }}>
                          {selectedMerchant.schemaName || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Logo URL
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1, wordBreak: 'break-all' }}>
                          {selectedMerchant.logo ? (
                            <a
                              href={selectedMerchant.logo}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#1976d2', textDecoration: 'none' }}
                            >
                              {selectedMerchant.logo}
                            </a>
                          ) : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Banking Information */}
                  {selectedMerchant.bankingInfo &&
                   Object.keys(selectedMerchant.bankingInfo).length > 0 &&
                   Object.values(selectedMerchant.bankingInfo).some(value => value !== null && value !== undefined && value !== '') && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        Banking Information
                      </Typography>
                      <Grid container spacing={2}>
                        {selectedMerchant.bankingInfo.bank_name && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Bank Name
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              {selectedMerchant.bankingInfo.bank_name}
                            </Typography>
                          </Grid>
                        )}
                        {selectedMerchant.bankingInfo.account_holder_name && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Account Holder Name
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              {selectedMerchant.bankingInfo.account_holder_name}
                            </Typography>
                          </Grid>
                        )}
                        {selectedMerchant.bankingInfo.bank_account && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Bank Account
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1, fontFamily: 'monospace' }}>
                              {selectedMerchant.bankingInfo.bank_account}
                            </Typography>
                          </Grid>
                        )}
                        {selectedMerchant.bankingInfo.bic_swift && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              BIC/SWIFT
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1, fontFamily: 'monospace' }}>
                              {selectedMerchant.bankingInfo.bic_swift}
                            </Typography>
                          </Grid>
                        )}
                        {selectedMerchant.bankingInfo.bank_address && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Bank Address
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              {selectedMerchant.bankingInfo.bank_address}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Grid>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Platform Commission */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'primary.main' }}>
                        Platform Commission
                      </Typography>
                      {otherInfoChanged && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSaveOtherInfo}
                          disabled={savingOtherInfo}
                          size="small"
                        >
                          {savingOtherInfo ? <CircularProgress size={20} /> : 'Save'}
                        </Button>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Stripe
                        </Typography>
                        <TextField
                          type="number"
                          value={otherInfo.stripe || ''}
                          onChange={(e) => handleOtherInfoChange('stripe', e.target.value)}
                          placeholder="0"
                          size="small"
                          fullWidth
                          inputProps={{ min: 0, step: 0.01 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">cents</InputAdornment>
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Timestamps */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      Timestamps
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Created At
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {formatDate(selectedMerchant.createdAt)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Updated At
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {formatDate(selectedMerchant.updatedAt)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}