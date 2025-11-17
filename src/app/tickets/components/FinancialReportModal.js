"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import apiHandler from "@/RESTAPIs/helper";
import moment from "moment";
import jsPDF from "jspdf";

const FinancialReportModal = ({ open, onClose, eventId }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [externalDataRequested, setExternalDataRequested] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(null);
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  const fetchReport = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiHandler(
        `GET`,
        `event/${eventId}/financial-report`,
        true
      );
      if (response.data.success) {
        setReportData(response.data.data);
        const wasRequested = externalDataRequested;
        const isNowRequested = response.data.externalDataRequested || false;
        setExternalDataRequested(isNowRequested);

        // If external data was just requested, set up a refresh countdown
        if (isNowRequested && !wasRequested) {
          setRefreshCountdown(10); // 10 seconds
          setRefreshAttempts(0); // Reset attempts when new request is made
        } else if (!isNowRequested && wasRequested) {
          // External data has arrived, stop auto-refresh
          setRefreshCountdown(null);
          setRefreshAttempts(0);
        } else if (isNowRequested && wasRequested) {
          // Still waiting for data, continue countdown if under limit
          if (refreshAttempts < 5 && refreshCountdown === null) {
            setRefreshCountdown(10);
          }
        }
      } else {
        setError(response.data.message || "Failed to fetch report");
      }
    } catch (err) {
      setError(err.message || "Error loading financial report");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (open && eventId) {
      fetchReport();
    } else {
      setReportData(null);
      setError(null);
      setExternalDataRequested(false);
      setRefreshCountdown(null);
      setRefreshAttempts(0);
    }
  }, [open, eventId, fetchReport]);

  // Handle countdown timer and auto-refresh
  useEffect(() => {
    if (refreshCountdown !== null && refreshCountdown > 0 && externalDataRequested && open && refreshAttempts < 5) {
      const interval = setInterval(() => {
        setRefreshCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Wait a bit more for data to arrive, then refresh
            setTimeout(() => {
              setRefreshAttempts((prevAttempts) => {
                const newAttempts = prevAttempts + 1;
                if (newAttempts < 5) {
                  fetchReport();
                } else {
                  // Stop auto-refreshing after 5 attempts
                  setRefreshCountdown(null);
                }
                return newAttempts;
              });
            }, 2000);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else if (refreshAttempts >= 5 && refreshCountdown !== null) {
      // Clear countdown if we've reached max attempts
      setRefreshCountdown(null);
    }
  }, [refreshCountdown, externalDataRequested, open, fetchReport, refreshAttempts]);

  const formatCurrency = (amount, currency = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const downloadReportPDF = () => {
    if (!reportData) return;

    try {
      const doc = new jsPDF();
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      const lineHeight = 7;
      const sectionSpacing = 10;

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredSpace = 20) => {
        if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Helper function to add wrapped text
      const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return lines.length * (fontSize * 0.4 + 2);
      };

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Financial Report", margin, yPosition);
      yPosition += lineHeight * 2;

      // Event Information
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Event Information", margin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      yPosition += addWrappedText(
        `Event Title: ${reportData.event?.eventTitle || "N/A"}`,
        margin,
        yPosition,
        contentWidth
      );
      yPosition += lineHeight;

      yPosition += addWrappedText(
        `Event Date: ${moment(reportData.event?.eventDate).format("MMMM DD, YYYY HH:mm")}`,
        margin,
        yPosition,
        contentWidth
      );
      yPosition += lineHeight;

      yPosition += addWrappedText(
        `Merchant: ${reportData.merchantInfo?.name || "N/A"}`,
        margin,
        yPosition,
        contentWidth
      );
      yPosition += lineHeight;

      yPosition += addWrappedText(
        `Occupancy: ${reportData.summary?.totalOccupancy || 0}`,
        margin,
        yPosition,
        contentWidth
      );
      yPosition += sectionSpacing * 2;

      checkPageBreak();

      // Financial Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Financial Summary", margin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      yPosition += addWrappedText(
        `Total Revenue: ${formatCurrency(reportData.summary?.totalRevenue || 0)}`,
        margin,
        yPosition,
        contentWidth
      );
      yPosition += lineHeight;

      yPosition += addWrappedText(
        `Tickets Sold: ${reportData.summary?.totalTicketsSold || 0}`,
        margin,
        yPosition,
        contentWidth
      );
      yPosition += lineHeight;

      yPosition += addWrappedText(
        `Occupancy Rate: ${(reportData.summary?.occupancyRate || 0).toFixed(2)}%`,
        margin,
        yPosition,
        contentWidth
      );
      yPosition += lineHeight;

      yPosition += addWrappedText(
        `Local Revenue: ${formatCurrency(reportData.summary?.localRevenue || 0)} (${reportData.summary?.localTicketsSold || 0} tickets)`,
        margin,
        yPosition,
        contentWidth
      );
      yPosition += lineHeight;

      yPosition += addWrappedText(
        `External Revenue: ${formatCurrency(reportData.summary?.externalRevenue || 0)} (${reportData.summary?.externalTicketsSold || 0} tickets)`,
        margin,
        yPosition,
        contentWidth
      );
      yPosition += sectionSpacing * 2;

      checkPageBreak(30);

      // Ticket Breakdown
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Ticket Breakdown", margin, yPosition);
      yPosition += lineHeight * 1.5;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const tableHeaders = ["Type", "Qty", "Local", "Ext", "Total Rev", "Local Rev", "Ext Rev", "Source"];
      const colWidths = [40, 15, 15, 15, 25, 25, 25, 20];
      let xPos = margin;

      // Draw table headers
      tableHeaders.forEach((header, index) => {
        doc.text(header, xPos, yPosition);
        xPos += colWidths[index];
      });
      yPosition += lineHeight;

      // Draw line under headers
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight * 0.5;

      doc.setFont("helvetica", "normal");
      reportData.ticketBreakdown?.forEach((breakdown) => {
        checkPageBreak(15);
        xPos = margin;
        const rowData = [
          breakdown.ticketType || "N/A",
          breakdown.quantity?.toString() || "0",
          breakdown.localQuantity?.toString() || "0",
          breakdown.externalQuantity?.toString() || "0",
          formatCurrency(breakdown.totalRevenue || 0),
          formatCurrency(breakdown.localRevenue || 0),
          formatCurrency(breakdown.externalRevenue || 0),
          breakdown.source || "N/A",
        ];

        rowData.forEach((cell, index) => {
          const cellText = doc.splitTextToSize(cell, colWidths[index] - 2);
          doc.text(cellText, xPos, yPosition);
          xPos += colWidths[index];
        });
        yPosition += lineHeight * Math.max(...rowData.map((cell, index) => {
          return doc.splitTextToSize(cell, colWidths[index] - 2).length;
        })) + 2;
      });

      yPosition += sectionSpacing * 2;
      checkPageBreak(30);

      // External Sales Breakdown
      const hasExternalSales = reportData.ticketBreakdown?.some(
        (breakdown) => breakdown.externalSales && breakdown.externalSales.length > 0
      );

      if (hasExternalSales) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("External Sales Breakdown", margin, yPosition);
        yPosition += lineHeight * 1.5;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        const extTableHeaders = ["Ticket Type", "Qty", "Unit Price", "Total", "Sale Date", "Source"];
        const extColWidths = [40, 15, 20, 20, 30, 20];
        xPos = margin;

        // Draw table headers
        extTableHeaders.forEach((header, index) => {
          doc.text(header, xPos, yPosition);
          xPos += extColWidths[index];
        });
        yPosition += lineHeight;

        // Draw line under headers
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += lineHeight * 0.5;

        doc.setFont("helvetica", "normal");
        reportData.ticketBreakdown
          ?.flatMap((breakdown) =>
            breakdown.externalSales?.map((sale) => ({
              ...sale,
              ticketType: breakdown.ticketType,
            })) || []
          )
          .forEach((sale) => {
            checkPageBreak(15);
            xPos = margin;
            const rowData = [
              sale.ticketType || "N/A",
              sale.quantity?.toString() || "0",
              formatCurrency(sale.price || 0),
              formatCurrency((sale.price || 0) * (sale.quantity || 0)),
              moment(sale.saleDate).format("MMM DD, YYYY"),
              sale.source || "N/A",
            ];

            rowData.forEach((cell, index) => {
              const cellText = doc.splitTextToSize(cell, extColWidths[index] - 2);
              doc.text(cellText, xPos, yPosition);
              xPos += extColWidths[index];
            });
            yPosition += lineHeight * Math.max(...rowData.map((cell, index) => {
              return doc.splitTextToSize(cell, extColWidths[index] - 2).length;
            })) + 2;
          });
      }

      // Add footer with generation timestamp on the last page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const date = new Date();
        const timestamp = moment(date).format("MMMM DD, YYYY HH:mm:ss");
        doc.text(
          `Generated on: ${timestamp}`,
          margin,
          doc.internal.pageSize.getHeight() - 10
        );
      }

      // Save the PDF
      const fileName = `${reportData.event?.eventTitle || "Financial_Report"}_${moment().format("YYYY-MM-DD")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF report. Please try again.");
    }
  };

  const handleClose = (event, reason) => {
    // Only allow closing via explicit close button, not backdrop click
    if (reason && reason === "backdropClick") {
      return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Financial Report
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {externalDataRequested && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {reportData?.dataSource?.externalDataError
              ? `External ticket sales data unavailable: ${reportData.dataSource.externalDataError}`
              : "External ticket sales data has been requested from the external microservice. The report will update automatically when data is received. You can also refresh manually."}
            {refreshCountdown !== null && refreshCountdown > 0 && refreshAttempts < 5 && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Auto-refreshing in {refreshCountdown} seconds... (Attempt {refreshAttempts + 1}/5)
              </Typography>
            )}
            {refreshAttempts >= 5 && (
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'warning.main' }}>
                Auto-refresh stopped after 5 attempts. Please refresh manually if needed.
              </Typography>
            )}
          </Alert>
        )}

        {!loading && !error && reportData && (
          <>
            {/* Event Summary */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Event Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Event Title
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {reportData.event?.eventTitle}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Event Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {moment(reportData.event?.eventDate).format(
                      "MMMM DD, YYYY HH:mm"
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Merchant
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {reportData.merchantInfo?.name || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Occupancy
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {reportData.summary?.totalOccupancy || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Financial Summary */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Financial Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(reportData.summary?.totalRevenue || 0)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tickets Sold
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {reportData.summary?.totalTicketsSold || 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Occupancy Rate
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {reportData.summary?.occupancyRate?.toFixed(2) || 0}%
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Revenue Breakdown */}
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Revenue Breakdown:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      Local: {formatCurrency(reportData.summary?.localRevenue || 0)} (
                      {reportData.summary?.localTicketsSold || 0} tickets)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      External: {formatCurrency(reportData.summary?.externalRevenue || 0)} (
                      {reportData.summary?.externalTicketsSold || 0} tickets)
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Data Source Indicators */}
              {!reportData.dataSource?.externalDataAvailable && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  External ticket sales data unavailable. Showing local data only.
                  {reportData.dataSource?.externalDataError && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Error: {reportData.dataSource.externalDataError}
                    </Typography>
                  )}
                </Alert>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Ticket Breakdown */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Ticket Breakdown
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ticket Type</TableCell>
                      <TableCell align="right">Total Quantity</TableCell>
                      <TableCell align="right">Local</TableCell>
                      <TableCell align="right">External</TableCell>
                      <TableCell align="right">Total Revenue</TableCell>
                      <TableCell align="right">Local Revenue</TableCell>
                      <TableCell align="right">External Revenue</TableCell>
                      <TableCell>Source</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.ticketBreakdown?.map((breakdown, index) => (
                      <TableRow key={index}>
                        <TableCell>{breakdown.ticketType}</TableCell>
                        <TableCell align="right">{breakdown.quantity}</TableCell>
                        <TableCell align="right">
                          {breakdown.localQuantity}
                        </TableCell>
                        <TableCell align="right">
                          {breakdown.externalQuantity}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(breakdown.totalRevenue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(breakdown.localRevenue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(breakdown.externalRevenue)}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor:
                                breakdown.source === "local"
                                  ? "primary.light"
                                  : breakdown.source === "external"
                                  ? "secondary.light"
                                  : "info.light",
                              color: "white",
                            }}
                          >
                            {breakdown.source}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* External Sales Breakdown */}
            {reportData.ticketBreakdown?.some(
              (breakdown) => breakdown.externalSales && breakdown.externalSales.length > 0
            ) && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    External Sales Breakdown
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ticket Type</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell>Sale Date</TableCell>
                          <TableCell>Source</TableCell>
                          <TableCell>Payment Method</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.ticketBreakdown
                          ?.flatMap((breakdown) =>
                            breakdown.externalSales?.map((sale, saleIndex) => ({
                              ...sale,
                              ticketType: breakdown.ticketType,
                            })) || []
                          )
                          .map((sale, index) => (
                            <TableRow key={index}>
                              <TableCell>{sale.ticketType}</TableCell>
                              <TableCell align="right">{sale.quantity}</TableCell>
                              <TableCell align="right">
                                {formatCurrency(sale.price)}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(sale.price * sale.quantity)}
                              </TableCell>
                              <TableCell>
                                {moment(sale.saleDate).format("MMM DD, YYYY HH:mm")}
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    bgcolor:
                                      sale.source === "door_sale"
                                        ? "success.light"
                                        : "info.light",
                                    color: "white",
                                  }}
                                >
                                  {sale.source}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {sale.paymentMethod || "N/A"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            )}

          </>
        )}
      </DialogContent>
      <DialogActions>
        {externalDataRequested && refreshCountdown === null && (
          <Button
            onClick={fetchReport}
            variant="outlined"
            color="primary"
          >
            Refresh Report
          </Button>
        )}
        {!loading && !error && reportData &&
         (reportData.summary?.totalTicketsSold > 0 ||
          reportData.summary?.totalRevenue > 0 ||
          (reportData.ticketBreakdown && reportData.ticketBreakdown.length > 0)) && (
          <Button
            onClick={downloadReportPDF}
            variant="contained"
            color="primary"
            sx={{ mr: 1 }}
          >
            Download PDF
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinancialReportModal;

