'use client'

import React, { useState, useEffect, useRef } from 'react'
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
import { Edit, Delete, Add, ArrowBack, CloudDownload, CloudUpload,ViewModule } from '@mui/icons-material'
import { getVenues, updateVenue, deleteVenue, exportVenue, importVenue } from '@/RESTAPIs/seatmap'
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
	const fileInputRef = useRef(null)
	const [importMode, setImportMode] = useState('create')
	const [importTargetVenueId, setImportTargetVenueId] = useState(null)

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

	const handleExportVenue = async (venue) => {
		try {
			const response = await exportVenue(venue._id)
			const payload = response.data?.data || response.data
			if (!payload) {
				throw new Error('Empty export payload')
			}

			const blob = new Blob([JSON.stringify(payload, null, 2)], {
				type: 'application/json'
			})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			const safeName = (venue.name || 'venue').replace(/[^a-z0-9-_]+/gi, '_')
			a.href = url
			a.download = `${safeName}-${venue._id}.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		} catch (err) {
			SwalConfig.fire(
				'Error!',
				err.response?.data?.message || err.message || 'Failed to export venue',
				'error'
			)
		}
	}

	const triggerImport = (mode, venueId = null) => {
		setImportMode(mode)
		setImportTargetVenueId(venueId)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
			fileInputRef.current.click()
		}
	}

	const handleImportFileChange = async (event) => {
		const file = event.target.files && event.target.files[0]
		if (!file) return

		try {
			const text = await file.text()
			const json = JSON.parse(text)

			if (json.type && json.type !== 'venue') {
				throw new Error('Selected file is not a venue export (invalid type).')
			}

			const payload = {
				version: json.version || 1,
				type: json.type || 'venue',
				data: json.data || json,
				mode: importMode,
				targetId: importMode === 'update' ? importTargetVenueId : undefined
			}

			const result = await importVenue(payload)
			const importedVenue = result.data?.data

			SwalConfig.fire(
				'Success!',
				`Venue ${importMode === 'update' ? 'updated' : 'created'} successfully`,
				'success'
			)

			await fetchVenues()

			// If we created a new venue, optionally navigate to configure
			if (importMode === 'create' && importedVenue?._id) {
				// Keep user on list for now; they can click configure manually if needed
			}
		} catch (err) {
			console.error('Venue import error:', err)
			SwalConfig.fire(
				'Error!',
				err.response?.data?.message || err.message || 'Failed to import venue',
				'error'
			)
		} finally {
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		}
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
				<Box sx={{ display: 'flex', gap: 2 }}>
					<Button
						variant="outlined"
						startIcon={<CloudUpload />}
						onClick={() => triggerImport('create', null)}
					>
						Import Venue
					</Button>
					<Button
						variant="contained"
						startIcon={<Add />}
						onClick={() => router.push('/seatmap/new')}
					>
						Create New Venue
					</Button>
				</Box>
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
											onClick={() => handleExportVenue(venue)}
											color="primary"
											title="Export Venue"
										>
											<CloudDownload />
										</IconButton>
										<IconButton
											size="small"
											onClick={() => triggerImport('update', venue._id)}
											color="primary"
											title="Import into Venue"
										>
											<CloudUpload />
										</IconButton>
										<IconButton
											size="small"
											onClick={() => handleConfigureSections(venue._id)}
											color="primary"
											title="Configure Sections"
										>
											<ViewModule />
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

			{/* Hidden file input for import */}
			<input
				type="file"
				accept="application/json"
				style={{ display: 'none' }}
				ref={fileInputRef}
				onChange={handleImportFileChange}
			/>

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

