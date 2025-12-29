'use client'

import React, { useState } from 'react'
import {
	Box,
	Paper,
	TextField,
	Button,
	Typography,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Grid,
	Divider,
	CircularProgress,
	Alert,
	Tabs,
	Tab,
	Slider,
	Input
} from '@mui/material'
import { useFormik } from 'formik'
import Swal from 'sweetalert2'

/**
 * VenueConfiguration Component
 * Form for creating/editing venue configurations
 *
 * This form allows you to:
 * 1. Enter basic venue information (name, type)
 * 2. Set physical dimensions (width, height, unit)
 * 3. Configure layout spacing (seat, row, section spacing)
 *
 * When you click "Create Venue", it will:
 * - Save the venue to the database
 * - Automatically proceed to the next step (manifest generation)
 */
const VenueConfiguration = ({ venue, onSubmit, onCancel, loading = false }) => {
	const [svgInputMode, setSvgInputMode] = useState('url')
	const [svgUrl, setSvgUrl] = useState(venue?.backgroundSvg?.sourceUrl || '')
	const [svgPreview, setSvgPreview] = useState(venue?.backgroundSvg || null)
	const [loadingSvg, setLoadingSvg] = useState(false)

	const formik = useFormik({
		initialValues: {
			name: venue?.name || '',
			venueType: venue?.venueType || 'stadium',
			externalVenueId: venue?.externalVenueId || '',
			// Location fields
			address: venue?.address || '',
			city: venue?.city || '',
			state: venue?.state || '',
			country: venue?.country || '',
			postalCode: venue?.postalCode || '',
			coordinates: {
				latitude: venue?.coordinates?.latitude || '',
				longitude: venue?.coordinates?.longitude || '',
				geocode: venue?.coordinates?.geocode || ''
			},
			timezone: venue?.timezone || '',
			phone: venue?.phone || '',
			email: venue?.email || '',
			website: venue?.website || '',
			description: venue?.description || '',
			dimensions: {
				width: venue?.dimensions?.width || 0,
				height: venue?.dimensions?.height || 0,
				unit: venue?.dimensions?.unit || 'meters'
			},
			layoutConfig: {
				seatSpacing: venue?.layoutConfig?.seatSpacing || 0.5,
				rowSpacing: venue?.layoutConfig?.rowSpacing || 0.8,
				sectionSpacing: venue?.layoutConfig?.sectionSpacing || 1.0
			},
			backgroundSvg: {
				svgContent: venue?.backgroundSvg?.svgContent || '',
				sourceUrl: venue?.backgroundSvg?.sourceUrl || '',
				sourceType: venue?.backgroundSvg?.sourceType || 'url',
				opacity: venue?.backgroundSvg?.opacity || 0.5,
				scale: venue?.backgroundSvg?.scale || 1.0,
				translateX: venue?.backgroundSvg?.translateX || 0,
				translateY: venue?.backgroundSvg?.translateY || 0,
				rotation: venue?.backgroundSvg?.rotation || 0,
				isVisible: venue?.backgroundSvg?.isVisible ?? true
			}
		},
		onSubmit: (values) => {
			if (onSubmit) {
				onSubmit(values)
			}
		}
	})

	// Client-side SVG sanitization
	const sanitizeSvg = (svgContent) => {
		// Remove dangerous elements and attributes
		let cleaned = svgContent
			.replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags
			.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
			.replace(/javascript:/gi, '') // Remove javascript: URIs
			.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '') // Remove foreignObject

		// Validate it's proper SVG
		if (!cleaned.includes('<svg')) {
			throw new Error('Invalid SVG content: Missing <svg> tag.')
		}

		// Size limit check (5MB)
		if (cleaned.length > 5 * 1024 * 1024) {
			throw new Error('SVG content too large (max 5MB).')
		}

		return cleaned
	}

	const handleFetchSvg = async () => {
		setLoadingSvg(true)
		try {
			// Validate URL format
			try {
				new URL(svgUrl)
			} catch {
				throw new Error('Invalid URL format')
			}

			// Fetch directly from external source
			const response = await fetch(svgUrl)

			if (!response.ok) {
				throw new Error(`Failed to fetch SVG: ${response.statusText}`)
			}

			const svgContent = await response.text()

			// Sanitize the SVG content
			const sanitizedSvg = sanitizeSvg(svgContent)

			// Update formik values
			formik.setFieldValue('backgroundSvg', {
				svgContent: sanitizedSvg,
				sourceUrl: svgUrl,
				sourceType: 'url',
				opacity: 0.5,
				scale: 1.0,
				translateX: 0,
				translateY: 0,
				rotation: 0,
				isVisible: true
			})
			setSvgPreview({ svgContent: sanitizedSvg, sourceUrl: svgUrl, sourceType: 'url' })
			Swal.fire('Success', 'SVG loaded successfully', 'success')
		} catch (err) {
			console.error('SVG fetch error:', err)
			Swal.fire('Error', err.message || 'Failed to fetch SVG', 'error')
		} finally {
			setLoadingSvg(false)
		}
	}

	const handleFileUpload = async (e) => {
		const file = e.target.files[0]
		if (!file) return

		if (file.size > 5 * 1024 * 1024) {
			Swal.fire('Error', 'File too large (max 5MB)', 'error')
			return
		}

		const reader = new FileReader()
		reader.onload = (event) => {
			try {
				const svgContent = event.target.result

				// Sanitize the uploaded SVG
				const sanitizedSvg = sanitizeSvg(svgContent)

				formik.setFieldValue('backgroundSvg', {
					svgContent: sanitizedSvg,
					sourceUrl: file.name,
					sourceType: 'upload',
					opacity: 0.5,
					scale: 1.0,
				translateX: 0,
				translateY: 0,
				rotation: 0,
				isVisible: true
			})
			setSvgPreview({ svgContent: sanitizedSvg, sourceUrl: file.name, sourceType: 'upload' })
			Swal.fire('Success', 'SVG uploaded successfully', 'success')
			} catch (err) {
				Swal.fire('Error', err.message || 'Failed to process SVG file', 'error')
			}
		}
		reader.onerror = () => {
			Swal.fire('Error', 'Failed to read file', 'error')
		}
		reader.readAsText(file)
	}

	const handleRemoveSvg = () => {
		formik.setFieldValue('backgroundSvg', {
			svgContent: '',
			sourceUrl: '',
			sourceType: 'url',
			opacity: 0.5,
			scale: 1.0,
			translateX: 0,
			translateY: 0,
			rotation: 0,
			isVisible: true
		})
		setSvgPreview(null)
		setSvgUrl('')
	}

	return (
		<Paper elevation={2} sx={{ p: 3 }}>
			<Typography variant="h6" gutterBottom>
				{venue ? 'Edit Venue' : 'Create New Venue'}
			</Typography>

			{!venue && (
				<Alert severity="info" sx={{ mb: 2 }}>
					Fill in the form below to create a new venue. After creating, you'll be able to generate a seat map manifest for this venue.
				</Alert>
			)}

			<form onSubmit={formik.handleSubmit}>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<TextField
							fullWidth
							label="Venue Name"
							name="name"
							value={formik.values.name}
							onChange={formik.handleChange}
							required
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<FormControl fullWidth>
							<InputLabel>Venue Type</InputLabel>
							<Select
								name="venueType"
								value={formik.values.venueType}
								label="Venue Type"
								onChange={formik.handleChange}
							>
								<MenuItem value="stadium">Stadium</MenuItem>
								<MenuItem value="theater">Theater</MenuItem>
								<MenuItem value="arena">Arena</MenuItem>
								<MenuItem value="general">General Admission</MenuItem>
								<MenuItem value="custom">Custom</MenuItem>
							</Select>
						</FormControl>
					</Grid>

					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="External Venue ID (Optional)"
							name="externalVenueId"
							value={formik.values.externalVenueId}
							onChange={formik.handleChange}
							helperText="Optional: Use if integrating with external systems"
						/>
					</Grid>

					{/* Location Information Section */}
					<Grid item xs={12}>
						<Divider sx={{ my: 2 }} />
						<Box sx={{ mb: 2 }}>
							<Typography variant="subtitle1" gutterBottom>
								Location Information (Optional)
							</Typography>
							<Typography variant="body2" color="textSecondary">
								Provide location details for the venue. This helps with event organization and filtering.
							</Typography>
						</Box>
					</Grid>

					<Grid item xs={12}>
						<TextField
							fullWidth
							label="Address"
							name="address"
							value={formik.values.address}
							onChange={formik.handleChange}
							placeholder="Street address"
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="City"
							name="city"
							value={formik.values.city}
							onChange={formik.handleChange}
							placeholder="City name"
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="State/Province"
							name="state"
							value={formik.values.state}
							onChange={formik.handleChange}
							placeholder="State or province"
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Country"
							name="country"
							value={formik.values.country}
							onChange={formik.handleChange}
							placeholder="Country name"
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Postal Code"
							name="postalCode"
							value={formik.values.postalCode}
							onChange={formik.handleChange}
							placeholder="ZIP/Postal code"
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Timezone"
							name="timezone"
							value={formik.values.timezone}
							onChange={formik.handleChange}
							placeholder="e.g., Europe/Helsinki, America/New_York"
							helperText="IANA timezone identifier"
						/>
					</Grid>

					<Grid item xs={12}>
						<Divider sx={{ my: 1 }} />
						<Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
							Coordinates (Optional)
						</Typography>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Latitude"
							type="number"
							name="coordinates.latitude"
							value={formik.values.coordinates.latitude}
							onChange={(e) => formik.setFieldValue('coordinates.latitude', e.target.value)}
							placeholder="e.g., 60.1699"
							inputProps={{ step: 'any' }}
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Longitude"
							type="number"
							name="coordinates.longitude"
							value={formik.values.coordinates.longitude}
							onChange={(e) => formik.setFieldValue('coordinates.longitude', e.target.value)}
							placeholder="e.g., 24.9384"
							inputProps={{ step: 'any' }}
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Geocode"
							name="coordinates.geocode"
							value={formik.values.coordinates.geocode}
							onChange={(e) => formik.setFieldValue('coordinates.geocode', e.target.value)}
							placeholder="Geocoded address string"
						/>
					</Grid>

					<Grid item xs={12}>
						<Divider sx={{ my: 1 }} />
						<Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
							Contact Information (Optional)
						</Typography>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Phone"
							name="phone"
							value={formik.values.phone}
							onChange={formik.handleChange}
							placeholder="+358 9 1234567"
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Email"
							type="email"
							name="email"
							value={formik.values.email}
							onChange={formik.handleChange}
							placeholder="info@venue.com"
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Website"
							type="url"
							name="website"
							value={formik.values.website}
							onChange={formik.handleChange}
							placeholder="https://venue.com"
						/>
					</Grid>

					<Grid item xs={12}>
						<TextField
							fullWidth
							label="Description"
							name="description"
							value={formik.values.description}
							onChange={formik.handleChange}
							multiline
							rows={3}
							placeholder="Venue description..."
						/>
					</Grid>

					<Grid item xs={12}>
						<Divider sx={{ my: 2 }} />
						<Box sx={{ mb: 2 }}>
							<Typography variant="subtitle1" gutterBottom>
								Physical Dimensions (Optional)
							</Typography>
							<Typography variant="body2" color="textSecondary">
								The physical size of the venue floor/seating area. This is for reference and documentation purposes.
								You can skip this if you don't have exact measurements - the seat map will still work.
							</Typography>
						</Box>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Width"
							type="number"
							name="dimensions.width"
							value={formik.values.dimensions.width}
							onChange={(e) => formik.setFieldValue('dimensions.width', parseFloat(e.target.value) || 0)}
							helperText="e.g., 50 (meters or feet)"
							inputProps={{ min: 0, step: 0.1 }}
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Height / Length"
							type="number"
							name="dimensions.height"
							value={formik.values.dimensions.height}
							onChange={(e) => formik.setFieldValue('dimensions.height', parseFloat(e.target.value) || 0)}
							helperText="e.g., 80 (meters or feet)"
							inputProps={{ min: 0, step: 0.1 }}
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<FormControl fullWidth>
							<InputLabel>Unit</InputLabel>
							<Select
								name="dimensions.unit"
								value={formik.values.dimensions.unit}
								label="Unit"
								onChange={(e) => formik.setFieldValue('dimensions.unit', e.target.value)}
							>
								<MenuItem value="meters">Meters</MenuItem>
								<MenuItem value="feet">Feet</MenuItem>
							</Select>
						</FormControl>
					</Grid>

					<Grid item xs={12}>
						<Divider sx={{ my: 2 }} />
						<Box sx={{ mb: 2 }}>
							<Typography variant="subtitle1" gutterBottom>
								Layout Configuration (Optional)
							</Typography>
							<Typography variant="body2" color="textSecondary">
								These settings control how seats are spaced when generating seat maps.
								They affect the visual layout and positioning of seats in the coordinate system.
								Default values work well for most venues, but you can adjust them for tighter or looser spacing.
							</Typography>
						</Box>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Seat Spacing"
							type="number"
							name="layoutConfig.seatSpacing"
							value={formik.values.layoutConfig.seatSpacing}
							onChange={(e) => formik.setFieldValue('layoutConfig.seatSpacing', parseFloat(e.target.value) || 0.5)}
							helperText="Horizontal spacing between seats (default: 0.5)"
							inputProps={{ min: 0.1, max: 10, step: 0.1 }}
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Row Spacing"
							type="number"
							name="layoutConfig.rowSpacing"
							value={formik.values.layoutConfig.rowSpacing}
							onChange={(e) => formik.setFieldValue('layoutConfig.rowSpacing', parseFloat(e.target.value) || 0.8)}
							helperText="Vertical spacing between rows (default: 0.8)"
							inputProps={{ min: 0.1, max: 10, step: 0.1 }}
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField
							fullWidth
							label="Section Spacing"
							type="number"
							name="layoutConfig.sectionSpacing"
							value={formik.values.layoutConfig.sectionSpacing}
							onChange={(e) => formik.setFieldValue('layoutConfig.sectionSpacing', parseFloat(e.target.value) || 1.0)}
							helperText="Spacing between sections (default: 1.0)"
							inputProps={{ min: 0.1, max: 10, step: 0.1 }}
						/>
					</Grid>

					{/* SVG Background Map Section */}
					<Grid item xs={12}>
						<Divider sx={{ my: 2 }} />
						<Box sx={{ mb: 2 }}>
							<Typography variant="subtitle1" gutterBottom>
								Background SVG Map (Optional)
							</Typography>
							<Typography variant="body2" color="textSecondary">
								Load a venue map as a visual reference for section placement. This is optional and can be added anytime.
							</Typography>
						</Box>
					</Grid>

					<Grid item xs={12}>
						<Tabs value={svgInputMode} onChange={(e, newValue) => setSvgInputMode(newValue)}>
							<Tab label="Load from URL" value="url" />
							<Tab label="Upload File" value="upload" />
						</Tabs>
					</Grid>

					{svgInputMode === 'url' && (
						<>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="SVG Map URL"
									value={svgUrl}
									onChange={(e) => setSvgUrl(e.target.value)}
									placeholder="https://mapsapi.tmol.co/maps/geometry/image/..."
									helperText="Enter URL to Ticketmaster map or other SVG source"
								/>
							</Grid>
							<Grid item xs={12}>
								<Button
									variant="outlined"
									onClick={handleFetchSvg}
									disabled={!svgUrl || loadingSvg}
								>
									{loadingSvg ? <><CircularProgress size={20} sx={{ mr: 1 }} /> Fetching...</> : 'Fetch SVG'}
								</Button>
							</Grid>
						</>
					)}

					{svgInputMode === 'upload' && (
						<Grid item xs={12}>
							<Input
								type="file"
								accept=".svg,image/svg+xml"
								onChange={handleFileUpload}
							/>
							<Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
								Upload SVG file (max 5MB)
							</Typography>
						</Grid>
					)}

					{svgPreview && (
						<>
							<Grid item xs={12}>
								<Alert severity="success">
									SVG loaded successfully ({svgPreview.sourceType === 'url' ? 'from URL' : 'from file'})
								</Alert>
							</Grid>
							<Grid item xs={12} sm={6}>
								<Typography variant="subtitle2" gutterBottom>Opacity</Typography>
								<Slider
									value={formik.values.backgroundSvg.opacity * 100}
									onChange={(e, v) => formik.setFieldValue('backgroundSvg.opacity', v / 100)}
									min={0}
									max={100}
									valueLabelDisplay="auto"
									valueLabelFormat={(v) => `${v}%`}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<Typography variant="subtitle2" gutterBottom>Scale</Typography>
								<Slider
									value={formik.values.backgroundSvg.scale}
									onChange={(e, v) => formik.setFieldValue('backgroundSvg.scale', v)}
									min={0.1}
									max={3}
									step={0.1}
									valueLabelDisplay="auto"
									valueLabelFormat={(v) => `${v}x`}
								/>
							</Grid>
							<Grid item xs={12}>
								<Button onClick={handleRemoveSvg} color="error" variant="outlined">
									Remove SVG
								</Button>
							</Grid>
						</>
					)}

					<Grid item xs={12}>
						<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
							{onCancel && (
								<Button
									variant="outlined"
									onClick={onCancel}
									disabled={loading}
								>
									Cancel
								</Button>
							)}
							<Button
								type="submit"
								variant="contained"
								disabled={loading || !formik.values.name}
								startIcon={loading ? <CircularProgress size={20} /> : null}
							>
								{loading ? 'Creating...' : (venue ? 'Update Venue' : 'Create Venue')}
							</Button>
						</Box>
					</Grid>
				</Grid>
			</form>
		</Paper>
	)
}

export default VenueConfiguration

