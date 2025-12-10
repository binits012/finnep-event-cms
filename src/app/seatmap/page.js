'use client'

import React, { useState, useEffect } from 'react'
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
	Alert
} from '@mui/material'
import { Edit, Delete, Visibility } from '@mui/icons-material'
import { getManifests, deleteManifest } from '@/RESTAPIs/seatmap'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

// Configure SweetAlert2 z-index
const SwalConfig = Swal.mixin({
	didOpen: () => {
		const swalContainer = document.querySelector('.swal2-container')
		if (swalContainer) swalContainer.style.zIndex = '9999'
	}
})

/**
 * Manifest List Page
 * Displays all manifests with actions
 */
const SeatmapPage = () => {
	const [manifests, setManifests] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const router = useRouter()

	useEffect(() => {
		fetchManifests()
	}, [])

	const fetchManifests = async () => {
		setLoading(true)
		setError(null)
		try {
			const response = await getManifests()
			if (response.data) {
				setManifests(response.data.data || [])
			}
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to fetch manifests')
		} finally {
			setLoading(false)
		}
	}

	const handleDelete = async (id, name) => {
		const result = await SwalConfig.fire({
			title: 'Are you sure?',
			text: `Delete manifest "${name || id}"?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!'
		})

		if (result.isConfirmed) {
			try {
				await deleteManifest(id)
				SwalConfig.fire('Deleted!', 'Manifest has been deleted.', 'success')
				fetchManifests()
			} catch (err) {
				SwalConfig.fire('Error!', err.response?.data?.message || 'Failed to delete manifest', 'error')
			}
		}
	}

	const handleView = (id) => {
		router.push(`/seatmap/${id}`)
	}

	const handleEdit = (id) => {
		router.push(`/seatmap/${id}/edit`)
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
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant="h4">Manifests</Typography>
				<Box sx={{ display: 'flex', gap: 2 }}>
					<Button
						variant="outlined"
						onClick={() => router.push('/seatmap/venues')}
					>
						Manage Venues
					</Button>
					<Button
						variant="contained"
						onClick={() => router.push('/seatmap/new')}
					>
						Create New Manifest
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
							<TableCell>Venue</TableCell>
							<TableCell>Places</TableCell>
							<TableCell>Version</TableCell>
							<TableCell>Created</TableCell>
							<TableCell align="right">Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{manifests.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} align="center">
									<Typography color="textSecondary">No manifests found</Typography>
								</TableCell>
							</TableRow>
						) : (
							manifests.map((manifest) => (
								<TableRow key={manifest._id}>
									<TableCell>{manifest.name || 'Unnamed Manifest'}</TableCell>
									<TableCell>
										{manifest.venue?.name || manifest.venue?._id || 'N/A'}
									</TableCell>
									<TableCell>{manifest.places?.length || 0}</TableCell>
									<TableCell>{manifest.version || 1}</TableCell>
									<TableCell>
										{new Date(manifest.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell align="right">
										<IconButton
											size="small"
											onClick={() => handleView(manifest._id)}
											color="primary"
										>
											<Visibility />
										</IconButton>
										<IconButton
											size="small"
											onClick={() => handleEdit(manifest._id)}
											color="primary"
										>
											<Edit />
										</IconButton>
										<IconButton
											size="small"
											onClick={() => handleDelete(manifest._id, manifest.name)}
											color="error"
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
		</Box>
	)
}

export default SeatmapPage

