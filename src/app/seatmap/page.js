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
import { Edit, Delete, Visibility, CloudDownload, CloudUpload } from '@mui/icons-material'
import { getManifests, deleteManifest, exportManifest, importManifest } from '@/RESTAPIs/seatmap'
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
	const fileInputRef = React.useRef(null)
	const [importMode, setImportMode] = useState('create')
	const [importTargetManifestId, setImportTargetManifestId] = useState(null)

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

	const handleExportManifest = async (manifest) => {
		try {
			const response = await exportManifest(manifest._id)
			const payload = response.data?.data || response.data
			if (!payload) {
				throw new Error('Empty export payload')
			}

			const blob = new Blob([JSON.stringify(payload, null, 2)], {
				type: 'application/json'
			})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			const safeName = (manifest.name || 'manifest').replace(/[^a-z0-9-_]+/gi, '_')
			a.href = url
			a.download = `${safeName}-${manifest._id}.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		} catch (err) {
			SwalConfig.fire(
				'Error!',
				err.response?.data?.message || err.message || 'Failed to export manifest',
				'error'
			)
		}
	}

	const triggerImport = (mode, manifestId = null) => {
		setImportMode(mode)
		setImportTargetManifestId(manifestId)
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

			if (json.type && json.type !== 'manifest') {
				throw new Error('Selected file is not a manifest export (invalid type).')
			}

			const payload = {
				version: json.version || 1,
				type: json.type || 'manifest',
				data: json.data || json,
				mode: importMode,
				targetId: importMode === 'update' ? importTargetManifestId : undefined
			}

			await importManifest(payload)

			SwalConfig.fire(
				'Success!',
				`Manifest ${importMode === 'update' ? 'updated' : 'created'} successfully`,
				'success'
			)

			await fetchManifests()
		} catch (err) {
			console.error('Manifest import error:', err)
			SwalConfig.fire(
				'Error!',
				err.response?.data?.message || err.message || 'Failed to import manifest',
				'error'
			)
		} finally {
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
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
						startIcon={<CloudUpload />}
						onClick={() => triggerImport('create', null)}
					>
						Import Manifest
					</Button>
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
											onClick={() => handleExportManifest(manifest)}
											color="primary"
											title="Export Manifest"
										>
											<CloudDownload />
										</IconButton>
										<IconButton
											size="small"
											onClick={() => triggerImport('update', manifest._id)}
											color="primary"
											title="Import into Manifest"
										>
											<CloudUpload />
										</IconButton>
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

			{/* Hidden file input for manifest import */}
			<input
				type="file"
				accept="application/json"
				style={{ display: 'none' }}
				ref={fileInputRef}
				onChange={handleImportFileChange}
			/>
		</Box>
	)
}

export default SeatmapPage

