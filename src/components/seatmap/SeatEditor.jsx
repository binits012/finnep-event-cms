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
	Typography,
	Checkbox,
	FormControlLabel
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
			tags: place?.tags || []
		},
		enableReinitialize: true,
		onSubmit: (values) => {
			if (onSave) {
				const placeData = {
					placeId: values.placeId,
					x: parseFloat(values.x) || 0,
					y: parseFloat(values.y) || 0,
					row: values.row,
					seat: values.seat,
					section: values.section,
					zone: values.zone,
					pricing: {
						basePrice: Math.round(parseFloat(values.basePrice) * 100) || 0,
						currency: values.currency,
						currentPrice: Math.round(parseFloat(values.basePrice) * 100) || 0
					},
					available: values.available,
					tags: values.tags
				}
				onSave(placeData)
			}
		}
	})

	const handleTagToggle = (tag) => {
		const currentTags = formik.values.tags || []
		const newTags = currentTags.includes(tag)
			? currentTags.filter(t => t !== tag)
			: [...currentTags, tag]
		formik.setFieldValue('tags', newTags)
	}

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
								disabled
							/>
						</Grid>

						<Grid item xs={12}>
							<Typography variant="subtitle2" gutterBottom>
								Coordinates (Read-only)
							</Typography>
						</Grid>

						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="X Coordinate"
								type="number"
								name="x"
								value={formik.values.x}
								disabled
							/>
						</Grid>

						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="Y Coordinate"
								type="number"
								name="y"
								value={formik.values.y}
								disabled
							/>
						</Grid>

						<Grid item xs={12}>
							<Typography variant="subtitle2" gutterBottom>
								Location (Read-only)
							</Typography>
						</Grid>

						<Grid item xs={12} md={4}>
							<TextField
								fullWidth
								label="Section"
								name="section"
								value={formik.values.section}
								disabled
							/>
						</Grid>

						<Grid item xs={12} md={4}>
							<TextField
								fullWidth
								label="Row"
								name="row"
								value={formik.values.row}
								disabled
							/>
						</Grid>

						<Grid item xs={12} md={4}>
							<TextField
								fullWidth
								label="Seat"
								name="seat"
								value={formik.values.seat}
								disabled
							/>
						</Grid>

						<Grid item xs={12}>
							<Typography variant="subtitle2" gutterBottom>
								Pricing (Read-only)
							</Typography>
						</Grid>

						<Grid item xs={12} md={8}>
							<TextField
								fullWidth
								label="Base Price (EUR)"
								type="number"
								name="basePrice"
								value={formik.values.basePrice / 100}
								disabled
							/>
						</Grid>

						<Grid item xs={12} md={4}>
							<FormControl fullWidth>
								<InputLabel>Currency</InputLabel>
								<Select
									name="currency"
									value={formik.values.currency}
									label="Currency"
									disabled
								>
									<MenuItem value="EUR">EUR</MenuItem>
									<MenuItem value="USD">USD</MenuItem>
									<MenuItem value="GBP">GBP</MenuItem>
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<Typography variant="subtitle2" gutterBottom>
								Availability & Tags
							</Typography>
						</Grid>

						<Grid item xs={12}>
							<FormControlLabel
								control={
									<Checkbox
									checked={formik.values.available}
										onChange={(e) => formik.setFieldValue('available', e.target.checked)}
								/>
								}
								label="Available"
							/>
						</Grid>

						<Grid item xs={12}>
							<Typography variant="body2" color="textSecondary" gutterBottom>
								Tags
							</Typography>
							<FormControlLabel
								control={
									<Checkbox
										checked={formik.values.tags?.includes('wheelchair') || false}
										onChange={() => handleTagToggle('wheelchair')}
									/>
								}
								label="Wheelchair Accessible"
							/>
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

