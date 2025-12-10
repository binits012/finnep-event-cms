'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
	Box,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Button,
	Typography,
	IconButton,
	CircularProgress,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	Chip
} from '@mui/material'
import { Edit, Delete, Add, ArrowBack } from '@mui/icons-material'
import { getVenues, updateVenue, deleteVenue } from '@/RESTAPIs/seatmap'
import VenueConfiguration from '@/components/seatmap/VenueConfiguration'
import Swal from 'sweetalert2'

// Configure SweetAlert2 z-index
const SwalConfig = Swal.mixin({
	didOpen: () => {
		const swalContainer = document.querySelector('.swal2-container')
		if (swalContainer) swalContainer.style.zIndex = '9999'
	}
})

/**
 * Venues Management Page
 * Displays all venues with edit and delete functionality
 */
const VenuesPage = () => {
	const router = useRouter()
	const [venues, setVenues] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [editingVenue, setEditingVenue] = useState(null)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		fetchVenues()
	}, [])

	const fetchVenues = async () => {
		setLoading(true)
		setError(null)
		try {
			const response = await getVenues()
			if (response.data) {
				setVenues(response.data.data || [])
			}
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to fetch venues')
		} finally {
			setLoading(false)
		}
	}

	const handleEdit = (venue) => {
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
			await updateVenue(editingVenue._id, venueData)
			SwalConfig.fire('Success!', 'Venue updated successfully', 'success')
			setIsEditDialogOpen(false)
			setEditingVenue(null)
			fetchVenues()
		} catch (err) {
			SwalConfig.fire('Error!', err.response?.data?.message || 'Failed to update venue', 'error')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (venue) => {
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
			} catch (err) {
				SwalConfig.fire('Error!', err.response?.data?.message || 'Failed to delete venue', 'error')
			}
		}
	}

	const handleConfigureSections = (venueId) => {
		router.push(`/seatmap/venue/${venueId}/configure`)
	}

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
				<CircularProgress />
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
					<Typography variant="h4">Venues Management</Typography>
				</Box>
				<Button
					variant="contained"
					startIcon={<Add />}
					onClick={() => router.push('/seatmap/new')}
				>
					Create New Venue
				</Button>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Name</TableCell>
							<TableCell>Type</TableCell>
							<TableCell>Sections</TableCell>
							<TableCell>Created</TableCell>
							<TableCell align="right">Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{venues.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} align="center">
									<Typography color="textSecondary">No venues found</Typography>
									<Button
										variant="outlined"
										startIcon={<Add />}
										onClick={() => router.push('/seatmap/new')}
										sx={{ mt: 2 }}
									>
										Create Your First Venue
									</Button>
								</TableCell>
							</TableRow>
						) : (
							venues.map((venue) => (
								<TableRow key={venue._id}>
									<TableCell>
										<Typography variant="body2" fontWeight="medium">
											{venue.name}
										</Typography>
									</TableCell>
									<TableCell>
										<Chip
											label={venue.venueType || 'custom'}
											size="small"
											variant="outlined"
										/>
									</TableCell>
									<TableCell>
										{venue.sections?.length || 0} section{venue.sections?.length !== 1 ? 's' : ''}
									</TableCell>
									<TableCell>
										{new Date(venue.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell align="right">
										<IconButton
											size="small"
											onClick={() => handleConfigureSections(venue._id)}
											color="primary"
											title="Configure Sections"
										>
											<Edit />
										</IconButton>
										<IconButton
											size="small"
											onClick={() => handleEdit(venue)}
											color="primary"
											title="Edit Venue Name"
										>
											<Edit />
										</IconButton>
										<IconButton
											size="small"
											onClick={() => handleDelete(venue)}
											color="error"
											title="Delete Venue"
										>
											<Delete />
										</IconButton>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>

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

export default VenuesPage

