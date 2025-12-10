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
	Button
} from '@mui/material'
import { ArrowBack, CloudUpload } from '@mui/icons-material'
import { getManifest, addOrUpdatePlace, deletePlace, getVenue, syncManifestToEventMerchant } from '@/RESTAPIs/seatmap'
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
 * Manifest View/Editor Page
 * Displays and allows editing of a manifest
 */
const ManifestDetailPage = () => {
	const params = useParams()
	const router = useRouter()
	const manifestId = params.id

	const [manifest, setManifest] = useState(null)
	const [venue, setVenue] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

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
	const [isSyncing, setIsSyncing] = useState(false)

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

	const handleSyncManifest = async () => {
		if (!manifestId) return

		const result = await SwalConfig.fire({
			title: 'Sync Manifest?',
			text: 'This will upload the manifest to S3 and sync it to the event-merchant-service. Continue?',
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, sync it!'
		})

		if (result.isConfirmed) {
			setIsSyncing(true)
			try {
				const response = await syncManifestToEventMerchant(manifestId)
				if (response.data) {
					SwalConfig.fire({
						title: 'Success!',
						text: 'Manifest synced successfully to event-merchant-service',
						icon: 'success'
					})
				}
			} catch (err) {
				SwalConfig.fire({
					title: 'Error!',
					text: err.response?.data?.message || 'Failed to sync manifest',
					icon: 'error'
				})
			} finally {
				setIsSyncing(false)
			}
		}
	}

	const handleResetView = () => {
		setZoom(1)
		setPanX(0)
		setPanY(0)
		setSelectedSeats([])
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
			</Box>
		)
	}

	if (!manifest) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="warning">Manifest not found</Alert>
			</Box>
		)
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
				<Typography variant="h4">
					{manifest.name || 'Manifest Details'}
				</Typography>
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
					/>

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
						<Button
							variant="contained"
							color="primary"
							startIcon={<CloudUpload />}
							onClick={handleSyncManifest}
							disabled={isSyncing}
							sx={{ mt: 2, width: '100%' }}
						>
							{isSyncing ? 'Syncing...' : 'Sync to Event Merchant'}
						</Button>
					</Paper>
				</Grid>
			</Grid>

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

export default ManifestDetailPage

