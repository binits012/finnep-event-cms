'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
	Box,
	Paper,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Typography,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	FormHelperText,
	Grid,
	Checkbox,
	FormControlLabel,
	Chip,
	IconButton,
	Slider,
	Tabs,
	Tab,
	Alert,
	Tooltip,
	Divider,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper as MuiPaper,
	IconButton as MuiIconButton
} from '@mui/material'
import { Delete, Add, Edit, Undo, Redo, Remove } from '@mui/icons-material'
import VenueCanvasEditor from './VenueCanvasEditor'

/**
 * Section Editor Component
 * Visual editor for creating and configuring venue sections
 * Supports both Quick Mode (auto-generation) and Advanced Mode (manual configuration)
 */
const SectionEditor = ({
	open,
	onClose,
	venue,
	onSave,
	mode = 'quick' // 'quick' or 'advanced'
}) => {
	const canvasRef = useRef(null)
	const [sections, setSections] = useState([])
	const [centralFeature, setCentralFeature] = useState(null)
	const [editingSection, setEditingSection] = useState(null)
	const [isDrawing, setIsDrawing] = useState(false)
	const [currentPolygon, setCurrentPolygon] = useState([])
	const [scale, setScale] = useState(1)
	const [pan, setPan] = useState({ x: 0, y: 0 })
	const [activeTab, setActiveTab] = useState(0) // 0: Sections, 1: Central Feature

	// Undo/Redo history
	const [history, setHistory] = useState([])
	const [historyIndex, setHistoryIndex] = useState(-1)

	// Section form state
	const [sectionForm, setSectionForm] = useState({
		name: '',
		type: 'seating',
		shape: 'rectangle',
		capacity: 0,
		rows: 0,
		seatsPerRow: 0,
		color: '#1976D2',
		strokeColor: '#0D47A1',
		accessible: false,
		features: [],
		priceTier: '',
		basePrice: 0,
		bounds: undefined,
		polygon: undefined,
		rowConfig: [] // Array of row configurations for variable rows
	})
	const [rowConfigMode, setRowConfigMode] = useState('uniform') // 'uniform' or 'variable'

	useEffect(() => {
		if (venue) {
			const initialSections = venue.sections || []
			const initialFeature = venue.centralFeature || null
			setSections(initialSections)
			setCentralFeature(initialFeature)
			// Initialize history with initial state
			setHistory([{ sections: initialSections, centralFeature: initialFeature }])
			setHistoryIndex(0)
		}
	}, [venue])

	// Save state to history
	const saveToHistory = (newSections, newCentralFeature) => {
		const newState = {
			sections: JSON.parse(JSON.stringify(newSections)), // Deep copy
			centralFeature: newCentralFeature ? JSON.parse(JSON.stringify(newCentralFeature)) : null
		}

		// Remove any history after current index (when undoing and then making new changes)
		const newHistory = history.slice(0, historyIndex + 1)
		newHistory.push(newState)

		// Limit history to last 50 states
		if (newHistory.length > 50) {
			newHistory.shift()
			setHistoryIndex(newHistory.length - 1)
		} else {
			setHistoryIndex(newHistory.length - 1)
		}

		setHistory(newHistory)
	}

	// Undo function
	const handleUndo = () => {
		if (historyIndex > 0) {
			const prevIndex = historyIndex - 1
			const prevState = history[prevIndex]
			setSections(prevState.sections)
			setCentralFeature(prevState.centralFeature)
			setHistoryIndex(prevIndex)
		}
	}

	// Redo function
	const handleRedo = () => {
		if (historyIndex < history.length - 1) {
			const nextIndex = historyIndex + 1
			const nextState = history[nextIndex]
			setSections(nextState.sections)
			setCentralFeature(nextState.centralFeature)
			setHistoryIndex(nextIndex)
		}
	}

	// Keyboard shortcuts for undo/redo and escape to close
	useEffect(() => {
		const handleKeyDown = (e) => {
			// Escape key or Backspace to close dialog
			if (e.key === 'Escape' || e.key === 'Backspace') {
				if (!editingSection) { // Only close if not editing a section
					onClose()
				}
			}
			// Undo/Redo shortcuts
			if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
				e.preventDefault()
				handleUndo()
			} else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
				e.preventDefault()
				handleRedo()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [historyIndex, history, editingSection, onClose])

	const handleAddSection = () => {
		// Set editingSection to empty object to trigger dialog open
		setEditingSection({})
		setSectionForm({
			name: '',
			type: 'seating',
			shape: 'rectangle',
			capacity: 0,
			rows: 0,
			seatsPerRow: 0,
			color: '#1976D2',
			strokeColor: '#0D47A1',
			accessible: false,
			features: [],
			priceTier: '',
			basePrice: 0,
			bounds: undefined,
			polygon: undefined
		})
	}

	const handleEditSection = (section) => {
		setEditingSection(section)
		const hasRowConfig = section.rowConfig && Array.isArray(section.rowConfig) && section.rowConfig.length > 0
		setRowConfigMode(hasRowConfig ? 'variable' : 'uniform')
		setSectionForm({
			name: section.name || '',
			type: section.type || 'seating',
			shape: section.shape || (section.polygon ? 'polygon' : 'rectangle'),
			capacity: section.capacity || 0,
			rows: section.rows || 0,
			seatsPerRow: section.seatsPerRow || 0,
			color: section.color || '#1976D2',
			strokeColor: section.strokeColor || '#0D47A1',
			accessible: section.accessible || false,
			features: section.features || [],
			priceTier: section.priceTier || '',
			basePrice: section.basePrice || 0,
			bounds: section.bounds || undefined, // Preserve bounds
			polygon: section.polygon || undefined, // Preserve polygon
			rowConfig: section.rowConfig || [] // Preserve rowConfig
		})
	}

	const handleDeleteSection = (sectionId) => {
		const newSections = sections.filter(s => s.id !== sectionId)
		setSections(newSections)
		saveToHistory(newSections, centralFeature)
	}

	const handleSaveSection = () => {
		// Check if editingSection has an id (existing section) or is empty object (new section)
		const isEditing = editingSection && editingSection.id
		const existingSection = isEditing ? sections.find(s => s.id === editingSection.id) : null

		// Preserve existing bounds/polygon if editing and shape hasn't changed
		let bounds = sectionForm.bounds
		let polygon = sectionForm.polygon

		if (isEditing && existingSection) {
			// When editing, preserve the existing bounds/polygon unless shape changed
			if (sectionForm.shape === 'polygon' && existingSection.polygon) {
				polygon = existingSection.polygon // Keep existing polygon
			} else if (sectionForm.shape === 'rectangle' && existingSection.bounds) {
				bounds = existingSection.bounds // Keep existing bounds
			}
		}

		// Calculate default bounds only for new sections without bounds
		if (!isEditing && sectionForm.shape !== 'polygon' && (!bounds || (bounds.x1 === undefined && bounds.x2 === undefined && bounds.y1 === undefined && bounds.y2 === undefined))) {
			// Default bounds: position sections in a grid pattern
			const sectionIndex = sections.length
			const cols = Math.ceil(Math.sqrt(Math.max(sections.length + 1, 1)))
			const row = Math.floor(sectionIndex / cols)
			const col = sectionIndex % cols
			const sectionWidth = 150
			const sectionHeight = 100
			const spacing = 20

			bounds = {
				x1: col * (sectionWidth + spacing) + 50,
				y1: row * (sectionHeight + spacing) + 50,
				x2: col * (sectionWidth + spacing) + 50 + sectionWidth,
				y2: row * (sectionHeight + spacing) + 50 + sectionHeight
			}
		}

		const sectionData = {
			id: editingSection?.id || `section-${Date.now()}`,
			name: sectionForm.name,
			type: sectionForm.type,
			shape: sectionForm.shape,
			capacity: sectionForm.capacity,
			rows: sectionForm.rows,
			seatsPerRow: sectionForm.seatsPerRow,
			color: sectionForm.color,
			strokeColor: sectionForm.strokeColor,
			accessible: sectionForm.accessible,
			features: sectionForm.features,
			priceTier: sectionForm.priceTier,
			basePrice: sectionForm.basePrice,
			bounds: sectionForm.shape === 'polygon' ? undefined : bounds, // Only set bounds for rectangles
			polygon: sectionForm.shape === 'polygon' ? polygon : undefined, // Use preserved or form polygon
			rowConfig: rowConfigMode === 'variable' ? (sectionForm.rowConfig || []) : undefined, // Only include rowConfig if variable mode
			displayOrder: isEditing ? (existingSection?.displayOrder || sections.length) : sections.length
		}

		// Update or add section
		let newSections
		if (isEditing) {
			// Update existing section
			newSections = sections.map(s => s.id === editingSection.id ? sectionData : s)
		} else {
			// Add new section
			newSections = [...sections, sectionData]
		}

		setSections(newSections)
		saveToHistory(newSections, centralFeature)

		setEditingSection(null)
		setRowConfigMode('uniform')
		setSectionForm({
			name: '',
			type: 'seating',
			shape: 'rectangle',
			capacity: 0,
			rows: 0,
			seatsPerRow: 0,
			color: '#1976D2',
			strokeColor: '#0D47A1',
			accessible: false,
			features: [],
			priceTier: '',
			basePrice: 0,
			bounds: undefined,
			polygon: undefined,
			rowConfig: []
		})
	}

	const handleSave = () => {
		if (onSave) {
			onSave({
				sections,
				centralFeature
			})
		}
		onClose()
	}

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
			<DialogTitle>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
					<Box>
						<Typography variant="h6">Configure Venue Sections</Typography>
						<Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
							Define sections where seats will be placed. These sections will be used when generating the seat map manifest.
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', gap: 0.5 }}>
						<Tooltip title="Undo (Ctrl+Z)">
							<span>
								<IconButton
									size="small"
									onClick={handleUndo}
									disabled={historyIndex <= 0}
									color="primary"
								>
									<Undo />
								</IconButton>
							</span>
						</Tooltip>
						<Tooltip title="Redo (Ctrl+Y or Ctrl+Shift+Z)">
							<span>
								<IconButton
									size="small"
									onClick={handleRedo}
									disabled={historyIndex >= history.length - 1}
									color="primary"
								>
									<Redo />
								</IconButton>
							</span>
						</Tooltip>
					</Box>
				</Box>
			</DialogTitle>

			<DialogContent>
				<Alert severity="info" sx={{ mb: 3 }}>
					<strong>How it works:</strong> Configure sections first, then when you generate the manifest, seats will be automatically placed within these sections based on the capacity and layout you specify.
				</Alert>

				<Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
					<Tab label="Sections" />
					<Tab label="Central Feature (Optional)" />
				</Tabs>

				{activeTab === 0 && (
					<Grid container spacing={3}>
						{/* Instructions */}
						<Grid item xs={12}>
							<Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
								<Typography variant="subtitle2" gutterBottom>
									📋 How to Add Sections:
								</Typography>
								<Box component="ul" sx={{ pl: 3, m: 0 }}>
									<li>Click <strong>"Add Section"</strong> button to create a new section</li>
									<li>Fill in the section details (name, type, capacity, etc.)</li>
									<li>Optionally use the canvas to draw section boundaries visually</li>
									<li>When generating the manifest, seats will be distributed within these sections</li>
								</Box>
							</Paper>
						</Grid>

						{/* Canvas/Visual Editor */}
						<Grid item xs={12} md={8}>
							<Paper elevation={1} sx={{ p: 2 }}>
								<Typography variant="subtitle2" gutterBottom>
									Visual Preview
								</Typography>
								<Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
									This shows a preview of your sections. You can draw section boundaries here, or configure them using the form on the right.
								</Typography>
								<VenueCanvasEditor
									width={800}
									height={600}
									sections={sections}
									centralFeature={centralFeature}
									onSectionAdd={(sectionData) => {
										// Immediately add the section to the sections array
										const newSection = {
											id: `section-${Date.now()}`,
											...sectionData,
											name: sectionData.name || `Section ${sections.length + 1}`,
											type: sectionData.type || 'seating',
											color: sectionData.color || '#1976D2',
											strokeColor: sectionData.strokeColor || '#0D47A1',
											displayOrder: sections.length
										}
										const newSections = [...sections, newSection]
										setSections(newSections)
										saveToHistory(newSections, centralFeature)
									}}
									onSectionUpdate={(sectionId, updates) => {
										const newSections = sections.map(s => s.id === sectionId ? { ...s, ...updates } : s)
										setSections(newSections)
										saveToHistory(newSections, centralFeature)
									}}
									onSectionDelete={handleDeleteSection}
									mode="advanced"
								/>
							</Paper>
						</Grid>

					{/* Section List and Configuration */}
					<Grid item xs={12} md={4}>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							{/* Add Section Button */}
							<Button
								variant="contained"
								startIcon={<Add />}
								onClick={handleAddSection}
								fullWidth
								size="large"
							>
								Add New Section
							</Button>

							{/* Section Count */}
							{sections.length > 0 && (
								<Typography variant="body2" color="textSecondary">
									{sections.length} section{sections.length !== 1 ? 's' : ''} configured
								</Typography>
							)}

							{/* Section List */}
							<Box sx={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
							{sections.map((section) => (
								<Paper key={section.id} elevation={1} sx={{ p: 2 }}>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
										<Typography variant="subtitle1" fontWeight="bold">
											{section.name || 'Unnamed Section'}
										</Typography>
										<Box>
											<IconButton size="small" onClick={() => handleEditSection(section)}>
												<Edit fontSize="small" />
											</IconButton>
											<IconButton size="small" onClick={() => handleDeleteSection(section.id)} color="error">
												<Delete fontSize="small" />
											</IconButton>
										</Box>
									</Box>
									<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
										<Chip label={section.type} size="small" />
										{section.accessible && <Chip label="Accessible" size="small" color="success" />}
										{section.capacity > 0 && <Chip label={`${section.capacity} seats`} size="small" />}
									</Box>
									{section.color && (
										<Box
											sx={{
												width: '100%',
												height: 20,
												backgroundColor: section.color,
												borderRadius: 1,
												border: `2px solid ${section.strokeColor || '#000'}`
											}}
										/>
									)}
								</Paper>
							))}

							{sections.length === 0 && (
								<Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
									<Typography variant="body2" color="textSecondary" gutterBottom>
										No sections configured yet.
									</Typography>
									<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
										Click <strong>"Add New Section"</strong> above to create your first section.
									</Typography>
									<Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
										💡 Tip: Configure at least one section before generating the manifest. Seats will be placed within these sections.
									</Typography>
								</Paper>
							)}
							</Box>
						</Box>
					</Grid>
				</Grid>
				)}

				{activeTab === 1 && (
					<Box>
						<Typography variant="h6" gutterBottom>
							Central Feature Configuration
						</Typography>
						<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
							Define the central feature (ice rink, stage, field, etc.) that sections will be arranged around.
						</Typography>
						<Grid container spacing={2}>
							<Grid item xs={12}>
								<FormControl fullWidth>
									<InputLabel>Feature Type</InputLabel>
									<Select
										value={centralFeature?.type || 'none'}
										label="Feature Type"
										onChange={(e) => setCentralFeature({
											...centralFeature,
											type: e.target.value,
											shape: e.target.value === 'rink' ? 'circle' : 'rectangle'
										})}
									>
										<MenuItem value="none">None</MenuItem>
										<MenuItem value="stage">Stage</MenuItem>
										<MenuItem value="rink">Ice Rink</MenuItem>
										<MenuItem value="field">Field</MenuItem>
										<MenuItem value="court">Court</MenuItem>
										<MenuItem value="custom">Custom</MenuItem>
									</Select>
								</FormControl>
							</Grid>
							{centralFeature?.type && centralFeature.type !== 'none' && (
								<>
									<Grid item xs={12}>
										<TextField
											label="Feature Name"
											value={centralFeature?.name || ''}
											onChange={(e) => setCentralFeature({ ...centralFeature, name: e.target.value })}
											fullWidth
											placeholder="e.g., Ice Rink, Main Stage"
										/>
									</Grid>
									{centralFeature?.shape === 'rectangle' && (
										<>
											<Grid item xs={6}>
												<TextField
													label="X Position"
													type="number"
													value={centralFeature?.x || 0}
													onChange={(e) => setCentralFeature({ ...centralFeature, x: parseInt(e.target.value) || 0 })}
													fullWidth
												/>
											</Grid>
											<Grid item xs={6}>
												<TextField
													label="Y Position"
													type="number"
													value={centralFeature?.y || 0}
													onChange={(e) => setCentralFeature({ ...centralFeature, y: parseInt(e.target.value) || 0 })}
													fullWidth
												/>
											</Grid>
											<Grid item xs={6}>
												<TextField
													label="Width"
													type="number"
													value={centralFeature?.width || 100}
													onChange={(e) => setCentralFeature({ ...centralFeature, width: parseInt(e.target.value) || 100 })}
													fullWidth
												/>
											</Grid>
											<Grid item xs={6}>
												<TextField
													label="Height"
													type="number"
													value={centralFeature?.height || 100}
													onChange={(e) => setCentralFeature({ ...centralFeature, height: parseInt(e.target.value) || 100 })}
													fullWidth
												/>
											</Grid>
										</>
									)}
									{centralFeature?.shape === 'circle' && (
										<>
											<Grid item xs={6}>
												<TextField
													label="Center X"
													type="number"
													value={centralFeature?.centerX || 400}
													onChange={(e) => setCentralFeature({ ...centralFeature, centerX: parseInt(e.target.value) || 400 })}
													fullWidth
												/>
											</Grid>
											<Grid item xs={6}>
												<TextField
													label="Center Y"
													type="number"
													value={centralFeature?.centerY || 300}
													onChange={(e) => setCentralFeature({ ...centralFeature, centerY: parseInt(e.target.value) || 300 })}
													fullWidth
												/>
											</Grid>
											<Grid item xs={12}>
												<TextField
													label="Radius"
													type="number"
													value={centralFeature?.radiusX || 50}
													onChange={(e) => setCentralFeature({
														...centralFeature,
														radiusX: parseInt(e.target.value) || 50,
														radiusY: parseInt(e.target.value) || 50
													})}
													fullWidth
												/>
											</Grid>
										</>
									)}
									<Grid item xs={6}>
										<TextField
											label="Fill Color"
											type="color"
											value={centralFeature?.color || '#E3F2FD'}
											onChange={(e) => setCentralFeature({ ...centralFeature, color: e.target.value })}
											fullWidth
										/>
									</Grid>
									<Grid item xs={6}>
										<TextField
											label="Stroke Color"
											type="color"
											value={centralFeature?.strokeColor || '#1976D2'}
											onChange={(e) => setCentralFeature({ ...centralFeature, strokeColor: e.target.value })}
											fullWidth
										/>
									</Grid>

									{/* Image Upload Section */}
									<Grid item xs={12}>
										<Divider sx={{ my: 2 }} />
										<Typography variant="subtitle2" gutterBottom>
											Image (Optional)
										</Typography>
										<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
											Upload an image of the rink/field/stage to use as a visual reference. The image will be displayed within the shape you defined above.
										</Typography>
									</Grid>

									<Grid item xs={12}>
										<Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
											<Button
												variant="outlined"
												component="label"
												startIcon={<Add />}
											>
												Upload Image
												<input
													type="file"
													hidden
													accept="image/*"
													onChange={(e) => {
														const file = e.target.files[0]
														if (file) {
															const reader = new FileReader()
															reader.onload = (event) => {
																setCentralFeature({
																	...centralFeature,
																	imageUrl: event.target.result
																})
																saveToHistory(sections, {
																	...centralFeature,
																	imageUrl: event.target.result
																})
															}
															reader.readAsDataURL(file)
														}
													}}
												/>
											</Button>
											{centralFeature?.imageUrl && (
												<Button
													variant="outlined"
													color="error"
													onClick={() => {
														setCentralFeature({
															...centralFeature,
															imageUrl: null,
															imageWidth: null,
															imageHeight: null
														})
														saveToHistory(sections, {
															...centralFeature,
															imageUrl: null,
															imageWidth: null,
															imageHeight: null
														})
													}}
												>
													Remove Image
												</Button>
											)}
										</Box>
									</Grid>

									<Grid item xs={12}>
										<TextField
											label="Or Enter Image URL"
											value={centralFeature?.imageUrl || ''}
											onChange={(e) => {
												const url = e.target.value
												setCentralFeature({
													...centralFeature,
													imageUrl: url || null
												})
												if (url) {
													saveToHistory(sections, {
														...centralFeature,
														imageUrl: url
													})
												}
											}}
											fullWidth
											placeholder="https://example.com/rink-image.png"
											helperText="Enter a direct image URL (or upload a file above)"
										/>
									</Grid>

									{centralFeature?.imageUrl && (
										<>
											<Grid item xs={12}>
												<Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
													<Typography variant="caption" display="block" gutterBottom>
														Image Preview:
													</Typography>
													<Box
														component="img"
														src={centralFeature.imageUrl}
														alt="Central feature preview"
														sx={{
															maxWidth: '100%',
															maxHeight: 200,
															objectFit: 'contain',
															borderRadius: 1
														}}
														onError={(e) => {
															e.target.style.display = 'none'
														}}
													/>
												</Box>
											</Grid>

											<Grid item xs={12}>
												<Typography gutterBottom>
													Image Opacity: {((centralFeature?.imageOpacity || 1.0) * 100).toFixed(0)}%
												</Typography>
												<Slider
													value={centralFeature?.imageOpacity || 1.0}
													min={0}
													max={1}
													step={0.1}
													onChange={(e, value) => {
														setCentralFeature({
															...centralFeature,
															imageOpacity: value
														})
														saveToHistory(sections, {
															...centralFeature,
															imageOpacity: value
														})
													}}
												/>
											</Grid>

											<Grid item xs={6}>
												<TextField
													label="Image Width (Optional)"
													type="number"
													value={centralFeature?.imageWidth || ''}
													onChange={(e) => setCentralFeature({
														...centralFeature,
														imageWidth: e.target.value ? parseInt(e.target.value) : null
													})}
													fullWidth
													helperText="Leave empty to use shape width"
												/>
											</Grid>
											<Grid item xs={6}>
												<TextField
													label="Image Height (Optional)"
													type="number"
													value={centralFeature?.imageHeight || ''}
													onChange={(e) => setCentralFeature({
														...centralFeature,
														imageHeight: e.target.value ? parseInt(e.target.value) : null
													})}
													fullWidth
													helperText="Leave empty to use shape height"
												/>
											</Grid>
										</>
									)}
								</>
							)}
						</Grid>
					</Box>
				)}

				{/* Section Form Dialog */}
				<Dialog open={editingSection !== null && editingSection !== undefined} onClose={() => setEditingSection(null)} maxWidth="sm" fullWidth>
					<DialogTitle>
						{editingSection && editingSection.id ? 'Edit Section' : 'Add New Section'}
							<Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
								Configure section details. The capacity and layout settings will determine how seats are placed when you generate the manifest.
							</Typography>
						</DialogTitle>
						<DialogContent>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
								<TextField
									label="Section Name"
									value={sectionForm.name}
									onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
									required
									fullWidth
									helperText="e.g., 'Section A', 'VIP Lounge', 'Upper Level'"
								/>

								<FormControl fullWidth>
									<InputLabel>Section Type</InputLabel>
									<Select
										value={sectionForm.type}
										label="Section Type"
										onChange={(e) => setSectionForm({ ...sectionForm, type: e.target.value })}
									>
										<MenuItem value="seating">Seating</MenuItem>
										<MenuItem value="standing">Standing</MenuItem>
										<MenuItem value="box">Private Box</MenuItem>
										<MenuItem value="lounge">Lounge</MenuItem>
										<MenuItem value="bar">Bar</MenuItem>
										<MenuItem value="accessible">Accessible</MenuItem>
										<MenuItem value="vip">VIP</MenuItem>
										<MenuItem value="premium">Premium</MenuItem>
										<MenuItem value="general">General Admission</MenuItem>
										<MenuItem value="custom">Custom</MenuItem>
									</Select>
								</FormControl>

								<FormControl fullWidth>
									<InputLabel>Shape</InputLabel>
									<Select
										value={sectionForm.shape}
										label="Shape"
										onChange={(e) => setSectionForm({ ...sectionForm, shape: e.target.value })}
									>
										<MenuItem value="rectangle">Rectangle</MenuItem>
										<MenuItem value="polygon">Polygon (Irregular)</MenuItem>
									</Select>
									<FormHelperText>
										{sectionForm.shape === 'rectangle'
											? 'Rectangle sections will be positioned automatically. You can adjust position by drawing on the canvas.'
											: 'Polygon sections must be drawn on the canvas by clicking points.'}
									</FormHelperText>
								</FormControl>

								{sectionForm.shape === 'rectangle' && (
									<Alert severity="info" sx={{ mt: 1 }}>
										💡 Tip: After saving, you can use the drawing tools on the canvas to reposition or resize this section.
									</Alert>
								)}

								{sectionForm.shape === 'polygon' && (
									<Alert severity="warning" sx={{ mt: 1 }}>
										⚠️ Polygon sections must be drawn on the canvas. Click the polygon tool, then click points on the canvas to define the shape.
									</Alert>
								)}

								<Grid container spacing={2}>
									<Grid item xs={12}>
										<TextField
											label="Capacity (Total Seats)"
											type="number"
											value={sectionForm.capacity}
											onChange={(e) => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value) || 0 })}
											fullWidth
											inputProps={{ min: 0 }}
											helperText="Total number of seats this section should have. Leave 0 to calculate from rows × seats per row."
										/>
									</Grid>
									<Grid item xs={6}>
										<TextField
											label="Number of Rows"
											type="number"
											value={sectionForm.rows}
											onChange={(e) => setSectionForm({ ...sectionForm, rows: parseInt(e.target.value) || 0 })}
											fullWidth
											inputProps={{ min: 0 }}
											helperText="Optional: Number of rows"
										/>
									</Grid>
									<Grid item xs={6}>
										<TextField
											label="Seats per Row"
											type="number"
											value={sectionForm.seatsPerRow}
											onChange={(e) => setSectionForm({ ...sectionForm, seatsPerRow: parseInt(e.target.value) || 0 })}
											fullWidth
											inputProps={{ min: 0 }}
											helperText="Optional: Seats in each row (for uniform rows)"
											disabled={rowConfigMode === 'variable'}
										/>
									</Grid>

									{/* Row Configuration Mode */}
									<Grid item xs={12}>
										<Divider sx={{ my: 2 }} />
										<FormControl fullWidth>
											<InputLabel>Row Configuration</InputLabel>
											<Select
												value={rowConfigMode}
												label="Row Configuration"
												onChange={(e) => {
													const mode = e.target.value
													setRowConfigMode(mode)
													if (mode === 'variable' && (!sectionForm.rowConfig || sectionForm.rowConfig.length === 0)) {
														// Initialize with rows from sectionForm.rows
														const initialRows = sectionForm.rows || 1
														const initialRowConfig = Array.from({ length: initialRows }, (_, i) => ({
															rowNumber: i + 1,
															rowLabel: `R${i + 1}`,
															seatCount: sectionForm.seatsPerRow || 20,
															startSeatNumber: 1,
															aisleLeft: 0,
															aisleRight: 0,
															offsetX: 0,
															offsetY: 0
														}))
														setSectionForm({ ...sectionForm, rowConfig: initialRowConfig })
													}
												}}
											>
												<MenuItem value="uniform">Uniform Rows (All rows have same number of seats)</MenuItem>
												<MenuItem value="variable">Variable Rows (Each row can have different seat counts)</MenuItem>
											</Select>
											<FormHelperText>
												{rowConfigMode === 'uniform'
													? 'All rows will have the same number of seats. Use this for standard rectangular sections.'
													: 'Configure each row individually. Use this when rows have different lengths (e.g., due to aisles or section boundaries).'}
											</FormHelperText>
										</FormControl>
									</Grid>

									{/* Variable Row Configuration Table */}
									{rowConfigMode === 'variable' && (
										<Grid item xs={12}>
											<Box sx={{ mt: 2 }}>
												<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
													<Typography variant="subtitle2">
														Configure Individual Rows
													</Typography>
													<Button
														size="small"
														variant="outlined"
														startIcon={<Add />}
														onClick={() => {
															const newRowNumber = (sectionForm.rowConfig?.length || 0) + 1
															const newRow = {
																rowNumber: newRowNumber,
																rowLabel: `R${newRowNumber}`,
																seatCount: sectionForm.seatsPerRow || 20,
																startSeatNumber: 1,
																aisleLeft: 0,
																aisleRight: 0,
																offsetX: 0,
																offsetY: 0
															}
															setSectionForm({
																...sectionForm,
																rowConfig: [...(sectionForm.rowConfig || []), newRow],
																rows: newRowNumber
															})
														}}
													>
														Add Row
													</Button>
												</Box>
												<TableContainer component={MuiPaper} variant="outlined">
													<Table size="small">
														<TableHead>
															<TableRow>
																<TableCell>Row #</TableCell>
																<TableCell>Row Label</TableCell>
																<TableCell>Seat Count</TableCell>
																<TableCell>Start Seat #</TableCell>
																<TableCell>Left Aisle</TableCell>
																<TableCell>Right Aisle</TableCell>
																<TableCell>X Offset</TableCell>
																<TableCell>Y Offset</TableCell>
																<TableCell align="right">Actions</TableCell>
															</TableRow>
														</TableHead>
														<TableBody>
															{(sectionForm.rowConfig || []).map((row, index) => (
																<TableRow key={index}>
																	<TableCell>{row.rowNumber}</TableCell>
																	<TableCell>
																		<TextField
																			size="small"
																			value={row.rowLabel || `R${row.rowNumber}`}
																			onChange={(e) => {
																				const updated = [...(sectionForm.rowConfig || [])]
																				updated[index].rowLabel = e.target.value
																				setSectionForm({ ...sectionForm, rowConfig: updated })
																			}}
																			placeholder="R1"
																		/>
																	</TableCell>
																	<TableCell>
																		<TextField
																			size="small"
																			type="number"
																			value={row.seatCount || 0}
																			onChange={(e) => {
																				const updated = [...(sectionForm.rowConfig || [])]
																				updated[index].seatCount = parseInt(e.target.value) || 0
																				setSectionForm({ ...sectionForm, rowConfig: updated })
																			}}
																			inputProps={{ min: 0 }}
																		/>
																	</TableCell>
																	<TableCell>
																		<TextField
																			size="small"
																			type="number"
																			value={row.startSeatNumber || 1}
																			onChange={(e) => {
																				const updated = [...(sectionForm.rowConfig || [])]
																				updated[index].startSeatNumber = parseInt(e.target.value) || 1
																				setSectionForm({ ...sectionForm, rowConfig: updated })
																			}}
																			inputProps={{ min: 1 }}
																		/>
																	</TableCell>
																	<TableCell>
																		<TextField
																			size="small"
																			type="number"
																			value={row.aisleLeft || 0}
																			onChange={(e) => {
																				const updated = [...(sectionForm.rowConfig || [])]
																				updated[index].aisleLeft = parseInt(e.target.value) || 0
																				setSectionForm({ ...sectionForm, rowConfig: updated })
																			}}
																			inputProps={{ min: 0 }}
																			helperText="Seats to skip"
																		/>
																	</TableCell>
																	<TableCell>
																		<TextField
																			size="small"
																			type="number"
																			value={row.aisleRight || 0}
																			onChange={(e) => {
																				const updated = [...(sectionForm.rowConfig || [])]
																				updated[index].aisleRight = parseInt(e.target.value) || 0
																				setSectionForm({ ...sectionForm, rowConfig: updated })
																			}}
																			inputProps={{ min: 0 }}
																			helperText="Seats to skip"
																		/>
																	</TableCell>
																	<TableCell>
																		<TextField
																			size="small"
																			type="number"
																			value={row.offsetX || 0}
																			onChange={(e) => {
																				const updated = [...(sectionForm.rowConfig || [])]
																				updated[index].offsetX = parseFloat(e.target.value) || 0
																				setSectionForm({ ...sectionForm, rowConfig: updated })
																			}}
																		/>
																	</TableCell>
																	<TableCell>
																		<TextField
																			size="small"
																			type="number"
																			value={row.offsetY || 0}
																			onChange={(e) => {
																				const updated = [...(sectionForm.rowConfig || [])]
																				updated[index].offsetY = parseFloat(e.target.value) || 0
																				setSectionForm({ ...sectionForm, rowConfig: updated })
																			}}
																		/>
																	</TableCell>
																	<TableCell align="right">
																		<MuiIconButton
																			size="small"
																			color="error"
																			onClick={() => {
																				const updated = (sectionForm.rowConfig || []).filter((_, i) => i !== index)
																				// Renumber remaining rows
																				updated.forEach((r, i) => {
																					r.rowNumber = i + 1
																					if (!r.rowLabel || r.rowLabel.startsWith('R')) {
																						r.rowLabel = `R${i + 1}`
																					}
																				})
																				setSectionForm({
																					...sectionForm,
																					rowConfig: updated,
																					rows: updated.length
																				})
																			}}
																		>
																			<Delete fontSize="small" />
																		</MuiIconButton>
																	</TableCell>
																</TableRow>
															))}
															{(!sectionForm.rowConfig || sectionForm.rowConfig.length === 0) && (
																<TableRow>
																	<TableCell colSpan={9} align="center" sx={{ py: 3 }}>
																		<Typography variant="body2" color="textSecondary">
																			No rows configured. Click "Add Row" to add rows.
																		</Typography>
																	</TableCell>
																</TableRow>
															)}
														</TableBody>
													</Table>
												</TableContainer>
												<Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
													💡 <strong>Tip:</strong> Use this when rows have different lengths. For example, if row 1 has 20 seats but row 2 has 18 seats (due to an aisle), configure them separately.
												</Typography>
											</Box>
										</Grid>
									)}

									<Grid item xs={12}>
										<TextField
											label="Base Price (in cents, e.g., 5000 = €50.00)"
											type="number"
											value={sectionForm.basePrice}
											onChange={(e) => setSectionForm({ ...sectionForm, basePrice: parseInt(e.target.value) || 0 })}
											fullWidth
											inputProps={{ min: 0 }}
											helperText="Default price for seats in this section. Can be overridden per seat later."
										/>
									</Grid>
								</Grid>

								<Grid container spacing={2}>
									<Grid item xs={6}>
										<TextField
											label="Color"
											type="color"
											value={sectionForm.color}
											onChange={(e) => setSectionForm({ ...sectionForm, color: e.target.value })}
											fullWidth
										/>
									</Grid>
									<Grid item xs={6}>
										<TextField
											label="Stroke Color"
											type="color"
											value={sectionForm.strokeColor}
											onChange={(e) => setSectionForm({ ...sectionForm, strokeColor: e.target.value })}
											fullWidth
										/>
									</Grid>
								</Grid>

								<FormControlLabel
									control={
										<Checkbox
											checked={sectionForm.accessible}
											onChange={(e) => setSectionForm({ ...sectionForm, accessible: e.target.checked })}
										/>
									}
									label="Wheelchair Accessible"
								/>

								<TextField
									label="Price Tier"
									value={sectionForm.priceTier}
									onChange={(e) => setSectionForm({ ...sectionForm, priceTier: e.target.value })}
									fullWidth
								/>
							</Box>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setEditingSection(null)}>Cancel</Button>
							<Button onClick={handleSaveSection} variant="contained" disabled={!sectionForm.name}>
								Save Section
							</Button>
						</DialogActions>
					</Dialog>
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button onClick={handleSave} variant="contained">
					Save Configuration
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default SectionEditor

