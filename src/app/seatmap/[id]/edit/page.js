'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
	Box,
	Grid,
	Paper,
	Typography,
	CircularProgress,
	Alert,
	Button,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton,
	Chip,
	Divider
} from '@mui/material'
import { ArrowBack, Save, Edit, Settings, Refresh } from '@mui/icons-material'
import { getManifest, updateManifest, addOrUpdatePlace, deletePlace, getVenue, updateVenueSections } from '@/RESTAPIs/seatmap'
import SeatMapCanvas from '@/components/seatmap/SeatMapCanvas'
import SeatMapControls from '@/components/seatmap/SeatMapControls'
import SeatEditor from '@/components/seatmap/SeatEditor'
import Swal from 'sweetalert2'

// Configure SweetAlert2 z-index
const SwalConfig = Swal.mixin({
	didOpen: () => {
		const swalContainer = document.querySelector('.swal2-container')
		if (swalContainer) swalContainer.style.zIndex = '9999'
	}
})

/**
 * Manifest Edit Page
 * Allows editing of manifest details and individual seats
 */
const ManifestEditPage = () => {
	const params = useParams()
	const router = useRouter()
	const manifestId = params.id

	const [manifest, setManifest] = useState(null)
	const [venue, setVenue] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [saving, setSaving] = useState(false)

	// Edit manifest dialog
	const [isEditManifestDialogOpen, setIsEditManifestDialogOpen] = useState(false)
	const [manifestName, setManifestName] = useState('')

	// View state
	const [selectedSection, setSelectedSection] = useState('')
	const [priceRange, setPriceRange] = useState([0, 10000])
	const [showAvailableOnly, setShowAvailableOnly] = useState(false)
	const [zoom, setZoom] = useState(1)
	const [panX, setPanX] = useState(0)
	const [panY, setPanY] = useState(0)
	const [selectedSeats, setSelectedSeats] = useState([])
	const [editingSeat, setEditingSeat] = useState(null)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

	// Section editing
	const [editingSection, setEditingSection] = useState(null)
	const [isEditSectionDialogOpen, setIsEditSectionDialogOpen] = useState(false)
	const [sectionForm, setSectionForm] = useState({ name: '', capacity: '', basePrice: '' })

	useEffect(() => {
		if (manifestId) {
			fetchManifest()
		}
	}, [manifestId])

	const fetchManifest = async () => {
		setLoading(true)
		setError(null)
		try {
			const response = await getManifest(manifestId)
			if (response.data) {
				const manifestData = response.data.data
				setManifest(manifestData)
				setManifestName(manifestData.name || '')

				// Fetch venue data if available
				if (manifestData.venue) {
					try {
						// Extract venue ID - handle both string ID and populated venue object
						const venueId = typeof manifestData.venue === 'string'
							? manifestData.venue
							: (manifestData.venue._id || manifestData.venue.id || manifestData.venue)

						// Only fetch if we have a valid ID string
						if (venueId && typeof venueId === 'string') {
							const venueResponse = await getVenue(venueId)
							if (venueResponse.data) {
								setVenue(venueResponse.data.data)
							}
						} else if (typeof manifestData.venue === 'object' && manifestData.venue.name) {
							// If venue is already populated, use it directly
							setVenue(manifestData.venue)
						}
					} catch (venueErr) {
						console.warn('Failed to fetch venue:', venueErr)
					}
				}

				// Set price range based on manifest prices
				const prices = (manifestData.places || [])
					.map(p => p.pricing?.currentPrice || p.pricing?.basePrice || 0)
					.filter(p => p > 0)
				if (prices.length > 0) {
					setPriceRange([Math.min(...prices), Math.max(...prices)])
				}
			}
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to fetch manifest')
		} finally {
			setLoading(false)
		}
	}

	const handleSaveManifest = async () => {
		if (!manifest) return

		setSaving(true)
		try {
			await updateManifest(manifestId, {
				name: manifestName
			})
			SwalConfig.fire('Success!', 'Manifest updated successfully', 'success')
			setIsEditManifestDialogOpen(false)
			fetchManifest() // Refresh
		} catch (err) {
			SwalConfig.fire('Error!', err.response?.data?.message || 'Failed to update manifest', 'error')
		} finally {
			setSaving(false)
		}
	}

	// Get unique sections
	const sections = manifest?.places
		? [...new Set(manifest.places.map(p => p.section).filter(Boolean))]
		: []

	// Filter places based on controls
	const filteredPlaces = manifest?.places?.filter(place => {
		if (selectedSection && place.section !== selectedSection) return false
		if (showAvailableOnly && (!place.available || place.status !== 'available')) return false

		const price = place.pricing?.currentPrice || place.pricing?.basePrice || 0
		if (price < priceRange[0] || price > priceRange[1]) return false

		return true
	}) || []

	const handleSeatClick = (place) => {
		// Double-click to edit, single click to select
		setEditingSeat(place)
		setIsEditDialogOpen(true)
	}

	const handleResetView = () => {
		setZoom(1)
		setPanX(0)
		setPanY(0)
		setSelectedSeats([])
	}

	const handleExport = (format) => {
		// Export functionality would be implemented here
		console.log(`Exporting as ${format}`)
	}

	const handleEditSection = (section) => {
		// Convert to plain object if it's a Mongoose document
		const plainSection = section.toObject ? section.toObject() : JSON.parse(JSON.stringify(section))
		setEditingSection(plainSection)
		setSectionForm({
			name: plainSection.name || '',
			capacity: plainSection.capacity || '',
			basePrice: plainSection.basePrice ? (plainSection.basePrice / 100).toFixed(2) : '' // Convert from cents
		})
		setIsEditSectionDialogOpen(true)
	}

	const handleSaveSection = async () => {
		if (!venue || !editingSection || !venue._id) {
			SwalConfig.fire('Error!', 'Missing venue or section information', 'error')
			return
		}

		if (!venue.sections || !Array.isArray(venue.sections)) {
			SwalConfig.fire('Error!', 'Venue sections data is invalid', 'error')
			return
		}

		setSaving(true)
		try {
			// Convert Mongoose documents to plain objects and update the section
			const updatedSections = venue.sections.map(section => {
				// Convert to plain object if it's a Mongoose document
				let plainSection
				try {
					if (section && typeof section.toObject === 'function') {
						plainSection = section.toObject()
					} else {
						// Already a plain object, but ensure it's serializable
						plainSection = JSON.parse(JSON.stringify(section))
					}
				} catch (e) {
					// Fallback: create a new object with only the properties we need
					plainSection = {
						id: section.id || section._id?.toString(),
						name: section.name,
						type: section.type,
						capacity: section.capacity,
						basePrice: section.basePrice,
						shape: section.shape,
						bounds: section.bounds,
						polygon: section.polygon,
						color: section.color,
						strokeColor: section.strokeColor,
						opacity: section.opacity,
						rows: section.rows,
						seatsPerRow: section.seatsPerRow,
						rowConfig: section.rowConfig,
						obstructions: section.obstructions,
						displayOrder: section.displayOrder
					}
				}

				// Match by id or _id (handle both string and ObjectId)
				const sectionId = plainSection.id || plainSection._id?.toString()
				const editingId = editingSection.id || editingSection._id?.toString()

				if (sectionId === editingId || sectionId?.toString() === editingId?.toString()) {
					// Create a clean object with only the fields we need
					const updated = {
						...plainSection,
						name: sectionForm.name,
						capacity: sectionForm.capacity ? parseInt(sectionForm.capacity) : (plainSection.capacity || 0)
					}

					// Only include basePrice if it has a value
					if (sectionForm.basePrice) {
						updated.basePrice = Math.round(parseFloat(sectionForm.basePrice) * 100)
					} else if (plainSection.basePrice !== undefined) {
						updated.basePrice = plainSection.basePrice
					}

					return updated
				}
				return plainSection
			})

			// Ensure we're sending a valid JSON object - remove any undefined values
			const cleanSections = updatedSections.map(section => {
				const clean = {}
				Object.keys(section).forEach(key => {
					const value = section[key]
					// Only include defined, non-null values (except for explicitly set null values for certain fields)
					if (value !== undefined && value !== null) {
						// Handle special cases - convert ObjectId to string if needed
						if (key === '_id' && typeof value === 'object' && value.toString) {
							clean[key] = value.toString()
						} else {
							clean[key] = value
						}
					}
				})
				return clean
			})

			// Validate payload before sending
			if (!Array.isArray(cleanSections)) {
				throw new Error('Invalid sections data: not an array')
			}

			if (cleanSections.length === 0) {
				throw new Error('No sections to update')
			}

			// Ensure venue ID is a string
			const venueId = venue._id?.toString() || venue._id
			if (!venueId) {
				throw new Error('Invalid venue ID')
			}

			const payload = { sections: cleanSections }

			// Debug: Log payload to console (remove in production)
			console.log('Sending payload:', JSON.stringify(payload, null, 2))

			await updateVenueSections(venueId, payload)
			SwalConfig.fire('Success!', 'Section updated successfully', 'success')
			setIsEditSectionDialogOpen(false)
			setEditingSection(null)
			// Refresh venue data
			if (manifest?.venue) {
			// Extract venue ID - handle both string ID and populated venue object
			const venueId = typeof manifest.venue === 'string'
				? manifest.venue
				: (manifest.venue?._id || manifest.venue?.id || manifest.venue)

			if (venueId && typeof venueId === 'string') {
				const venueResponse = await getVenue(venueId)
				if (venueResponse.data) {
					setVenue(venueResponse.data.data)
				}
			} else if (typeof manifest.venue === 'object' && manifest.venue?.name) {
				// If venue is already populated, use it directly
				setVenue(manifest.venue)
			}
			}
		} catch (err) {
			SwalConfig.fire('Error!', err.response?.data?.message || 'Failed to update section', 'error')
		} finally {
			setSaving(false)
		}
	}

	const handleRefreshVenue = async () => {
		if (!manifest?.venue) return
		try {
			// Extract venue ID - handle both string ID and populated venue object
			const venueId = typeof manifest.venue === 'string'
				? manifest.venue
				: (manifest.venue?._id || manifest.venue?.id || manifest.venue)

			if (venueId && typeof venueId === 'string') {
				const venueResponse = await getVenue(venueId)
				if (venueResponse.data) {
					setVenue(venueResponse.data.data)
					SwalConfig.fire('Success!', 'Venue data refreshed', 'success')
				}
			} else if (typeof manifest.venue === 'object' && manifest.venue?.name) {
				// If venue is already populated, use it directly
				setVenue(manifest.venue)
				SwalConfig.fire('Success!', 'Venue data refreshed', 'success')
			}
		} catch (err) {
			SwalConfig.fire('Error!', 'Failed to refresh venue data', 'error')
		}
	}

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
				<CircularProgress />
			</Box>
		)
	}

	if (error) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">{error}</Alert>
				<Button
					startIcon={<ArrowBack />}
					onClick={() => router.push('/seatmap')}
					sx={{ mt: 2 }}
				>
					Back to List
				</Button>
			</Box>
		)
	}

	if (!manifest) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="warning">Manifest not found</Alert>
				<Button
					startIcon={<ArrowBack />}
					onClick={() => router.push('/seatmap')}
					sx={{ mt: 2 }}
				>
					Back to List
				</Button>
			</Box>
		)
	}

	return (
		<Box sx={{ p: 3 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
					<Button
						startIcon={<ArrowBack />}
						onClick={() => router.push('/seatmap')}
					>
						Back
					</Button>
					<Typography variant="h4">
						Edit Manifest: {manifest.name || 'Unnamed'}
					</Typography>
				</Box>
				<Button
					variant="outlined"
					onClick={() => setIsEditManifestDialogOpen(true)}
				>
					Edit Manifest Info
				</Button>
			</Box>

			<Grid container spacing={3}>
				{/* Canvas */}
				<Grid item xs={12} md={8}>
					<SeatMapCanvas
						places={filteredPlaces}
						onSeatClick={handleSeatClick}
						selectedSeats={selectedSeats}
						width={800}
						height={600}
						zoom={zoom}
						panX={panX}
						panY={panY}
						onZoomChange={setZoom}
						onPanChange={(x, y) => {
							setPanX(x)
							setPanY(y)
						}}
						venue={venue}
						showOverview={true}
					/>
				</Grid>

				{/* Controls */}
				<Grid item xs={12} md={4}>
					<SeatMapControls
						sections={sections}
						selectedSection={selectedSection}
						onSectionChange={setSelectedSection}
						priceRange={priceRange}
						onPriceRangeChange={setPriceRange}
						showAvailableOnly={showAvailableOnly}
						onAvailableOnlyChange={setShowAvailableOnly}
						zoom={zoom}
						onZoomChange={setZoom}
						onResetView={handleResetView}
						onExport={handleExport}
					/>

					{/* Section Management */}
					{venue && venue.sections && venue.sections.length > 0 && (
						<Paper elevation={2} sx={{ p: 2, mt: 2 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
								<Typography variant="h6">
									Venue Sections
								</Typography>
								<Box sx={{ display: 'flex', gap: 1 }}>
									<IconButton size="small" onClick={handleRefreshVenue} title="Refresh venue data">
										<Refresh fontSize="small" />
									</IconButton>
									<Button
										variant="contained"
										size="small"
										startIcon={<Settings />}
										onClick={() => {
											if (venue?._id) {
												router.push(`/seatmap/venue/${venue._id}/configure`)
											}
										}}
									>
										Configure Sections
									</Button>
								</Box>
							</Box>
							<TableContainer>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>Name</TableCell>
											<TableCell>Type</TableCell>
											<TableCell align="right">Capacity</TableCell>
											<TableCell align="right">Base Price</TableCell>
											<TableCell align="right">Actions</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{venue.sections.map((section) => (
											<TableRow key={section.id || section._id}>
												<TableCell>
													<Typography variant="body2" fontWeight="medium">
														{section.name}
													</Typography>
												</TableCell>
												<TableCell>
													<Chip
														label={section.type || 'seating'}
														size="small"
														variant="outlined"
													/>
												</TableCell>
												<TableCell align="right">
													{section.capacity || 'N/A'}
												</TableCell>
												<TableCell align="right">
													{section.basePrice
														? `€${(section.basePrice / 100).toFixed(2)}`
														: 'N/A'}
												</TableCell>
												<TableCell align="right">
													<IconButton
														size="small"
														onClick={() => handleEditSection(section)}
														title="Edit section"
													>
														<Edit fontSize="small" />
													</IconButton>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
							<Alert severity="info" sx={{ mt: 2 }}>
								Use "Configure Sections" for advanced editing (shapes, obstructions, row configuration).
							</Alert>
						</Paper>
					)}

					{/* Manifest Info */}
					<Paper elevation={2} sx={{ p: 2, mt: 2 }}>
						<Typography variant="h6" gutterBottom>
							Manifest Info
						</Typography>
						<Typography variant="body2" color="textSecondary">
							Total Places: {manifest.places?.length || 0}
						</Typography>
						<Typography variant="body2" color="textSecondary">
							Version: {manifest.version || 1}
						</Typography>
						<Typography variant="body2" color="textSecondary">
							Layout: {manifest.layoutAlgorithm || 'N/A'}
						</Typography>
						<Typography variant="body2" color="textSecondary">
							Coordinate Source: {manifest.coordinateSource || 'N/A'}
						</Typography>
						{venue && (
							<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
								Venue: {venue.name || 'N/A'}
							</Typography>
						)}
						<Button
							variant="outlined"
							size="small"
							fullWidth
							onClick={() => router.push(`/seatmap/${manifestId}`)}
							sx={{ mt: 2 }}
						>
							View Mode
						</Button>
					</Paper>
				</Grid>
			</Grid>

			{/* Edit Manifest Dialog */}
			<Dialog
				open={isEditManifestDialogOpen}
				onClose={() => setIsEditManifestDialogOpen(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Edit Manifest</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						label="Manifest Name"
						fullWidth
						variant="outlined"
						value={manifestName}
						onChange={(e) => setManifestName(e.target.value)}
						sx={{ mt: 2 }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsEditManifestDialogOpen(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleSaveManifest}
						variant="contained"
						startIcon={<Save />}
						disabled={saving}
					>
						{saving ? 'Saving...' : 'Save'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Edit Section Dialog */}
			<Dialog
				open={isEditSectionDialogOpen}
				onClose={() => {
					setIsEditSectionDialogOpen(false)
					setEditingSection(null)
				}}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Edit Section: {editingSection?.name}</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						label="Section Name"
						fullWidth
						variant="outlined"
						value={sectionForm.name}
						onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
						sx={{ mt: 2 }}
					/>
					<TextField
						margin="dense"
						label="Capacity"
						type="number"
						fullWidth
						variant="outlined"
						value={sectionForm.capacity}
						onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
						inputProps={{ min: 0 }}
						helperText="Expected number of seats in this section"
					/>
					<TextField
						margin="dense"
						label="Base Price (€)"
						type="number"
						fullWidth
						variant="outlined"
						value={sectionForm.basePrice}
						onChange={(e) => setSectionForm({ ...sectionForm, basePrice: e.target.value })}
						inputProps={{ min: 0, step: 0.01 }}
						helperText="Base price for seats in this section (in euros)"
					/>
					<Alert severity="info" sx={{ mt: 2 }}>
						For advanced configuration (shapes, obstructions, row settings), use the "Configure Sections" button.
					</Alert>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => {
						setIsEditSectionDialogOpen(false)
						setEditingSection(null)
					}}>
						Cancel
					</Button>
					<Button
						onClick={handleSaveSection}
						variant="contained"
						startIcon={<Save />}
						disabled={saving || !sectionForm.name}
					>
						{saving ? 'Saving...' : 'Save'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Seat Editor Dialog */}
			<SeatEditor
				open={isEditDialogOpen}
				place={editingSeat}
				onClose={() => {
					setIsEditDialogOpen(false)
					setEditingSeat(null)
				}}
				onSave={async (placeData) => {
					try {
						await addOrUpdatePlace(manifestId, placeData)
						SwalConfig.fire('Success!', 'Seat updated successfully', 'success')
						fetchManifest() // Refresh
						setIsEditDialogOpen(false)
						setEditingSeat(null)
					} catch (err) {
						SwalConfig.fire('Error!', err.response?.data?.message || 'Failed to update seat', 'error')
					}
				}}
				onDelete={async () => {
					if (!editingSeat) return
					const result = await SwalConfig.fire({
						title: 'Are you sure?',
						text: `Delete seat ${editingSeat.placeId}?`,
						icon: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#d33',
						cancelButtonColor: '#3085d6',
						confirmButtonText: 'Yes, delete it!'
					})

					if (result.isConfirmed) {
						try {
							await deletePlace(manifestId, editingSeat.placeId)
							SwalConfig.fire('Deleted!', 'Seat has been deleted.', 'success')
							fetchManifest() // Refresh
							setIsEditDialogOpen(false)
							setEditingSeat(null)
						} catch (err) {
							SwalConfig.fire('Error!', err.response?.data?.message || 'Failed to delete seat', 'error')
						}
					}
				}}
			/>
		</Box>
	)
}

export default ManifestEditPage

