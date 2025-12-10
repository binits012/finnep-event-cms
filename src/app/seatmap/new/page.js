'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
	Box,
	Grid,
	Paper,
	Typography,
	Button,
	CircularProgress,
	Alert,
	IconButton,
	TextField,
	InputAdornment,
	Pagination
} from '@mui/material'
import { ArrowBack, Edit, Delete, Settings, Search } from '@mui/icons-material'
import { createManifest, getVenues, createVenue, updateVenueSections, updateVenue, deleteVenue } from '@/RESTAPIs/seatmap'
import VenueConfiguration from '@/components/seatmap/VenueConfiguration'
import TicketmasterImport from '@/components/seatmap/TicketmasterImport'
import {
	Dialog,
	DialogTitle,
	DialogContent
} from '@mui/material'
import Swal from 'sweetalert2'

// Configure SweetAlert2 z-index
const SwalConfig = Swal.mixin({
	didOpen: () => {
		const swalContainer = document.querySelector('.swal2-container')
		if (swalContainer) swalContainer.style.zIndex = '9999'
	}
})

/**
 * Create New Manifest Page
 */
const NewManifestPage = () => {
	const router = useRouter()
	const { user } = useSelector((state) => state.auth)
	const [step, setStep] = useState(1) // 1: Select/Create Venue, 2: Import/Create Manifest
	const [selectedVenue, setSelectedVenue] = useState(null)
	const [venues, setVenues] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [editingVenue, setEditingVenue] = useState(null)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [saving, setSaving] = useState(false)

	// Search and pagination state
	const [searchQuery, setSearchQuery] = useState('')
	const [searchInput, setSearchInput] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [pagination, setPagination] = useState({ total: 0, totalPages: 1, hasMore: false })
	const [venuesLoading, setVenuesLoading] = useState(false)
	const VENUES_PER_PAGE = 10

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchQuery(searchInput)
			setCurrentPage(1) // Reset to first page on search
		}, 300)
		return () => clearTimeout(timer)
	}, [searchInput])

	// Fetch venues when search or page changes
	useEffect(() => {
		fetchVenues()
	}, [searchQuery, currentPage])

	const fetchVenues = async () => {
		setVenuesLoading(true)
		try {
			const response = await getVenues({
				search: searchQuery,
				page: currentPage,
				limit: VENUES_PER_PAGE
			})
			if (response.data) {
				setVenues(response.data.data || [])
				setPagination(response.data.pagination || { total: 0, totalPages: 1, hasMore: false })
			}
		} catch (err) {
			console.error('Failed to fetch venues:', err)
		} finally {
			setVenuesLoading(false)
		}
	}

	const handleVenueSelect = (venue) => {
		setSelectedVenue(venue)
		setStep(2)
	}

	const handleVenueCreate = async (venueData) => {
		setLoading(true)
		try {
			// Venues don't require merchant association
			// Only include merchant if available from user context
			const merchantId = user?.result?.merchant?._id ||
			                   user?.result?.merchant ||
			                   user?.merchant?._id ||
			                   user?.merchant ||
			                   user?.merchantId

			// Build venue data - only include merchant if it exists
			const venuePayload = { ...venueData }
			if (merchantId) {
				venuePayload.merchant = merchantId
			}

			const response = await createVenue(venuePayload)
			if (response.data) {
				const newVenue = response.data.data
				setSelectedVenue(newVenue)
				setVenues([...venues, newVenue])
				setStep(2)
				SwalConfig.fire('Success!', 'Venue created successfully', 'success')
			}
		} catch (err) {
            console.error("error creating venue", err)
			SwalConfig.fire('Error!', err.response?.data?.message || 'Failed to create venue', 'error')
		} finally {
			setLoading(false)
		}
	}

	const handleManifestCreated = (manifest) => {
		SwalConfig.fire('Success!', 'Manifest created successfully', 'success')
		router.push(`/seatmap/${manifest._id}`)
	}

	const handleEditVenue = (venue, e) => {
		e.stopPropagation() // Prevent selecting the venue
		setEditingVenue(venue)
		setIsEditDialogOpen(true)
	}

	const handleSaveVenue = async (venueData) => {
		if (!editingVenue) {
			SwalConfig.fire('Error!', 'No venue selected for editing', 'error')
			return
		}

		setSaving(true)
		try {
			const response = await updateVenue(editingVenue._id, venueData)
			SwalConfig.fire('Success!', 'Venue updated successfully', 'success')
			setIsEditDialogOpen(false)
			setEditingVenue(null)
			fetchVenues()
			// Update selectedVenue if it was the one being edited
			if (selectedVenue && selectedVenue._id === editingVenue._id) {
				const updatedVenue = response.data?.data || { ...selectedVenue, ...venueData }
				setSelectedVenue(updatedVenue)
			}
		} catch (err) {
			SwalConfig.fire('Error!', err.response?.data?.message || 'Failed to update venue', 'error')
		} finally {
			setSaving(false)
		}
	}

	const handleDeleteVenue = async (venue, e) => {
		e.stopPropagation() // Prevent selecting the venue
		const result = await SwalConfig.fire({
			title: 'Are you sure?',
			text: `Delete venue "${venue.name}"? This will also delete all associated sections and may affect manifests using this venue.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!'
		})

		if (result.isConfirmed) {
			try {
				await deleteVenue(venue._id)
				SwalConfig.fire('Deleted!', 'Venue has been deleted.', 'success')
				fetchVenues()
				// Clear selected venue if it was deleted
				if (selectedVenue && selectedVenue._id === venue._id) {
					setSelectedVenue(null)
					setStep(1)
				}
			} catch (err) {
				SwalConfig.fire('Error!', err.response?.data?.message || 'Failed to delete venue', 'error')
			}
		}
	}

	const handleConfigureSections = (venueId, e) => {
		if (e) e.stopPropagation() // Prevent selecting the venue
		router.push(`/seatmap/venue/${venueId}/configure`)
	}

	const handleSectionConfigSave = async (config) => {
		if (!selectedVenue) return

		setLoading(true)
		try {
			await updateVenueSections(selectedVenue._id, config)
			SwalConfig.fire('Success!', 'Section configuration saved', 'success')
			// Refresh venue data
			fetchVenues()
			const updatedVenue = venues.find(v => v._id === selectedVenue._id)
			if (updatedVenue) {
				setSelectedVenue(updatedVenue)
			}
		} catch (err) {
			SwalConfig.fire('Error!', err.response?.data?.message || 'Failed to save section configuration', 'error')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Box sx={{ p: 3 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
				<Button
					startIcon={<ArrowBack />}
					onClick={() => router.push('/seatmap')}
				>
					Back
				</Button>
				<Typography variant="h4">Create New Manifest</Typography>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			{/* Step Indicator */}
			<Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
				<Typography variant="body1" fontWeight="bold">
					Step {step} of 2: {step === 1 ? 'Select or Create a Venue' : 'Generate Seat Map Manifest'}
				</Typography>
				<Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
					{step === 1
						? 'First, choose an existing venue or create a new one. A venue represents a physical location where events take place.'
						: 'Now generate a seat map manifest for the selected venue. This will create the seating layout and pricing structure.'}
				</Typography>
			</Paper>

			{step === 1 && (
				<Grid container spacing={3}>
					<Grid item xs={12} md={6}>
						<Paper elevation={2} sx={{ p: 3 }}>
							<Typography variant="h6" gutterBottom>
								Select Existing Venue
							</Typography>
							<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
								Search for a venue or create a new one on the right.
							</Typography>

							{/* Search Bar */}
							<TextField
								fullWidth
								size="small"
								placeholder="Search venues by name..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								sx={{ mb: 2 }}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<Search color="action" />
										</InputAdornment>
									)
								}}
							/>

							{venuesLoading ? (
								<Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
									<CircularProgress size={24} />
								</Box>
							) : venues.length === 0 ? (
								<Alert severity="info">
									{searchQuery
										? `No venues found matching "${searchQuery}". Try a different search or create a new venue.`
										: 'No venues found. Please create a new venue using the form on the right.'
									}
								</Alert>
							) : (
								<>
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
										{venues.map((venue) => (
											<Box
												key={venue._id}
												sx={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													p: 1,
													border: 1,
													borderColor: 'divider',
													borderRadius: 1,
													'&:hover': {
														bgcolor: 'action.hover'
													}
												}}
											>
												<Button
													variant="text"
													onClick={() => handleVenueSelect(venue)}
													sx={{
														flex: 1,
														justifyContent: 'flex-start',
														textTransform: 'none',
														textAlign: 'left'
													}}
												>
													{venue.name} ({venue.venueType})
												</Button>
												<Box sx={{ display: 'flex', gap: 0.5 }}>
													<IconButton
														size="small"
														onClick={(e) => handleConfigureSections(venue._id, e)}
														title="Configure Sections"
														color="primary"
													>
														<Settings fontSize="small" />
													</IconButton>
													<IconButton
														size="small"
														onClick={(e) => handleEditVenue(venue, e)}
														title="Edit Venue Name"
														color="primary"
													>
														<Edit fontSize="small" />
													</IconButton>
													<IconButton
														size="small"
														onClick={(e) => handleDeleteVenue(venue, e)}
														title="Delete Venue"
														color="error"
													>
														<Delete fontSize="small" />
													</IconButton>
												</Box>
											</Box>
										))}
									</Box>

									{/* Pagination */}
									{pagination.totalPages > 1 && (
										<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
											<Typography variant="body2" color="textSecondary">
												{pagination.total} venue{pagination.total !== 1 ? 's' : ''} found
											</Typography>
											<Pagination
												count={pagination.totalPages}
												page={currentPage}
												onChange={(e, page) => setCurrentPage(page)}
												size="small"
												color="primary"
											/>
										</Box>
									)}
								</>
							)}
						</Paper>
					</Grid>

					<Grid item xs={12} md={6}>
						<VenueConfiguration
							onSubmit={handleVenueCreate}
							onCancel={() => router.push('/seatmap')}
							loading={loading}
						/>
					</Grid>
				</Grid>
			)}

			{step === 2 && selectedVenue && (
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<Paper elevation={2} sx={{ p: 2, mb: 2 }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
								<Box>
									<Typography variant="body1" gutterBottom>
										Selected Venue: <strong>{selectedVenue.name}</strong>
									</Typography>
									<Typography variant="body2" color="textSecondary">
										{selectedVenue.sections?.length || 0} section{selectedVenue.sections?.length !== 1 ? 's' : ''} configured
									</Typography>
									{(!selectedVenue.sections || selectedVenue.sections.length === 0) && (
										<Alert severity="warning" sx={{ mt: 1, maxWidth: 600 }}>
											<strong>No sections configured yet.</strong> Click "Configure Sections" below to define where seats should be placed.
											This is recommended before generating the manifest.
										</Alert>
									)}
								</Box>
								<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
									<Button
										variant="contained"
										onClick={() => router.push(`/seatmap/venue/${selectedVenue._id}/configure`)}
									>
										{selectedVenue.sections?.length > 0 ? 'Edit Sections' : 'Configure Sections'}
									</Button>
									<Button
										variant="outlined"
										onClick={() => setStep(1)}
									>
										Change Venue
									</Button>
								</Box>
							</Box>
						</Paper>
					</Grid>

					<Grid item xs={12}>
						<TicketmasterImport
							venueId={selectedVenue._id}
							venue={selectedVenue}
							onImportSuccess={(response) => {
								if (response.data) {
									handleManifestCreated(response.data)
								}
							}}
						/>
					</Grid>
				</Grid>
			)}


			{loading && (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
					<CircularProgress />
				</Box>
			)}

			{/* Edit Venue Dialog */}
			<Dialog
				open={isEditDialogOpen}
				onClose={() => {
					if (!saving) {
						setIsEditDialogOpen(false)
						setEditingVenue(null)
					}
				}}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						maxHeight: '90vh'
					}
				}}
			>
				<DialogTitle>Edit Venue</DialogTitle>
				<DialogContent dividers>
					{editingVenue && (
						<VenueConfiguration
							venue={editingVenue}
							onSubmit={handleSaveVenue}
							onCancel={() => {
								setIsEditDialogOpen(false)
								setEditingVenue(null)
							}}
							loading={saving}
						/>
					)}
				</DialogContent>
			</Dialog>
		</Box>
	)
}

export default NewManifestPage

