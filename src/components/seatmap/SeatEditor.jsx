'use client'

import React from 'react'
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Grid,
	Box,
	Typography
} from '@mui/material'
import { useFormik } from 'formik'

/**
 * SeatEditor Component
 * Modal for editing individual seat/place details
 */
const SeatEditor = ({ open, place, onClose, onSave, onDelete }) => {
	const formik = useFormik({
		initialValues: {
			placeId: place?.placeId || '',
			x: place?.x || 0,
			y: place?.y || 0,
			row: place?.row || '',
			seat: place?.seat || '',
			section: place?.section || '',
			zone: place?.zone || '',
			basePrice: place?.pricing?.basePrice || 0,
			currency: place?.pricing?.currency || 'EUR',
			available: place?.available !== false,
			status: place?.status || 'available',
			categories: place?.categories || [],
			tags: place?.tags || []
		},
		enableReinitialize: true,
		onSubmit: (values) => {
			if (onSave) {
				// Format data to match schema
				const placeData = {
					placeId: values.placeId,
					x: parseFloat(values.x) || 0,
					y: parseFloat(values.y) || 0,
					row: values.row,
					seat: values.seat,
					section: values.section,
					zone: values.zone,
					pricing: {
						basePrice: Math.round(parseFloat(values.basePrice) * 100) || 0, // Convert to cents
						currency: values.currency,
						currentPrice: Math.round(parseFloat(values.basePrice) * 100) || 0
					},
					available: values.available,
					status: values.status,
					categories: values.categories,
					tags: values.tags
				}
				onSave(placeData)
			}
		}
	})

	if (!place) return null

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>Edit Seat: {place.placeId}</DialogTitle>
			<form onSubmit={formik.handleSubmit}>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="Place ID"
								name="placeId"
								value={formik.values.placeId}
								onChange={formik.handleChange}
								disabled
							/>
						</Grid>

						<Grid item xs={12} md={6}>
							<FormControl fullWidth>
								<InputLabel>Status</InputLabel>
								<Select
									name="status"
									value={formik.values.status}
									label="Status"
									onChange={formik.handleChange}
								>
									<MenuItem value="available">Available</MenuItem>
									<MenuItem value="reserved">Reserved</MenuItem>
									<MenuItem value="sold">Sold</MenuItem>
									<MenuItem value="blocked">Blocked</MenuItem>
									<MenuItem value="unavailable">Unavailable</MenuItem>
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<Typography variant="subtitle2" gutterBottom>
								Coordinates
							</Typography>
						</Grid>

						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="X Coordinate"
								type="number"
								name="x"
								value={formik.values.x}
								onChange={formik.handleChange}
							/>
						</Grid>

						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="Y Coordinate"
								type="number"
								name="y"
								value={formik.values.y}
								onChange={formik.handleChange}
							/>
						</Grid>

						<Grid item xs={12}>
							<Typography variant="subtitle2" gutterBottom>
								Location
							</Typography>
						</Grid>

						<Grid item xs={12} md={4}>
							<TextField
								fullWidth
								label="Section"
								name="section"
								value={formik.values.section}
								onChange={formik.handleChange}
							/>
						</Grid>

						<Grid item xs={12} md={4}>
							<TextField
								fullWidth
								label="Row"
								name="row"
								value={formik.values.row}
								onChange={formik.handleChange}
							/>
						</Grid>

						<Grid item xs={12} md={4}>
							<TextField
								fullWidth
								label="Seat"
								name="seat"
								value={formik.values.seat}
								onChange={formik.handleChange}
							/>
						</Grid>

						<Grid item xs={12}>
							<Typography variant="subtitle2" gutterBottom>
								Pricing
							</Typography>
						</Grid>

						<Grid item xs={12} md={8}>
							<TextField
								fullWidth
								label="Base Price (EUR)"
								type="number"
								name="basePrice"
								value={formik.values.basePrice / 100}
								onChange={(e) => formik.setFieldValue('basePrice', parseFloat(e.target.value) * 100 || 0)}
								inputProps={{ step: 0.01, min: 0 }}
							/>
						</Grid>

						<Grid item xs={12} md={4}>
							<FormControl fullWidth>
								<InputLabel>Currency</InputLabel>
								<Select
									name="currency"
									value={formik.values.currency}
									label="Currency"
									onChange={formik.handleChange}
								>
									<MenuItem value="EUR">EUR</MenuItem>
									<MenuItem value="USD">USD</MenuItem>
									<MenuItem value="GBP">GBP</MenuItem>
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<input
									type="checkbox"
									name="available"
									checked={formik.values.available}
									onChange={formik.handleChange}
								/>
								<Typography>Available</Typography>
							</Box>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					{onDelete && (
						<Button onClick={onDelete} color="error">
							Delete
						</Button>
					)}
					<Button onClick={onClose}>Cancel</Button>
					<Button type="submit" variant="contained">
						Save
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	)
}

export default SeatEditor

