'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
	Box,
	Paper,
	Typography,
	Button,
	Grid,
	Alert,
	CircularProgress,
	Container,
	Tabs,
	Tab,
	TextField,
	FormControlLabel,
	Checkbox,
	FormControl,
	FormLabel,
	RadioGroup,
	Radio
} from '@mui/material'
import { ArrowBack, ViewList, EventSeat, Refresh, Add } from '@mui/icons-material'
import { getVenueById, updateVenueSections, getManifestsByVenue, updateManifest, updateVenue, generateManifest } from '@/RESTAPIs/seatmap'
import SectionEditorContent from '@/components/seatmap/SectionEditorContent'
import SeatMapViewer from '@/components/seatmap/SeatMapViewer'
import Swal from 'sweetalert2'

// Configure SweetAlert2 to appear above MUI components
const SwalConfig = Swal.mixin({
	didOpen: () => {
		const swalContainer = document.querySelector('.swal2-container')
		if (swalContainer) {
			swalContainer.style.zIndex = '9999'
		}
	}
})

/**
 * Venue Section Configuration Page
 * Full-page interface for configuring venue sections
 */
const VenueConfigurePage = () => {
	const router = useRouter()
	const params = useParams()
	const venueId = params.venueId

	const [venue, setVenue] = useState(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState(null)
	const [activeTab, setActiveTab] = useState(0) // 0: Sections, 1: Seats
	const [manifest, setManifest] = useState(null)
	const [loadingManifest, setLoadingManifest] = useState(false)
	const [manifestFetched, setManifestFetched] = useState(false) // Track if we've already tried to fetch manifest
	// Background SVG alignment config (stored on venue.backgroundSvg)
	const [bgSvgConfig, setBgSvgConfig] = useState({
		translateX: 0,
		translateY: 0,
		scale: 1.0
	})
	// Display config for seats (now persisted to venue.backgroundSvg.displayConfig)
	const [displayConfig, setDisplayConfig] = useState({
		dotSize: 8,
		rowGap: 10,
		seatGap: 12
	})
	// Toggle for showing section polygons in seat map viewer
	const [showSections, setShowSections] = useState(true)
	// State for manifest generation
	const [generating, setGenerating] = useState(false)
	// Place ID generation pattern selection
	const [placePattern, setPlacePattern] = useState('sequential')

	useEffect(() => {
		if (venueId) {
			fetchVenue()
		}
	}, [venueId])

	// Load manifest when venue is loaded (so seats show up in Sections & Layout tab)
	// Use manifestFetched flag to prevent infinite loop when no manifest exists
	useEffect(() => {
		if (venueId && venue && !manifest && !loadingManifest && !manifestFetched) {
			fetchManifest()
		}
	}, [venueId, venue, manifest, loadingManifest, manifestFetched])

	const fetchVenue = async () => {
		setLoading(true)
		setError(null)
		try {
			const response = await getVenueById(venueId)
			if (response.data && response.data.data) {
				const venueData = response.data.data
				setVenue(venueData)
				// Load background SVG config from venue
				if (venueData.backgroundSvg) {
					setBgSvgConfig({
						translateX: venueData.backgroundSvg.translateX || 0,
						translateY: venueData.backgroundSvg.translateY || 0,
						scale: venueData.backgroundSvg.scale || 1.0
					})
					// Load display config from venue if it exists
					if (venueData.backgroundSvg.displayConfig) {
						setDisplayConfig({
							dotSize: venueData.backgroundSvg.displayConfig.dotSize || 8,
							rowGap: venueData.backgroundSvg.displayConfig.rowGap || 10,
							seatGap: venueData.backgroundSvg.displayConfig.seatGap || 12
						})
					}
				}
			} else {
				setError('Venue not found')
			}
		} catch (err) {
			console.error('Failed to fetch venue:', err)
			setError(err.response?.data?.message || 'Failed to load venue')
		} finally {
			setLoading(false)
		}
	}

	const fetchManifest = async () => {
		setLoadingManifest(true)
		try {
			console.log('Fetching manifests for venue:', venueId)
			const response = await getManifestsByVenue(venueId)
			console.log('Manifest response:', response)

			if (response.data && response.data.data && response.data.data.length > 0) {
				// Get the latest manifest
				const latestManifest = response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
				console.log('Latest manifest:', latestManifest)
				console.log('Manifest keys:', Object.keys(latestManifest))
				console.log('Manifest has id:', latestManifest.id, '_id:', latestManifest._id)
				setManifest(latestManifest)
			} else {
				console.log('No manifests found')
				setManifest(null)
			}
		} catch (err) {
			console.error('Failed to fetch manifest:', err)
			setManifest(null)
		} finally {
			setLoadingManifest(false)
			setManifestFetched(true) // Mark that we've attempted to fetch (prevents infinite loop when no manifest exists)
		}
	}

	const handleSave = async (config, silent = false) => {
		if (!venueId) return

		setSaving(true)
		try {
			await updateVenueSections(venueId, config)
			if (!silent) {
				SwalConfig.fire({
					title: 'Success!',
					text: 'Section configuration saved successfully',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				})
			}
			// Refresh venue data
			await fetchVenue()
		} catch (err) {
			console.error('Failed to save configuration:', err)
			if (!silent) {
				SwalConfig.fire({
					title: 'Error!',
					text: err.response?.data?.message || 'Failed to save section configuration',
					icon: 'error'
				})
			}
		} finally {
			setSaving(false)
		}
	}

	const handleGenerateManifest = async (isRegenerate = false) => {
		if (!venueId || !venue) return

		// Check if venue has sections configured
		const hasSections = venue.sections && venue.sections.length > 0
		if (!hasSections) {
			SwalConfig.fire({
				title: 'No Sections Configured',
				text: 'Please configure at least one section before generating a manifest.',
				icon: 'warning'
			})
			return
		}

		// Confirm regeneration if manifest exists
		if (isRegenerate) {
			const result = await SwalConfig.fire({
				title: 'Regenerate Manifest?',
				html: `
					<p>This will <strong>regenerate all seats</strong> based on current section configuration.</p>
					<p style="color: #d32f2f; margin-top: 10px;">⚠️ Any manual seat adjustments will be lost.</p>
				`,
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#d32f2f',
				confirmButtonText: 'Yes, Regenerate',
				cancelButtonText: 'Cancel'
			})
			if (!result.isConfirmed) return
		}

		setGenerating(true)
		try {
			// Calculate total capacity from sections
			const totalCapacity = venue.sections.reduce((sum, section) => {
				return sum + (section.capacity || 0)
			}, 0)

			if (totalCapacity === 0) {
				SwalConfig.fire({
					title: 'No Capacity Defined',
					text: 'Please set capacity for at least one section before generating a manifest.',
					icon: 'warning'
				})
				return
			}

			const response = await generateManifest({
				venueId,
				layoutAlgorithm: 'manual', // Use manual layout based on venue sections
				totalPlaces: totalCapacity,
				placeGeneration: {
					prefix: '',
					pattern: placePattern
				}
			})

			if (response.data) {
				SwalConfig.fire({
					title: 'Success!',
					text: `Manifest ${isRegenerate ? 'regenerated' : 'generated'} successfully with ${response.data.data?.places?.length || totalCapacity} seats.`,
					icon: 'success',
					timer: 2500,
					showConfirmButton: false
				})

				// Refresh manifest and switch to View Seats tab
				setManifestFetched(false)
				setManifest(null)
				await fetchManifest()
				setActiveTab(1) // Switch to View Seats tab
			}
		} catch (err) {
			console.error('Failed to generate manifest:', err)
			SwalConfig.fire({
				title: 'Error!',
				text: err.response?.data?.message || 'Failed to generate manifest. Please try again.',
				icon: 'error'
			})
		} finally {
			setGenerating(false)
		}
	}

	const handleSaveManifest = async (changes) => {
		console.log('handleSaveManifest', changes, manifest)
		const manifestId = manifest?.id || manifest?._id
		if (!manifestId) {
			console.error('No manifest ID available')
			return
		}

		setSaving(true)
		try {
			// Prepare update data with modified sections and places
			const updateData = {
				...manifest,
				sections: changes.sections,
				places: changes.places,
				updatedAt: new Date().toISOString()
			}

			await updateManifest(manifestId, updateData)
			SwalConfig.fire({
				title: 'Success!',
				text: 'Seat map adjustments saved successfully',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			})

			// Refresh manifest data
			await fetchManifest()
		} catch (err) {
			console.error('Failed to save manifest changes:', err)
			SwalConfig.fire({
				title: 'Error!',
				text: err.response?.data?.message || 'Failed to save seat map adjustments',
				icon: 'error'
			})
		} finally {
			setSaving(false)
		}
	}

	const applyBgSvgConfig = async () => {
		console.log('applyBgSvgConfig called')
		console.log('Current bgSvgConfig:', bgSvgConfig)
		console.log('Current venue.backgroundSvg:', venue?.backgroundSvg)

		if (!venueId) {
			console.error('No venue ID available')
			return
		}

		if (!venue?.backgroundSvg?.svgContent) {
			console.error('No existing backgroundSvg.svgContent found - aborting to prevent data loss')
			SwalConfig.fire({
				title: 'Error!',
				text: 'Cannot save: no background SVG content found. Please upload a background SVG first.',
				icon: 'error'
			})
			return
		}

		setSaving(true)
		try {
			// Update alignment fields AND display config, preserving all existing backgroundSvg properties
			const existingBgSvg = venue.backgroundSvg
			const updateData = {
				backgroundSvg: {
					svgContent: existingBgSvg.svgContent,
					fileName: existingBgSvg.fileName,
					opacity: existingBgSvg.opacity,
					rotation: existingBgSvg.rotation,
					// Update the alignment fields
					translateX: bgSvgConfig.translateX,
					translateY: bgSvgConfig.translateY,
					scale: bgSvgConfig.scale,
					// Save display config for consistent rendering on customer app
					displayConfig: {
						dotSize: displayConfig.dotSize,
						rowGap: displayConfig.rowGap,
						seatGap: displayConfig.seatGap
					}
				}
			}

			console.log('Saving backgroundSvg update:', updateData)
			await updateVenue(venueId, updateData)

			SwalConfig.fire({
				title: 'Success!',
				text: 'Background alignment and display settings saved successfully',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			})

			// Refresh venue data
			await fetchVenue()
		} catch (err) {
			console.error('Failed to apply background config:', err)
			SwalConfig.fire({
				title: 'Error!',
				text: err.response?.data?.message || 'Failed to save background alignment',
				icon: 'error'
			})
		} finally {
			setSaving(false)
		}
	}

	const handleBack = () => {
		router.back()
	}

	if (loading) {
		return (
			<Container maxWidth="xl" sx={{ py: 4 }}>
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
					<CircularProgress />
				</Box>
			</Container>
		)
	}

	if (error || !venue) {
		return (
			<Container maxWidth="xl" sx={{ py: 4 }}>
				<Alert severity="error" sx={{ mb: 2 }}>
					{error || 'Venue not found'}
				</Alert>
				<Button startIcon={<ArrowBack />} onClick={handleBack}>
					Go Back
				</Button>
			</Container>
		)
	}

	return (
		<Container maxWidth="xl" sx={{ py: 4 }}>
			{/* Header */}
			<Box sx={{ mb: 4 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
					<Button
						startIcon={<ArrowBack />}
						onClick={handleBack}
						variant="outlined"
					>
						Back
					</Button>
					<Typography variant="h4" component="h1">
						Configure Sections: {venue.name}
					</Typography>
				</Box>
				<Typography variant="body1" color="textSecondary">
					Define sections where seats will be placed. Configure the central feature (rink, stage, etc.) and draw section boundaries on the canvas.
				</Typography>
			</Box>

			{/* Main Content */}
			<Paper sx={{ mb: 3 }}>
				<Tabs
					value={activeTab}
					onChange={(_, newValue) => setActiveTab(newValue)}
					indicatorColor="primary"
					textColor="primary"
					variant="fullWidth"
				>
					<Tab
						icon={<ViewList />}
						label="Sections & Layout"
						iconPosition="start"
					/>
					<Tab
						icon={<EventSeat />}
						label="View Seats"
						iconPosition="start"
					/>
				</Tabs>
			</Paper>

			{/* Tab Content */}
			{activeTab === 0 && (
				<>
					<SectionEditorContent
						venue={venue}
						manifest={manifest}
						onSave={handleSave}
						saving={saving}
					/>
					{/* Generate Manifest Button - shown after sections are configured */}
					{venue?.sections?.length > 0 && (
						<Paper sx={{ p: 3, mt: 3 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<Box sx={{ flex: 1 }}>
									<Typography variant="h6" gutterBottom>
										Generate Seat Manifest
									</Typography>
									<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
										{manifest
											? `Current manifest has ${manifest.places?.length || 0} seats. Regenerate to apply section changes.`
											: 'Generate seats based on your section configuration.'
										}
									</Typography>

									{/* Place ID Pattern Selection */}
									<FormControl component="fieldset" sx={{ mb: 2 }}>
										<FormLabel component="legend" sx={{ mb: 1, fontWeight: 'medium' }}>
											Place ID Pattern
										</FormLabel>
										<RadioGroup
											row
											value={placePattern}
											onChange={(e) => setPlacePattern(e.target.value)}
											sx={{ gap: 2 }}
										>
											<FormControlLabel
												value="sequential"
												control={<Radio />}
												label={
													<Box>
														<Typography variant="body2" fontWeight="medium">Sequential</Typography>
														<Typography variant="caption" color="textSecondary">
															Place IDs: 1, 2, 3, 4, 5...
														</Typography>
													</Box>
												}
											/>
											<FormControlLabel
												value="grid"
												control={<Radio />}
												label={
													<Box>
														<Typography variant="body2" fontWeight="medium">Grid-based</Typography>
														<Typography variant="caption" color="textSecondary">
															Place IDs: Section-Row-Seat format
														</Typography>
													</Box>
												}
											/>
										</RadioGroup>
									</FormControl>
								</Box>
								<Button
									variant="contained"
									color={manifest ? 'warning' : 'primary'}
									startIcon={generating ? <CircularProgress size={20} color="inherit" /> : (manifest ? <Refresh /> : <Add />)}
									onClick={() => handleGenerateManifest(!!manifest)}
									disabled={generating || saving}
									sx={{ minWidth: 180 }}
								>
									{generating ? 'Generating...' : (manifest ? 'Regenerate Manifest' : 'Generate Manifest')}
								</Button>
							</Box>
						</Paper>
					)}
				</>
			)}

			{activeTab === 1 && (
				<Box>
					<Typography variant="h6" gutterBottom>
						Seat Map Overview
					</Typography>
					<Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
						View all generated seats for this venue. This shows how the seating layout appears to customers.
					</Typography>

					{loadingManifest ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
							<CircularProgress />
							<Typography sx={{ ml: 2 }}>Loading seat map...</Typography>
						</Box>
					) : manifest ? (
						<Paper sx={{ p: 2 }}>
							<Grid container spacing={2}>
								<Grid item xs={12} md={3}>
									<Box sx={{ mb: 2 }}>
										<Typography variant="subtitle2" gutterBottom>
											Manifest Statistics
										</Typography>
										<Typography variant="body2">
											<strong>Total Seats:</strong> {manifest.places?.length || 0}
										</Typography>
										<Typography variant="body2">
											<strong>Sections:</strong> {manifest.sections?.length || 0}
										</Typography>
										<Typography variant="body2">
											<strong>Version:</strong> {manifest.version || 'N/A'}
										</Typography>
										<Typography variant="body2">
											<strong>Last Updated:</strong> {manifest.updatedAt ? new Date(manifest.updatedAt).toLocaleString() : 'N/A'}
										</Typography>
									</Box>

									{/* Place ID Pattern Selection */}
									<Box sx={{ mb: 2 }}>
										<Typography variant="subtitle2" gutterBottom>
											Regenerate Options
										</Typography>
										<FormControl component="fieldset" size="small">
											<FormLabel component="legend" sx={{ mb: 1, fontSize: '0.75rem' }}>
												Place ID Pattern
											</FormLabel>
											<RadioGroup
												value={placePattern}
												onChange={(e) => setPlacePattern(e.target.value)}
												sx={{ gap: 1 }}
											>
												<FormControlLabel
													value="sequential"
													control={<Radio size="small" />}
													label={
														<Box>
															<Typography variant="caption" fontWeight="medium">Sequential</Typography>
															<Typography variant="caption" color="textSecondary" display="block">
																1, 2, 3, 4...
															</Typography>
														</Box>
													}
													sx={{ mr: 0 }}
												/>
												<FormControlLabel
													value="grid"
													control={<Radio size="small" />}
													label={
														<Box>
															<Typography variant="caption" fontWeight="medium">Grid-based</Typography>
															<Typography variant="caption" color="textSecondary" display="block">
																Section-Row-Seat
															</Typography>
														</Box>
													}
													sx={{ mr: 0 }}
												/>
											</RadioGroup>
										</FormControl>
									</Box>

									<Button
										variant="outlined"
										color="warning"
										size="small"
										startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
										onClick={() => handleGenerateManifest(true)}
										disabled={generating || saving}
										fullWidth
									>
										{generating ? 'Regenerating...' : 'Regenerate Manifest'}
									</Button>
								</Grid>
								<Grid item xs={12} md={9}>
									<Box sx={{ mb: 2 }}>
										<Typography variant="subtitle2" gutterBottom>
											Background Alignment Controls
										</Typography>
										<Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
											Adjust background SVG position to align with seats. Changes save to venue configuration.
										</Typography>
										<Grid container spacing={2} sx={{ mb: 2 }}>
											<Grid item xs={6} sm={3}>
												<TextField
													label="Translate X"
													type="number"
													size="small"
													value={bgSvgConfig.translateX}
													onChange={(e) => setBgSvgConfig(prev => ({ ...prev, translateX: parseInt(e.target.value) || 0 }))}
													inputProps={{ min: -500, max: 500 }}
												/>
											</Grid>
											<Grid item xs={6} sm={3}>
												<TextField
													label="Translate Y"
													type="number"
													size="small"
													value={bgSvgConfig.translateY}
													onChange={(e) => setBgSvgConfig(prev => ({ ...prev, translateY: parseInt(e.target.value) || 0 }))}
													inputProps={{ min: -500, max: 500 }}
												/>
											</Grid>
											<Grid item xs={6} sm={3}>
												<TextField
													label="Scale"
													type="number"
													size="small"
													value={bgSvgConfig.scale}
													onChange={(e) => setBgSvgConfig(prev => ({ ...prev, scale: parseFloat(e.target.value) || 1.0 }))}
													inputProps={{ min: 0.1, max: 5, step: 0.1 }}
												/>
											</Grid>
											<Grid item xs={6} sm={3}>
												<Button
													variant="outlined"
													size="small"
													onClick={() => setBgSvgConfig({ translateX: 0, translateY: 0, scale: 1.0 })}
													fullWidth
												>
													Reset
												</Button>
											</Grid>
										</Grid>
										<Grid container spacing={2} sx={{ mb: 2 }}>
											<Typography variant="subtitle2" sx={{ width: '100%', px: 1, mt: 1 }}>
												Display Settings
											</Typography>
											<Grid item xs={6} sm={3}>
												<TextField
													label="Dot Size"
													type="number"
													size="small"
													value={displayConfig.dotSize}
													onChange={(e) => setDisplayConfig(prev => ({ ...prev, dotSize: parseInt(e.target.value) || 4 }))}
													inputProps={{ min: 2, max: 20 }}
												/>
											</Grid>
											<Grid item xs={6} sm={3}>
												<TextField
													label="Row Gap"
													type="number"
													size="small"
													value={displayConfig.rowGap}
													onChange={(e) => setDisplayConfig(prev => ({ ...prev, rowGap: parseFloat(e.target.value) || 8 }))}
													inputProps={{ min: 0.1, max: 50, step: 0.1 }}
												/>
											</Grid>
											<Grid item xs={6} sm={3}>
												<TextField
													label="Seat Gap"
													type="number"
													size="small"
													value={displayConfig.seatGap}
													onChange={(e) => setDisplayConfig(prev => ({ ...prev, seatGap: parseFloat(e.target.value) || 8 }))}
													inputProps={{ min: 0.1, max: 50, step: 0.1 }}
												/>
											</Grid>
											<Grid item xs={6} sm={3}>
												<Button
													variant="contained"
													size="small"
													onClick={() => applyBgSvgConfig()}
													disabled={saving}
													color="primary"
													fullWidth
												>
													{saving ? 'Saving...' : 'Save Alignment'}
												</Button>
											</Grid>
										</Grid>
									</Box>

									<Box sx={{ mb: 2 }}>
										<FormControlLabel
											control={
												<Checkbox
													checked={showSections}
													onChange={(e) => setShowSections(e.target.checked)}
													size="small"
												/>
											}
											label="Show section boundaries"
										/>
									</Box>

									<SeatMapViewer
										manifest={manifest}
										venue={venue}
										width={800}
										height={600}
										onSave={handleSaveManifest}
										saving={saving}
										bgSvgConfig={bgSvgConfig}
										displayConfig={displayConfig}
										onBgSvgConfigChange={setBgSvgConfig}
										simpleMode={true}
										showSections={showSections}
									/>
								</Grid>
							</Grid>
						</Paper>
					) : (
						<Paper sx={{ p: 4, textAlign: 'center' }}>
							<EventSeat sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
							<Typography variant="h6" gutterBottom>
								No Seat Manifest Found
							</Typography>
							<Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
								{venue?.sections?.length > 0
									? 'Your sections are configured. Generate a manifest to create seats based on your section configuration.'
									: 'Configure sections in the "Sections & Layout" tab first, then generate a manifest.'
								}
							</Typography>
							{venue?.sections?.length > 0 ? (
								<Button
									variant="contained"
									color="primary"
									size="large"
									startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <Add />}
									onClick={() => handleGenerateManifest(false)}
									disabled={generating}
								>
									{generating ? 'Generating...' : 'Generate Manifest'}
								</Button>
							) : (
								<Button
									variant="outlined"
									color="primary"
									startIcon={<ViewList />}
									onClick={() => setActiveTab(0)}
								>
									Go to Sections & Layout
								</Button>
							)}
						</Paper>
					)}
				</Box>
			)}
		</Container>
	)
}

export default VenueConfigurePage

