'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
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
	IconButton as MuiIconButton,
	Drawer,
	AppBar,
	Toolbar,
	Snackbar,
	Accordion,
	AccordionSummary,
	AccordionDetails
} from '@mui/material'
import { Delete, Add, Edit, Undo, Redo, Save, Close, ExpandMore } from '@mui/icons-material'
import Swal from 'sweetalert2'
import VenueCanvasEditor from './VenueCanvasEditor'

// Simple debounce utility
const debounce = (func, delay) => {
	let timeoutId
	return (...args) => {
		clearTimeout(timeoutId)
		timeoutId = setTimeout(() => func(...args), delay)
	}
}

// Configure SweetAlert2 to appear above MUI Drawer (z-index: 1200)
const SwalConfig = Swal.mixin({
	didOpen: () => {
		// Ensure Swal container has higher z-index than MUI Drawer
		const swalContainer = document.querySelector('.swal2-container')
		if (swalContainer) {
			swalContainer.style.zIndex = '9999'
		}
	}
})

/**
 * Section Editor Content Component
 * Main content for section configuration (without Dialog wrapper)
 * Can be used in a full page or modal
 */
const SectionEditorContent = ({
	venue,
	manifest = null, // Manifest with places for showing actual seats
	onSave,
	saving = false
}) => {
	const canvasRef = useRef(null)
	const [sections, setSections] = useState([])
	const [centralFeature, setCentralFeature] = useState(null)
	const [editingSection, setEditingSection] = useState(null)
	const [activeTab, setActiveTab] = useState(0) // 0: Sections, 1: Central Feature

	// Local venue state for immediate UI updates (especially for SVG settings)
	const [localVenue, setLocalVenue] = useState(venue)

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
		rowConfig: [],
		obstructions: [], // Obstructions/blocked areas within this section
		presentationStyle: 'flat',
		groundDirection: null, // Optional: null means no direction indicator
		seatNumberingDirection: 'left-to-right', // Seat numbering direction
		showRowLabels: true, // Show row labels on seat map
		spacingConfig: {
			topPadding: 40,
			seatSpacingMultiplier: 0.65,
			rowSpacingMultiplier: 0.75,
			curveDepthMultiplier: 0.7,
			seatRadius: 7,
			seatSpacingVisual: 1.3,
			rowSpacingVisual: 1.2,
			topMargin: 60
		}
	})
	const [rowConfigMode, setRowConfigMode] = useState('uniform')
	const [editingObstruction, setEditingObstruction] = useState(null) // Track which section's obstructions we're editing
	const [currentObstruction, setCurrentObstruction] = useState(null) // Track obstruction being drawn on canvas
	const [obstructionDrawMode, setObstructionDrawMode] = useState(null) // 'obstruction-rectangle' or 'obstruction-polygon'
	const [obstructionForm, setObstructionForm] = useState({
		id: undefined,
		name: '',
		type: 'obstruction',
		shape: 'rectangle',
		bounds: undefined,
		polygon: undefined,
		color: '#CCCCCC',
		strokeColor: '#999999'
	})
	const [selectedSectionId, setSelectedSectionId] = useState(null) // Track selected section
	const sectionRefs = useRef({}) // Store refs for each section to enable auto-scroll
	const onSaveRef = useRef(onSave) // Store onSave in ref to avoid stale closures

	// Update ref when onSave changes
	useEffect(() => {
		onSaveRef.current = onSave
	}, [onSave])

	// Debounced save for SVG settings (silent, no modal)
	// Use useRef to store the debounced function so it doesn't get recreated
	const debouncedSaveSvgSettingsRef = useRef(
		debounce(async (updatedVenue) => {
			if (onSaveRef.current) {
				try {
					// Silent background save - pass true as second parameter to skip modal
					await onSaveRef.current(updatedVenue, true)
				} catch (error) {
					console.error('Failed to auto-save SVG settings:', error)
				}
			}
		}, 800)
	)

	const debouncedSaveSvgSettings = debouncedSaveSvgSettingsRef.current

	// Update local venue when prop changes
	useEffect(() => {
		if (venue) {
			setLocalVenue(venue)
		}
	}, [venue])

	// Auto-scroll to selected section when it changes
	useEffect(() => {
		if (selectedSectionId && sectionRefs.current[selectedSectionId]) {
			sectionRefs.current[selectedSectionId].scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
				inline: 'nearest'
			})
		}
	}, [selectedSectionId])

	useEffect(() => {
		if (venue) {
			const initialSections = venue.sections || []
			const initialFeature = venue.centralFeature || {
				type: 'none',
				directionLabel: 'Kenttä' // Default direction label
			}
			setSections(initialSections)
			setCentralFeature(initialFeature)
			setHistory([{ sections: initialSections, centralFeature: initialFeature }])
			setHistoryIndex(0)
		}
	}, [venue])

	const saveToHistory = (newSections, newCentralFeature) => {
		const newState = {
			sections: JSON.parse(JSON.stringify(newSections)),
			centralFeature: newCentralFeature ? JSON.parse(JSON.stringify(newCentralFeature)) : null
		}
		const newHistory = history.slice(0, historyIndex + 1)
		newHistory.push(newState)
		if (newHistory.length > 50) {
			newHistory.shift()
			setHistoryIndex(newHistory.length - 1)
		} else {
			setHistoryIndex(newHistory.length - 1)
		}
		setHistory(newHistory)
	}

	const handleUndo = () => {
		if (historyIndex > 0) {
			const prevIndex = historyIndex - 1
			const prevState = history[prevIndex]
			setSections(prevState.sections)
			setCentralFeature(prevState.centralFeature)
			setHistoryIndex(prevIndex)
		}
	}

	const handleRedo = () => {
		if (historyIndex < history.length - 1) {
			const nextIndex = historyIndex + 1
			const nextState = history[nextIndex]
			setSections(nextState.sections)
			setCentralFeature(nextState.centralFeature)
			setHistoryIndex(nextIndex)
		}
	}

	useEffect(() => {
		const handleKeyDown = (e) => {
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
	}, [historyIndex, history])

	const handleAddSection = () => {
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
			polygon: undefined,
			rowConfig: [],
			presentationStyle: 'flat',
			groundDirection: null,
			seatNumberingDirection: 'left-to-right',
			showRowLabels: true,
			spacingConfig: {
				topPadding: 40,
				seatSpacingMultiplier: 0.65,
				rowSpacingMultiplier: 0.75,
				curveDepthMultiplier: 0.7,
				seatRadius: 7,
				seatSpacingVisual: 1.3,
				rowSpacingVisual: 1.2,
				topMargin: 60
			}
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
			bounds: section.bounds || undefined,
			polygon: section.polygon || undefined,
			rowConfig: section.rowConfig || [],
			obstructions: section.obstructions || [],
			presentationStyle: section.presentationStyle || 'flat',
			groundDirection: section.groundDirection || null,
			seatNumberingDirection: section.seatNumberingDirection || 'left-to-right',
			showRowLabels: section.showRowLabels !== false, // Default to true if not set
			spacingConfig: section.spacingConfig || {
				topPadding: 40,
				seatSpacingMultiplier: 0.65,
				rowSpacingMultiplier: 0.75,
				curveDepthMultiplier: 0.7,
				seatRadius: 7,
				seatSpacingVisual: 1.3,
				rowSpacingVisual: 1.2,
				topMargin: 60
			}
		})
	}

	const handleDeleteSection = async (sectionId) => {
		const sectionToDelete = sections.find(s => s.id === sectionId)
		const sectionName = sectionToDelete?.name || 'Section'

		// Confirm deletion
		const result = await SwalConfig.fire({
			icon: 'warning',
			title: 'Delete Section?',
			html: `Are you sure you want to delete <strong>${sectionName}</strong>?<br/><br/>This action cannot be undone.`,
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel'
		})

		if (!result.isConfirmed) {
			return
		}

		const newSections = sections.filter(s => s.id !== sectionId)
		setSections(newSections)
		saveToHistory(newSections, centralFeature)

		// Save to backend immediately after updating local state
		if (onSaveRef.current) {
			try {
				await onSaveRef.current({
					sections: newSections,
					centralFeature
				})
				SwalConfig.fire({
					icon: 'success',
					title: 'Section Deleted',
					text: `${sectionName} has been deleted successfully`,
					timer: 2000,
					showConfirmButton: false
				})
			} catch (error) {
				console.error('Failed to delete section:', error)
				// Revert local state on error
				setSections(sections)
				saveToHistory(sections, centralFeature)
				SwalConfig.fire({
					icon: 'error',
					title: 'Delete Failed',
					text: error.response?.data?.message || 'Failed to delete section. Please try again.',
					timer: 3000
				})
			}
		}
	}

	/**
	 * Calculate polygon area using shoelace formula
	 */
	const calculatePolygonArea = (polygon) => {
		if (!polygon || polygon.length < 3) return 0
		let area = 0
		for (let i = 0; i < polygon.length; i++) {
			const j = (i + 1) % polygon.length
			area += polygon[i].x * polygon[j].y
			area -= polygon[j].x * polygon[i].y
		}
		return Math.abs(area / 2)
	}

	/**
	 * Calculate required area based on seat configuration
	 */
	const calculateRequiredArea = (sectionForm, rowConfigMode) => {
		// Get layout config from venue (default spacing values)
		const seatSpacing = venue?.layoutConfig?.seatSpacing || 2
		const rowSpacing = venue?.layoutConfig?.rowSpacing || 3

		if (rowConfigMode === 'variable' && sectionForm.rowConfig && sectionForm.rowConfig.length > 0) {
			// Calculate from rowConfig
			const sortedRows = [...sectionForm.rowConfig].sort((a, b) => (a.rowNumber || 0) - (b.rowNumber || 0))
			const totalRows = sortedRows.length

			// Find maximum seats in any row (including aisles)
			const maxSeatsPerRow = Math.max(...sortedRows.map(row => {
				const seatCount = row.seatCount || 0
				const aisleLeft = row.aisleLeft || 0
				const aisleRight = row.aisleRight || 0
				return seatCount + aisleLeft + aisleRight
			}))

			// Estimate required dimensions
			// For pixel coordinates, use adaptive spacing
			const estimatedSeatSpacing = seatSpacing > 1 ? seatSpacing : 20 // Default 20px if spacing is too small
			const estimatedRowSpacing = rowSpacing > 1 ? rowSpacing : 30 // Default 30px if spacing is too small

			const requiredWidth = maxSeatsPerRow * estimatedSeatSpacing
			const requiredHeight = totalRows * estimatedRowSpacing

			return requiredWidth * requiredHeight
		} else {
			// Fallback to capacity-based estimate
			const capacity = sectionForm.capacity || (sectionForm.rows || 0) * (sectionForm.seatsPerRow || 0)
			if (capacity === 0) return 0

			// Estimate: assume seats need at least seatSpacing x rowSpacing area each
			const estimatedSeatSpacing = seatSpacing > 1 ? seatSpacing : 20
			const estimatedRowSpacing = rowSpacing > 1 ? rowSpacing : 30
			return capacity * estimatedSeatSpacing * estimatedRowSpacing
		}
	}

	/**
	 * Calculate actual area from bounds or polygon
	 */
	const calculateActualArea = (sectionForm) => {
		if (sectionForm.shape === 'polygon' && sectionForm.polygon && sectionForm.polygon.length >= 3) {
			return calculatePolygonArea(sectionForm.polygon)
		} else if (sectionForm.shape === 'rectangle' && sectionForm.bounds) {
			const { x1, y1, x2, y2 } = sectionForm.bounds
			if (x1 !== undefined && x2 !== undefined && y1 !== undefined && y2 !== undefined) {
				const width = Math.abs(x2 - x1)
				const height = Math.abs(y2 - y1)
				return width * height
			}
		}
		return 0
	}

	/**
	 * Scale polygon to meet required area
	 * Scales proportionally around the center point
	 */
	const scalePolygonToArea = (polygon, requiredArea) => {
		if (!polygon || polygon.length < 3) return polygon

		const currentArea = calculatePolygonArea(polygon)
		if (currentArea <= 0) return polygon

		// Calculate scale factor (area scales with square of linear scale)
		const scaleFactor = Math.sqrt(requiredArea / currentArea)

		// Calculate center point of polygon
		const centerX = polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length
		const centerY = polygon.reduce((sum, p) => sum + p.y, 0) / polygon.length

		// Scale each point around the center
		return polygon.map(point => ({
			...point,
			x: centerX + (point.x - centerX) * scaleFactor,
			y: centerY + (point.y - centerY) * scaleFactor
		}))
	}

	/**
	 * Scale rectangle bounds to meet required area
	 */
	const scaleBoundsToArea = (bounds, requiredArea) => {
		if (!bounds || bounds.x1 === undefined || bounds.x2 === undefined ||
			bounds.y1 === undefined || bounds.y2 === undefined) return bounds

		const width = Math.abs(bounds.x2 - bounds.x1)
		const height = Math.abs(bounds.y2 - bounds.y1)
		const currentArea = width * height

		if (currentArea <= 0) return bounds

		// Calculate scale factor (area scales with square of linear scale)
		const scaleFactor = Math.sqrt(requiredArea / currentArea)

		// Calculate center point
		const centerX = (bounds.x1 + bounds.x2) / 2
		const centerY = (bounds.y1 + bounds.y2) / 2

		// Calculate new dimensions
		const newWidth = width * scaleFactor
		const newHeight = height * scaleFactor

		// Scale around center
		return {
			x1: centerX - newWidth / 2,
			y1: centerY - newHeight / 2,
			x2: centerX + newWidth / 2,
			y2: centerY + newHeight / 2
		}
	}

	const handleSaveSection = () => {
		if (!sectionForm.name || !sectionForm.name.trim()) {
			SwalConfig.fire({
				icon: 'error',
				title: 'Validation Error',
				text: 'Section name is required'
			})
			return
		}

		const isEditing = editingSection && editingSection.id
		const existingSection = isEditing ? sections.find(s => s.id === editingSection.id) : null

		let bounds = sectionForm.bounds
		let polygon = sectionForm.polygon

		if (isEditing && existingSection) {
			if (sectionForm.shape === 'polygon' && existingSection.polygon) {
				polygon = existingSection.polygon
			} else if (sectionForm.shape === 'rectangle' && existingSection.bounds) {
				bounds = existingSection.bounds
			}
		}

		// ALWAYS require a drawn shape on the canvas (no empty sections)
		const hasPolygon = sectionForm.shape === 'polygon' && polygon && polygon.length >= 3
		const hasBounds = sectionForm.shape === 'rectangle' && bounds &&
			bounds.x1 !== undefined && bounds.x2 !== undefined &&
			bounds.y1 !== undefined && bounds.y2 !== undefined

		if (!hasPolygon && !hasBounds) {
			SwalConfig.fire({
				icon: 'warning',
				title: 'Section Must Be Drawn',
				html: sectionForm.shape === 'polygon'
					? 'Please draw the polygon on the canvas first.<br/><br/>Click the <strong>Polygon tool</strong> in the canvas toolbar, then click points to outline the section shape on the map.'
					: 'Please draw the rectangle on the canvas first.<br/><br/>Click the <strong>Rectangle tool</strong> in the canvas toolbar, then drag to define the section area on the map.',
				confirmButtonText: 'OK',
				icon: 'info'
			})
			return
		}

		// Validate that polygon/bounds exist for sections with seat configuration
		const hasSeatConfiguration = (rowConfigMode === 'variable' && sectionForm.rowConfig && sectionForm.rowConfig.length > 0) ||
			(sectionForm.capacity > 0) ||
			(sectionForm.rows > 0 && sectionForm.seatsPerRow > 0)

		if (hasSeatConfiguration) {
			// Check if polygon/bounds exist
			const hasPolygon = sectionForm.shape === 'polygon' && polygon && polygon.length >= 3
			const hasBounds = sectionForm.shape === 'rectangle' && bounds &&
				bounds.x1 !== undefined && bounds.x2 !== undefined &&
				bounds.y1 !== undefined && bounds.y2 !== undefined

			if (!hasPolygon && !hasBounds) {
				SwalConfig.fire({
					icon: 'warning',
					title: 'Missing Section Area',
					html: sectionForm.shape === 'polygon'
						? 'Please draw the polygon on the canvas first. Click the polygon tool in the toolbar, then click points to outline the section shape.'
						: 'Please draw the rectangle on the canvas first. Click the rectangle tool in the toolbar, then drag to define the section area.',
					confirmButtonText: 'OK'
				})
				return
			}

			// Calculate areas and compare
			const requiredArea = calculateRequiredArea(sectionForm, rowConfigMode)
			const actualArea = calculateActualArea({ ...sectionForm, bounds, polygon })

			if (requiredArea > 0 && actualArea > 0) {
				const areaRatio = requiredArea / actualArea
				if (areaRatio > 1.05) {
					// Required area is 5%+ larger than actual (insufficient)
					const shortfall = ((areaRatio - 1) * 100).toFixed(1)

					// Calculate what spacing multiplier would be needed to fit
					// Area scales with square of linear dimensions, so spacing scale = sqrt(actualArea/requiredArea)
					const suggestedSpacingScale = Math.sqrt(actualArea / requiredArea) * 0.95 // 5% buffer
					const currentSeatSpacing = sectionForm.spacingConfig?.seatSpacingMultiplier || 0.65
					const currentRowSpacing = sectionForm.spacingConfig?.rowSpacingMultiplier || 0.75
					const currentSeatRadius = sectionForm.spacingConfig?.seatRadius || 7

					// Calculate new values
					const newSeatSpacing = Math.max(0.1, Math.min(1.0, currentSeatSpacing * suggestedSpacingScale))
					const newRowSpacing = Math.max(0.1, Math.min(1.0, currentRowSpacing * suggestedSpacingScale))
					const newSeatRadius = Math.max(2, Math.min(20, currentSeatRadius * suggestedSpacingScale))

					SwalConfig.fire({
						icon: 'warning',
						title: 'Insufficient Area',
						html: `The configured seats require approximately <strong>${requiredArea.toFixed(0)}</strong> square units, but the drawn area is only <strong>${actualArea.toFixed(0)}</strong> square units.<br/><br/>The section is <strong>${shortfall}%</strong> too small.<br/><br/><strong>Choose an option:</strong><br/>• <strong>Auto-Expand</strong>: Enlarge the polygon to fit all seats<br/>• <strong>Auto-Adjust Spacing</strong>: Reduce seat size & spacing to fit in current polygon<br/>• <strong>Keep Current Size</strong>: Save as-is (some seats may overflow)`,
						showCancelButton: true,
						showDenyButton: true,
						confirmButtonText: 'Auto-Expand Polygon',
						cancelButtonText: 'Auto-Adjust Spacing',
						denyButtonText: 'Keep Current Size',
						confirmButtonColor: '#1976d2',
						cancelButtonColor: '#4caf50',
						denyButtonColor: '#ff9800'
					}).then((result) => {
						if (result.isConfirmed) {
							// Auto-expand the polygon/bounds
							let expandedBounds = bounds
							let expandedPolygon = polygon

							if (sectionForm.shape === 'polygon' && polygon && polygon.length >= 3) {
								expandedPolygon = scalePolygonToArea(polygon, requiredArea * 1.1) // Add 10% buffer
								const updatedForm = { ...sectionForm, polygon: expandedPolygon }
								setSectionForm(updatedForm)
								polygon = expandedPolygon

								if (isEditing && existingSection) {
									const updatedSections = sections.map(s =>
										s.id === existingSection.id
											? { ...s, polygon: expandedPolygon }
											: s
									)
									setSections(updatedSections)
								}
							} else if (sectionForm.shape === 'rectangle' && bounds) {
								expandedBounds = scaleBoundsToArea(bounds, requiredArea * 1.1)
								const updatedForm = { ...sectionForm, bounds: expandedBounds }
								setSectionForm(updatedForm)
								bounds = expandedBounds

								if (isEditing && existingSection) {
									const updatedSections = sections.map(s =>
										s.id === existingSection.id
											? { ...s, bounds: expandedBounds }
											: s
									)
									setSections(updatedSections)
								}
							}

							SwalConfig.fire({
								icon: 'success',
								title: 'Area Expanded',
								text: `The ${sectionForm.shape === 'polygon' ? 'polygon' : 'rectangle'} has been automatically expanded to fit the required area.`,
								timer: 2000,
								showConfirmButton: false
							}).then(() => {
								proceedWithSave(bounds, polygon, isEditing, existingSection)
							})
						} else if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
							// User clicked "Auto-Adjust Spacing" - reduce seat size and spacing to fit
							const adjustedSpacingConfig = {
								...sectionForm.spacingConfig,
								seatSpacingMultiplier: parseFloat(newSeatSpacing.toFixed(2)),
								rowSpacingMultiplier: parseFloat(newRowSpacing.toFixed(2)),
								seatRadius: parseFloat(newSeatRadius.toFixed(1))
							}

							const updatedForm = { ...sectionForm, spacingConfig: adjustedSpacingConfig }
							setSectionForm(updatedForm)

							SwalConfig.fire({
								icon: 'success',
								title: 'Spacing Adjusted',
								html: `Seat spacing reduced to fit within polygon:<br/>• Seat Spacing: ${currentSeatSpacing.toFixed(2)} → <strong>${newSeatSpacing.toFixed(2)}</strong><br/>• Row Spacing: ${currentRowSpacing.toFixed(2)} → <strong>${newRowSpacing.toFixed(2)}</strong><br/>• Seat Radius: ${currentSeatRadius.toFixed(1)}px → <strong>${newSeatRadius.toFixed(1)}px</strong>`,
								timer: 3000,
								showConfirmButton: false
							}).then(() => {
								proceedWithSave(bounds, polygon, isEditing, existingSection, adjustedSpacingConfig)
							})
						} else if (result.isDenied) {
							// User clicked "Keep Current Size"
							proceedWithSave(bounds, polygon, isEditing, existingSection)
						}
					})
					return
				} else if (areaRatio < 0.5) {
					// Actual area is much larger than required (wasteful but not blocking)
					const excess = ((1 - areaRatio) * 100).toFixed(1)
					SwalConfig.fire({
						icon: 'info',
						title: 'Large Area',
						html: `The drawn area (<strong>${actualArea.toFixed(0)}</strong> square units) is much larger than required (<strong>${requiredArea.toFixed(0)}</strong> square units).<br/><br/>The section is <strong>${excess}%</strong> larger than needed.<br/><br/>Would you like to automatically shrink the ${sectionForm.shape === 'polygon' ? 'polygon' : 'rectangle'} to fit, or continue with the current size?`,
						showCancelButton: true,
						showDenyButton: true,
						confirmButtonText: 'Auto-Shrink',
						cancelButtonText: 'Keep Current Size',
						denyButtonText: 'Cancel',
						confirmButtonColor: '#1976d2',
						cancelButtonColor: '#ff9800',
						denyButtonColor: '#d32f2f'
					}).then((result) => {
						if (result.isConfirmed) {
							// Auto-shrink the polygon/bounds
							let shrunkBounds = bounds
							let shrunkPolygon = polygon

							if (sectionForm.shape === 'polygon' && polygon && polygon.length >= 3) {
								shrunkPolygon = scalePolygonToArea(polygon, requiredArea * 1.1) // Add 10% buffer
								// Update sectionForm with shrunk polygon so it's visible in the form
								const updatedForm = { ...sectionForm, polygon: shrunkPolygon }
								setSectionForm(updatedForm)
								// Update polygon variable for saving
								polygon = shrunkPolygon

								// If editing an existing section, update it in the sections array so canvas shows the change
								if (isEditing && existingSection) {
									const updatedSections = sections.map(s =>
										s.id === existingSection.id
											? { ...s, polygon: shrunkPolygon }
											: s
									)
									setSections(updatedSections)
								}
							} else if (sectionForm.shape === 'rectangle' && bounds) {
								shrunkBounds = scaleBoundsToArea(bounds, requiredArea * 1.1) // Add 10% buffer
								// Update sectionForm with shrunk bounds so it's visible in the form
								const updatedForm = { ...sectionForm, bounds: shrunkBounds }
								setSectionForm(updatedForm)
								// Update bounds variable for saving
								bounds = shrunkBounds

								// If editing an existing section, update it in the sections array so canvas shows the change
								if (isEditing && existingSection) {
									const updatedSections = sections.map(s =>
										s.id === existingSection.id
											? { ...s, bounds: shrunkBounds }
											: s
									)
									setSections(updatedSections)
								}
							}

							// Show confirmation
							SwalConfig.fire({
								icon: 'success',
								title: 'Area Shrunk',
								text: `The ${sectionForm.shape === 'polygon' ? 'polygon' : 'rectangle'} has been automatically shrunk to fit the required area.`,
								timer: 2000,
								showConfirmButton: false
							}).then(() => {
								proceedWithSave(bounds, polygon, isEditing, existingSection)
							})
						} else if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
							// User clicked "Keep Current Size"
							proceedWithSave(bounds, polygon, isEditing, existingSection)
						}
						// If user clicked "Cancel" (deny), do nothing - dialog is already closed
					})
					return
				}
			}
		}

		proceedWithSave(bounds, polygon, isEditing, existingSection)
	}

	const proceedWithSave = async (bounds, polygon, isEditing, existingSection, adjustedSpacingConfig = null) => {
		if (!isEditing && sectionForm.shape !== 'polygon' && (!bounds || (bounds.x1 === undefined && bounds.x2 === undefined && bounds.y1 === undefined && bounds.y2 === undefined))) {
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

		// Calculate capacity: if using variable rows, calculate from rowConfig; otherwise use explicit capacity or rows*seatsPerRow
		let calculatedCapacity = sectionForm.capacity
		if (rowConfigMode === 'variable' && sectionForm.rowConfig && sectionForm.rowConfig.length > 0) {
			// Auto-calculate capacity from rowConfig
			calculatedCapacity = sectionForm.rowConfig.reduce((sum, row) => {
				return sum + (row.seatCount || 0)
			}, 0)
		} else if (!calculatedCapacity && sectionForm.rows && sectionForm.seatsPerRow) {
			// Calculate from rows * seatsPerRow if capacity not set
			calculatedCapacity = sectionForm.rows * sectionForm.seatsPerRow
		}

		// Use adjusted spacing config if provided (from auto-adjust), otherwise use form values
		const finalSpacingConfig = adjustedSpacingConfig || sectionForm.spacingConfig || {
			topPadding: 40,
			seatSpacingMultiplier: 0.65,
			rowSpacingMultiplier: 0.75,
			curveDepthMultiplier: 0.7,
			seatRadius: 7,
			seatSpacingVisual: 1.3,
			rowSpacingVisual: 1.2,
			topMargin: 60
		}

		const sectionData = {
			id: editingSection?.id || `section-${Date.now()}`,
			name: sectionForm.name,
			type: sectionForm.type,
			shape: sectionForm.shape,
			capacity: calculatedCapacity || 0,
			rows: sectionForm.rows,
			seatsPerRow: sectionForm.seatsPerRow,
			color: sectionForm.color,
			strokeColor: sectionForm.strokeColor,
			accessible: sectionForm.accessible,
			features: sectionForm.features,
			priceTier: sectionForm.priceTier,
			basePrice: sectionForm.basePrice,
			bounds: sectionForm.shape === 'polygon' ? undefined : bounds,
			polygon: sectionForm.shape === 'polygon' ? polygon : undefined,
			rowConfig: rowConfigMode === 'variable' ? (sectionForm.rowConfig || []) : undefined,
			obstructions: sectionForm.obstructions || [],
			presentationStyle: sectionForm.presentationStyle || 'flat',
			groundDirection: sectionForm.groundDirection || null,
			seatNumberingDirection: sectionForm.seatNumberingDirection || 'left-to-right',
			showRowLabels: sectionForm.showRowLabels !== false,
			spacingConfig: finalSpacingConfig,
			displayOrder: isEditing ? (existingSection?.displayOrder || sections.length) : sections.length
		}

		let newSections
		if (isEditing) {
			newSections = sections.map(s => s.id === editingSection.id ? sectionData : s)
		} else {
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

		// Save to backend immediately after updating local state
		if (onSaveRef.current) {
			try {
				await onSaveRef.current({
					sections: newSections,
					centralFeature
				})
				SwalConfig.fire({
					icon: 'success',
					title: 'Section Saved',
					text: isEditing ? 'Section updated successfully' : 'Section added successfully',
					timer: 2000,
					showConfirmButton: false
				})
			} catch (error) {
				console.error('Failed to save section:', error)
				SwalConfig.fire({
					icon: 'error',
					title: 'Save Failed',
					text: error.response?.data?.message || 'Failed to save section. Please try again.',
					timer: 3000
				})
			}
		}
	}

	const handleAddObstruction = () => {
		setEditingObstruction(editingSection?.id)
		setObstructionForm({
			id: undefined,
			name: '',
			type: 'obstruction',
			shape: 'rectangle',
			bounds: undefined,
			polygon: undefined,
			color: '#CCCCCC',
			strokeColor: '#999999'
		})
	}

	const handleEditObstruction = (obstruction) => {
		setEditingObstruction(editingSection?.id)
		setObstructionForm({
			id: obstruction.id,
			name: obstruction.name || '',
			type: obstruction.type || 'obstruction',
			shape: obstruction.shape || 'rectangle',
			bounds: obstruction.bounds || undefined,
			polygon: obstruction.polygon || undefined,
			color: obstruction.color || '#CCCCCC',
			strokeColor: obstruction.strokeColor || '#999999'
		})
	}

	const handleSaveObstruction = () => {
		if (!editingSection) return

		const obstructionData = {
			id: obstructionForm.id || `obstruction-${Date.now()}`,
			name: obstructionForm.name || 'Obstruction',
			type: obstructionForm.type || 'obstruction',
			shape: obstructionForm.shape,
			bounds: obstructionForm.shape === 'polygon' ? undefined : obstructionForm.bounds,
			polygon: obstructionForm.shape === 'polygon' ? obstructionForm.polygon : undefined,
			color: obstructionForm.color,
			strokeColor: obstructionForm.strokeColor
		}

		const updatedObstructions = [...(sectionForm.obstructions || [])]
		const existingIndex = updatedObstructions.findIndex(o => o.id === obstructionData.id)

		if (existingIndex >= 0) {
			updatedObstructions[existingIndex] = obstructionData
		} else {
			updatedObstructions.push(obstructionData)
		}

		setSectionForm({ ...sectionForm, obstructions: updatedObstructions })
		setEditingObstruction(null)
		setCurrentObstruction(null)
		setObstructionDrawMode(null)
		setObstructionForm({
			id: undefined,
			name: '',
			type: 'obstruction',
			shape: 'rectangle',
			bounds: undefined,
			polygon: undefined,
			color: '#CCCCCC',
			strokeColor: '#999999'
		})
	}

	const handleObstructionAdd = (obstructionData) => {
		// Update the obstruction form with the drawn bounds/polygon
		const updatedForm = {
			...obstructionForm,
			bounds: obstructionData.bounds,
			polygon: obstructionData.polygon
		}
		setObstructionForm(updatedForm)

		// Update the obstruction in sectionForm immediately
		const updatedObstructions = [...(sectionForm.obstructions || [])]
		const existingIndex = updatedObstructions.findIndex(o => o.id === obstructionForm.id)

		const finalObstruction = {
			...obstructionForm,
			...obstructionData
		}

		if (existingIndex >= 0) {
			updatedObstructions[existingIndex] = finalObstruction
		} else {
			updatedObstructions.push(finalObstruction)
		}

		setSectionForm({ ...sectionForm, obstructions: updatedObstructions })
		setCurrentObstruction(null)
		setObstructionDrawMode(null)
	}

	const handleDeleteObstruction = (obstructionId) => {
		const updatedObstructions = (sectionForm.obstructions || []).filter(o => o.id !== obstructionId)
		setSectionForm({ ...sectionForm, obstructions: updatedObstructions })
		saveToHistory(sections, centralFeature)
	}

	// Import the rest of the component content from SectionEditor
	// For brevity, I'll include the key parts - the full form content would be copied from SectionEditor.jsx
	// This is a simplified version - you may want to copy the full form content

	return (
		<Box>
			{/* Toolbar with Undo/Redo */}
			<Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 3 }}>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Tooltip title="Undo (Ctrl+Z)">
						<span>
							<IconButton
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

			<Alert severity="info" sx={{ mb: 3 }}>
				<strong>How it works:</strong> Configure sections first, then when you generate the manifest, seats will be automatically placed within these sections based on the capacity and layout you specify.
			</Alert>

			{/* Step-by-Step Guide for Corner Sections */}
			<Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'info.light', borderLeft: '4px solid', borderColor: 'info.main' }}>
				<Typography variant="subtitle1" gutterBottom fontWeight="bold">
					📐 How to Configure Corner Sections (like "A1 Kulma"):
				</Typography>
				<Box component="ol" sx={{ pl: 3, m: 0, '& li': { mb: 1.5 } }}>
					<li>
						<strong>Click "Add Section"</strong> button (or edit an existing section)
					</li>
					<li>
						<strong>Enter Section Name:</strong> e.g., "A1 Kulma" (Kulma = Corner in Finnish)
					</li>
					<li>
						<strong>Select Shape:</strong> Choose <strong>"Polygon (Irregular)"</strong> for corner/triangular sections
					</li>
					<li>
						<strong>Set Capacity & Rows:</strong> Enter total capacity and number of rows (e.g., 10 rows)
					</li>
					<li>
						<strong>Configure Variable Rows:</strong>
						<ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
							<li>Select <strong>"Variable Rows"</strong> radio option</li>
							<li>Add rows one by one with different seat counts</li>
							<li>Example: Row 1 = 4 seats, Row 2 = 6 seats, Row 3 = 8 seats, etc.</li>
							<li>Set aisle gaps (Left/Right) if needed</li>
						</ul>
					</li>
					<li>
						<strong>Draw on Canvas:</strong>
						<ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
							<li>Click the <strong>Polygon tool</strong> (Edit icon) in the canvas toolbar</li>
							<li>Click points on the canvas to outline the corner section shape</li>
							<li>Double-click to finish the polygon</li>
							<li>The section will be created with your drawn shape</li>
						</ul>
					</li>
					<li>
						<strong>Save Section:</strong> Click "Save Section" to add it to your venue
					</li>
				</Box>
				<Alert severity="warning" sx={{ mt: 2 }}>
					<strong>Important:</strong> For polygon sections, you MUST draw the shape on the canvas. The form alone won't create the polygon - you need to use the polygon drawing tool.
				</Alert>
			</Paper>

			<Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
				<Tab label="Sections" />
				<Tab label="Central Feature (Optional)" />
			</Tabs>

			{activeTab === 0 && (
				<Grid container spacing={3}>
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

					<Grid item xs={12} md={8}>
						<Paper elevation={1} sx={{ p: 2 }}>
							<Typography variant="subtitle2" gutterBottom>
								Visual Preview
							</Typography>
							<Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
								This shows a preview of your sections. You can draw section boundaries here, or configure them using the form on the right. Use fullscreen and zoom controls for better precision.
							</Typography>
						<VenueCanvasEditor
							width={1200}
							height={800}
							sections={sections}
							centralFeature={centralFeature}
							venue={localVenue}
							manifest={manifest}
							directionLabel={centralFeature?.directionLabel || centralFeature?.name || localVenue?.centralFeature?.directionLabel || 'Kenttä'}
								onSectionAdd={(sectionData) => {
									// If a section form is open (adding or editing), update the form instead of creating a new section
									if (editingSection !== null && editingSection !== undefined) {
										// Update the form with the drawn bounds/polygon
										setSectionForm(prev => ({
											...prev,
											shape: sectionData.shape,
											bounds: sectionData.bounds,
											polygon: sectionData.polygon
										}))
										return // Don't create a new section
									}

									// Otherwise, create a new section immediately (when no form is open)
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
								onObstructionAdd={handleObstructionAdd}
								onSelectionChange={(sectionId) => setSelectedSectionId(sectionId)}
								drawingObstruction={currentObstruction}
								mode="advanced"
							/>
						</Paper>
					</Grid>

					<Grid item xs={12} md={4}>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							<Button
								variant="contained"
								startIcon={<Add />}
								onClick={handleAddSection}
								fullWidth
								size="large"
							>
								Add New Section
							</Button>

							{sections.length > 0 && (
								<Typography variant="body2" color="textSecondary">
									{sections.length} section{sections.length !== 1 ? 's' : ''} configured
								</Typography>
							)}

							<Box
								sx={{
									maxHeight: '600px',
									overflowY: 'auto',
									display: 'flex',
									flexDirection: 'column',
									gap: 2,
									pr: 1
								}}
							>
								{sections.map((section) => (
									<Paper
										key={section.id}
										ref={(el) => {
											if (el) {
												sectionRefs.current[section.id] = el
											}
										}}
										elevation={selectedSectionId === section.id ? 3 : 1}
										sx={{
											p: 2,
											border: selectedSectionId === section.id ? '2px solid #1976d2' : '1px solid transparent',
											backgroundColor: selectedSectionId === section.id ? '#e3f2fd' : 'white',
											cursor: 'pointer',
											transition: 'all 0.2s',
											'&:hover': {
												backgroundColor: selectedSectionId === section.id ? '#e3f2fd' : '#f5f5f5'
											}
										}}
										onClick={() => setSelectedSectionId(section.id)}
									>
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
											{section.isTicketed === false && (
												<Chip
													label={section.nonTicketedReason || "Non-Ticketed"}
													size="small"
													color="warning"
													variant="outlined"
												/>
											)}
											{section.accessible && <Chip label="Accessible" size="small" color="success" />}
											{section.capacity > 0 && section.isTicketed !== false && <Chip label={`${section.capacity} seats`} size="small" />}
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
						Define the central feature (ice rink, stage, field, etc.) that sections will be arranged around. The feature will only appear on the canvas once you set its dimensions below.
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<FormControl fullWidth>
								<InputLabel>Feature Type</InputLabel>
								<Select
									value={centralFeature?.type || 'none'}
									label="Feature Type"
									onChange={(e) => {
										const newFeature = {
											...centralFeature,
											type: e.target.value,
											// All feature types default to rectangle (rink, stage, field, court are all rectangular)
											shape: 'rectangle'
										}
										setCentralFeature(newFeature)
										saveToHistory(sections, newFeature)
									}}
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
										onChange={(e) => {
											const newFeature = { ...centralFeature, name: e.target.value }
											setCentralFeature(newFeature)
											saveToHistory(sections, newFeature)
										}}
										fullWidth
										placeholder="e.g., Ice Rink, Main Stage"
									/>
								</Grid>
								<Grid item xs={12}>
									<TextField
										label="Direction Label (for arrow indicator)"
										value={centralFeature?.directionLabel || centralFeature?.name || 'Kenttä'}
										onChange={(e) => {
											const newFeature = { ...centralFeature, directionLabel: e.target.value }
											setCentralFeature(newFeature)
											saveToHistory(sections, newFeature)
										}}
										fullWidth
										helperText="Label shown on the direction arrow (e.g., 'Kenttä', 'Field', 'Stage'). The arrow points up towards this direction."
										placeholder="e.g., Kenttä, Field, Stage"
									/>
								</Grid>
								{centralFeature?.shape === 'rectangle' && (
									<>
										<Grid item xs={6}>
											<TextField
												label="X Position"
												type="number"
												value={centralFeature?.x || 0}
												onChange={(e) => {
													const newFeature = { ...centralFeature, x: parseInt(e.target.value) || 0 }
													setCentralFeature(newFeature)
													saveToHistory(sections, newFeature)
												}}
												fullWidth
											/>
										</Grid>
										<Grid item xs={6}>
											<TextField
												label="Y Position"
												type="number"
												value={centralFeature?.y || 0}
												onChange={(e) => {
													const newFeature = { ...centralFeature, y: parseInt(e.target.value) || 0 }
													setCentralFeature(newFeature)
													saveToHistory(sections, newFeature)
												}}
												fullWidth
											/>
										</Grid>
										<Grid item xs={6}>
											<TextField
												label="Width"
												type="number"
												value={centralFeature?.width || 100}
												onChange={(e) => {
													const newFeature = { ...centralFeature, width: parseInt(e.target.value) || 100 }
													setCentralFeature(newFeature)
													saveToHistory(sections, newFeature)
												}}
												fullWidth
											/>
										</Grid>
										<Grid item xs={6}>
											<TextField
												label="Height"
												type="number"
												value={centralFeature?.height || 100}
												onChange={(e) => {
													const newFeature = { ...centralFeature, height: parseInt(e.target.value) || 100 }
													setCentralFeature(newFeature)
													saveToHistory(sections, newFeature)
												}}
												fullWidth
											/>
										</Grid>
									</>
								)}
								{centralFeature?.shape === 'rectangle' && (
									<Grid item xs={12}>
										<Alert severity="info" sx={{ mt: 1 }}>
											💡 <strong>Tip:</strong> Set the position and dimensions above to see the central feature on the canvas. Leave at 0 if you haven't planned the layout yet.
										</Alert>
									</Grid>
								)}
								{centralFeature?.shape === 'circle' && (
									<>
										<Grid item xs={6}>
											<TextField
												label="Center X"
												type="number"
												value={centralFeature?.centerX || 400}
												onChange={(e) => {
													const newFeature = { ...centralFeature, centerX: parseInt(e.target.value) || 400 }
													setCentralFeature(newFeature)
													saveToHistory(sections, newFeature)
												}}
												fullWidth
											/>
										</Grid>
										<Grid item xs={6}>
											<TextField
												label="Center Y"
												type="number"
												value={centralFeature?.centerY || 300}
												onChange={(e) => {
													const newFeature = { ...centralFeature, centerY: parseInt(e.target.value) || 300 }
													setCentralFeature(newFeature)
													saveToHistory(sections, newFeature)
												}}
												fullWidth
											/>
										</Grid>
										<Grid item xs={12}>
											<TextField
												label="Radius"
												type="number"
												value={centralFeature?.radiusX || 50}
												onChange={(e) => {
													const newFeature = {
														...centralFeature,
														radiusX: parseInt(e.target.value) || 50,
														radiusY: parseInt(e.target.value) || 50
													}
													setCentralFeature(newFeature)
													saveToHistory(sections, newFeature)
												}}
												fullWidth
											/>
										</Grid>
										<Grid item xs={12}>
											<Alert severity="info" sx={{ mt: 1 }}>
												💡 <strong>Tip:</strong> Set the center position and radius above to see the central feature on the canvas.
											</Alert>
										</Grid>
									</>
								)}
								<Grid item xs={6}>
									<TextField
										label="Fill Color"
										type="color"
										value={centralFeature?.color || '#E3F2FD'}
										onChange={(e) => {
											const newFeature = { ...centralFeature, color: e.target.value }
											setCentralFeature(newFeature)
											saveToHistory(sections, newFeature)
										}}
										fullWidth
									/>
								</Grid>
								<Grid item xs={6}>
									<TextField
										label="Stroke Color"
										type="color"
										value={centralFeature?.strokeColor || '#1976D2'}
										onChange={(e) => {
											const newFeature = { ...centralFeature, strokeColor: e.target.value }
											setCentralFeature(newFeature)
											saveToHistory(sections, newFeature)
										}}
										fullWidth
									/>
								</Grid>

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
															const newFeature = {
																...centralFeature,
																imageUrl: event.target.result
															}
															setCentralFeature(newFeature)
															saveToHistory(sections, newFeature)
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
													const newFeature = {
														...centralFeature,
														imageUrl: null,
														imageWidth: null,
														imageHeight: null
													}
													setCentralFeature(newFeature)
													saveToHistory(sections, newFeature)
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
											const newFeature = { ...centralFeature, imageUrl: url || null }
											setCentralFeature(newFeature)
											if (url) {
												saveToHistory(sections, newFeature)
											}
										}}
										fullWidth
										placeholder="https://mapsapi.tmol.co/maps/geometry/image/33/59/335905..."
										helperText="Enter a direct image URL (supports PNG, JPG, SVG). SVG maps from venue APIs are supported."
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
													const newFeature = { ...centralFeature, imageOpacity: value }
													setCentralFeature(newFeature)
													saveToHistory(sections, newFeature)
												}}
											/>
										</Grid>

										<Grid item xs={6}>
											<TextField
												label="Image Width (Optional)"
												type="number"
												value={centralFeature?.imageWidth || ''}
												onChange={(e) => {
													const newFeature = {
														...centralFeature,
														imageWidth: e.target.value ? parseInt(e.target.value) : null
													}
													setCentralFeature(newFeature)
													saveToHistory(sections, newFeature)
												}}
												fullWidth
												helperText="Leave empty to use shape width"
											/>
										</Grid>
										<Grid item xs={6}>
											<TextField
												label="Image Height (Optional)"
												type="number"
												value={centralFeature?.imageHeight || ''}
												onChange={(e) => {
													const newFeature = {
														...centralFeature,
														imageHeight: e.target.value ? parseInt(e.target.value) : null
													}
													setCentralFeature(newFeature)
													saveToHistory(sections, newFeature)
												}}
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

		{/* SVG Background Settings */}
		{localVenue?.backgroundSvg?.svgContent && (
			<Box sx={{ mt: 4 }}>
				<Accordion>
					<AccordionSummary expandIcon={<ExpandMore />}>
						<Typography variant="h6">Background SVG Settings</Typography>
					</AccordionSummary>
					<AccordionDetails>
						<Grid container spacing={2}>
							<Grid item xs={12}>
								<FormControlLabel
									control={
										<Checkbox
											checked={localVenue.backgroundSvg.isVisible ?? true}
											onChange={(e) => {
												const updatedVenue = {
													...localVenue,
													backgroundSvg: {
														...localVenue.backgroundSvg,
														isVisible: e.target.checked
													}
												}
												setLocalVenue(updatedVenue)
												debouncedSaveSvgSettings(updatedVenue)
											}}
										/>
									}
									label="Show Background SVG"
								/>
							</Grid>

							<Grid item xs={12}>
								<Typography gutterBottom>
									Opacity: {((localVenue.backgroundSvg.opacity || 0.5) * 100).toFixed(0)}%
								</Typography>
								<Slider
									value={(localVenue.backgroundSvg.opacity || 0.5) * 100}
									onChange={(e, v) => {
										const updatedVenue = {
											...localVenue,
											backgroundSvg: {
												...localVenue.backgroundSvg,
												opacity: v / 100
											}
										}
										setLocalVenue(updatedVenue)
										debouncedSaveSvgSettings(updatedVenue)
									}}
									min={0}
									max={100}
								/>
							</Grid>

							<Grid item xs={12}>
								<Typography gutterBottom>
									Scale: {(localVenue.backgroundSvg.scale || 1.0).toFixed(1)}x
								</Typography>
								<Slider
									value={localVenue.backgroundSvg.scale || 1.0}
									onChange={(e, v) => {
										const updatedVenue = {
											...localVenue,
											backgroundSvg: {
												...localVenue.backgroundSvg,
												scale: v
											}
										}
										setLocalVenue(updatedVenue)
										debouncedSaveSvgSettings(updatedVenue)
									}}
									min={0.1}
									max={3}
									step={0.1}
								/>
							</Grid>

							<Grid item xs={6}>
								<TextField
									label="Position X"
									type="number"
									value={localVenue.backgroundSvg.translateX || 0}
									onChange={(e) => {
										const updatedVenue = {
											...localVenue,
											backgroundSvg: {
												...localVenue.backgroundSvg,
												translateX: parseFloat(e.target.value) || 0
											}
										}
										setLocalVenue(updatedVenue)
										debouncedSaveSvgSettings(updatedVenue)
									}}
									fullWidth
								/>
							</Grid>

							<Grid item xs={6}>
								<TextField
									label="Position Y"
									type="number"
									value={localVenue.backgroundSvg.translateY || 0}
									onChange={(e) => {
										const updatedVenue = {
											...localVenue,
											backgroundSvg: {
												...localVenue.backgroundSvg,
												translateY: parseFloat(e.target.value) || 0
											}
										}
										setLocalVenue(updatedVenue)
										debouncedSaveSvgSettings(updatedVenue)
									}}
									fullWidth
								/>
							</Grid>

							<Grid item xs={12}>
								<Typography gutterBottom>
									Rotation: {localVenue.backgroundSvg.rotation || 0}°
								</Typography>
								<Slider
									value={localVenue.backgroundSvg.rotation || 0}
									onChange={(e, v) => {
										const updatedVenue = {
											...localVenue,
											backgroundSvg: {
												...localVenue.backgroundSvg,
												rotation: v
											}
										}
										setLocalVenue(updatedVenue)
										debouncedSaveSvgSettings(updatedVenue)
									}}
									min={0}
									max={360}
								/>
							</Grid>

							<Grid item xs={12}>
								<Button
									variant="outlined"
									onClick={() => {
										const updatedVenue = {
											...localVenue,
											backgroundSvg: {
												...localVenue.backgroundSvg,
												opacity: 0.5,
												scale: 1.0,
												translateX: 0,
												translateY: 0,
												rotation: 0
											}
										}
										setLocalVenue(updatedVenue)
										debouncedSaveSvgSettings(updatedVenue)
									}}
								>
									Reset Transforms
								</Button>
							</Grid>
						</Grid>
					</AccordionDetails>
				</Accordion>
			</Box>
		)}

		{/* Section Form Drawer */}
		<Drawer
				anchor="right"
				open={editingSection !== null && editingSection !== undefined}
				onClose={() => setEditingSection(null)}
				PaperProps={{
					sx: {
						width: { xs: '100%', sm: '95%', md: '1000px', lg: '1200px', xl: '1400px' },
						maxWidth: '100vw'
					}
				}}
			>
				<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
					{/* Header */}
					<AppBar position="static" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
						<Toolbar>
							<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
								{editingSection && editingSection.id ? 'Edit Section' : 'Add New Section'}
							</Typography>
							<IconButton edge="end" onClick={() => setEditingSection(null)}>
								<Close />
							</IconButton>
						</Toolbar>
						<Box sx={{ px: 2, pb: 1 }}>
							<Typography variant="caption" color="textSecondary">
								Configure section details. The capacity and layout settings will determine how seats are placed when you generate the manifest.
							</Typography>
						</Box>
					</AppBar>

					{/* Content - Scrollable */}
					<Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						<TextField
							label="Section Name"
							value={sectionForm.name || ''}
							onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
							required
							fullWidth
							helperText="e.g., 'Section A', 'VIP Lounge', 'Upper Level', 'A1 Kulma'"
							inputProps={{
								autoComplete: 'off',
								spellCheck: 'false'
							}}
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

						<Box sx={{ mt: 2, mb: 2 }}>
							<FormControlLabel
								control={
									<Checkbox
										checked={sectionForm.isTicketed !== false} // Default to true if undefined
										onChange={(e) => setSectionForm({
											...sectionForm,
											isTicketed: e.target.checked,
											// Clear base price and capacity if not ticketed
											...(e.target.checked ? {} : { nonTicketedReason: sectionForm.nonTicketedReason || '' })
										})}
									/>
								}
								label={
									<Box>
										<Typography variant="body1" fontWeight="medium">
											Available for Ticket Sales
										</Typography>
										<Typography variant="body2" color="textSecondary">
											Uncheck if this is a non-ticketed area (entrance, exit, concession, restroom, etc.)
										</Typography>
									</Box>
								}
							/>
						</Box>

						{sectionForm.isTicketed === false && (
							<TextField
								label="Purpose / Reason"
								value={sectionForm.nonTicketedReason || ''}
								onChange={(e) => setSectionForm({ ...sectionForm, nonTicketedReason: e.target.value })}
								fullWidth
								placeholder="e.g., Entrance, Exit, Concession Stand, Restrooms, Staff Area"
								helperText="Optional: Describe what this area is used for"
								sx={{ mb: 2 }}
							/>
						)}

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
									: 'Polygon sections (like corner sections "A1 Kulma") must be drawn on the canvas. Click the polygon tool in the canvas toolbar, then click points to outline the shape.'}
							</FormHelperText>
						</FormControl>

						{sectionForm.shape === 'polygon' && (
							<Alert severity="info" sx={{ mt: 1 }}>
								<strong>For Corner Sections (e.g., "A1 Kulma"):</strong>
								<Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
									<li>Use <strong>Polygon shape</strong> for triangular/corner sections</li>
									<li>Click the <strong>Polygon tool</strong> (Edit icon) in the canvas toolbar</li>
									<li>Click 3-4 points to outline the corner shape</li>
									<li>Double-click to finish the polygon</li>
									<li>Use <strong>Variable Rows</strong> below to configure different seat counts per row</li>
								</Box>
							</Alert>
						)}

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

						{sectionForm.isTicketed !== false && (
						<Grid container spacing={2}>
							<Grid item xs={12}>
								<TextField
									label="Capacity (Total Seats)"
									type="number"
									value={rowConfigMode === 'variable' && sectionForm.rowConfig && sectionForm.rowConfig.length > 0
										? sectionForm.rowConfig.reduce((sum, row) => sum + (row.seatCount || 0), 0)
										: sectionForm.capacity}
									onChange={(e) => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value) || 0 })}
									fullWidth
									inputProps={{ min: 0 }}
									disabled={rowConfigMode === 'variable' && sectionForm.rowConfig && sectionForm.rowConfig.length > 0}
									helperText={
										rowConfigMode === 'variable' && sectionForm.rowConfig && sectionForm.rowConfig.length > 0
											? `Auto-calculated from row configuration: ${sectionForm.rowConfig.reduce((sum, row) => sum + (row.seatCount || 0), 0)} seats`
											: "Total number of seats this section should have. Leave 0 to calculate from rows × seats per row. If using Variable Rows, capacity is auto-calculated from row configuration."
									}
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
											: 'Configure each row individually. Perfect for corner sections (like "A1 Kulma") where rows get progressively longer. Example: Row 1 = 4 seats, Row 2 = 6 seats, Row 3 = 8 seats, etc.'}
									</FormHelperText>
								</FormControl>
							</Grid>

							<Grid item xs={12}>
								<FormControl fullWidth>
									<InputLabel>Ground/Field Direction (Optional)</InputLabel>
									<Select
										value={sectionForm.groundDirection || ''}
										label="Ground/Field Direction (Optional)"
										onChange={(e) => setSectionForm({ ...sectionForm, groundDirection: e.target.value || null })}
									>
										<MenuItem value="">None (No direction indicator)</MenuItem>
										<MenuItem value="up">Up ↑ (Seats face upward towards top)</MenuItem>
										<MenuItem value="down">Down ↓ (Seats face downward towards bottom)</MenuItem>
										<MenuItem value="left">Left ← (Seats face left)</MenuItem>
										<MenuItem value="right">Right → (Seats face right)</MenuItem>
									</Select>
									<FormHelperText>
										Optional: Indicates which direction the seats face (towards the field/stage). Leave as "None" if not needed.
									</FormHelperText>
								</FormControl>
							</Grid>

							<Grid item xs={12}>
								<FormControl fullWidth>
									<InputLabel>Seat Numbering Direction</InputLabel>
									<Select
										value={sectionForm.seatNumberingDirection || 'left-to-right'}
										label="Seat Numbering Direction"
										onChange={(e) => setSectionForm({ ...sectionForm, seatNumberingDirection: e.target.value })}
									>
										<MenuItem value="left-to-right">Left to Right (Seat 1 on left, numbers increase to right)</MenuItem>
										<MenuItem value="right-to-left">Right to Left (Seat 1 on right, numbers increase to left)</MenuItem>
									</Select>
									<FormHelperText>
										Determines which direction seat numbers increase. Left-to-right: seat 1 is on the left. Right-to-left: seat 1 is on the right.
									</FormHelperText>
								</FormControl>
							</Grid>

							<Grid item xs={12}>
								<FormControlLabel
									control={
										<Checkbox
											checked={sectionForm.showRowLabels !== false}
											onChange={(e) => setSectionForm({ ...sectionForm, showRowLabels: e.target.checked })}
										/>
									}
									label="Show Row Labels on Seat Map"
								/>
								<FormHelperText>
									When enabled, row labels (e.g., R1, R2) will be displayed on the left and right sides of each row on the seat map.
								</FormHelperText>
							</Grid>

							<Grid item xs={12}>
								<Divider sx={{ my: 2 }} />
								<Typography variant="h6" sx={{ mb: 2 }}>Spacing & Sizing Configuration</Typography>
								<FormHelperText sx={{ mb: 2 }}>
									Configure visual spacing and sizing for this section. These settings control how seats appear on the seat map.
								</FormHelperText>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									type="number"
									label="Top Padding (px)"
									value={sectionForm.spacingConfig?.topPadding ?? 40}
									onChange={(e) => setSectionForm({
										...sectionForm,
										spacingConfig: {
											...sectionForm.spacingConfig,
											topPadding: parseFloat(e.target.value) || 40
										}
									})}
									inputProps={{ min: 0, step: 1 }}
									helperText="Space from top of section (default: 40px)"
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									type="number"
									label="Seat Dot Radius (px)"
									value={sectionForm.spacingConfig?.seatRadius ?? 7}
									onChange={(e) => setSectionForm({
										...sectionForm,
										spacingConfig: {
											...sectionForm.spacingConfig,
											seatRadius: parseFloat(e.target.value) || 7
										}
									})}
									inputProps={{ min: 1, max: 20, step: 1 }}
									helperText="Size of seat dots (default: 7px)"
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									type="number"
									label="Seat Spacing Multiplier (Backend)"
									value={sectionForm.spacingConfig?.seatSpacingMultiplier ?? 0.65}
									onChange={(e) => setSectionForm({
										...sectionForm,
										spacingConfig: {
											...sectionForm.spacingConfig,
											seatSpacingMultiplier: parseFloat(e.target.value) || 0.65
										}
									})}
									inputProps={{ min: 0.1, max: 1.0, step: 0.05 }}
									helperText="Backend seat spacing (0.65 = 35% reduction, default: 0.65)"
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									type="number"
									label="Row Spacing Multiplier (Backend)"
									value={sectionForm.spacingConfig?.rowSpacingMultiplier ?? 0.75}
									onChange={(e) => setSectionForm({
										...sectionForm,
										spacingConfig: {
											...sectionForm.spacingConfig,
											rowSpacingMultiplier: parseFloat(e.target.value) || 0.75
										}
									})}
									inputProps={{ min: 0.1, max: 1.0, step: 0.05 }}
									helperText="Backend row spacing (0.75 = 25% reduction, default: 0.75)"
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									type="number"
									label="Seat Spacing Multiplier (Frontend)"
									value={sectionForm.spacingConfig?.seatSpacingVisual ?? 1.3}
									onChange={(e) => setSectionForm({
										...sectionForm,
										spacingConfig: {
											...sectionForm.spacingConfig,
											seatSpacingVisual: parseFloat(e.target.value) || 1.3
										}
									})}
									inputProps={{ min: 1.0, max: 2.0, step: 0.1 }}
									helperText="Visual spacing between seats (1.3 = 30% more, default: 1.3)"
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									type="number"
									label="Row Spacing Multiplier (Frontend)"
									value={sectionForm.spacingConfig?.rowSpacingVisual ?? 1.2}
									onChange={(e) => setSectionForm({
										...sectionForm,
										spacingConfig: {
											...sectionForm.spacingConfig,
											rowSpacingVisual: parseFloat(e.target.value) || 1.2
										}
									})}
									inputProps={{ min: 1.0, max: 2.0, step: 0.1 }}
									helperText="Visual spacing between rows (1.2 = 20% more, default: 1.2)"
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									type="number"
									label="Curve Depth Multiplier"
									value={sectionForm.spacingConfig?.curveDepthMultiplier ?? 0.7}
									onChange={(e) => setSectionForm({
										...sectionForm,
										spacingConfig: {
											...sectionForm.spacingConfig,
											curveDepthMultiplier: parseFloat(e.target.value) || 0.7
										}
									})}
									inputProps={{ min: 0.1, max: 2.0, step: 0.1 }}
									helperText="Curve depth for cone/fan style (0.7 = 7% of row width)"
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									type="number"
									label="Rotation Angle (degrees)"
									value={sectionForm.spacingConfig?.rotationAngle ?? 0}
									onChange={(e) => setSectionForm({
										...sectionForm,
										spacingConfig: {
											...sectionForm.spacingConfig,
											rotationAngle: parseFloat(e.target.value) || 0
										}
									})}
									inputProps={{ min: -180, max: 180, step: 1 }}
									helperText="Rotate seats around section center. 20° = slight angle, 90° = sideways"
								/>
								<Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
									Example: 20° for trapezoidal sections, 90° for vertical orientation
								</Typography>
								<Box sx={{
									mt: 1,
									p: 1,
									border: '1px solid',
									borderColor: 'divider',
									borderRadius: 1,
									fontFamily: 'monospace',
									fontSize: '0.75rem',
									color: 'text.secondary',
									whiteSpace: 'pre-line'
								}}>
{`Rotation Examples:
  0°: ▭▭▭ (normal horizontal)
 20°: ▭▭▭ (slightly angled)
 90°: ▯▯▯ (vertical)
-45°: ▭▭▭ (counter-clockwise)`}
								</Box>
							</Grid>

							{sectionForm.presentationStyle === 'cone' && (
								<Grid item xs={12} md={6}>
									<FormControl fullWidth>
										<InputLabel>Curve Direction</InputLabel>
										<Select
											value={sectionForm.spacingConfig?.curveDirection || 'frown'}
											label="Curve Direction"
											onChange={(e) => setSectionForm({
												...sectionForm,
												spacingConfig: {
													...sectionForm.spacingConfig,
													curveDirection: e.target.value
												}
											})}
										>
											<MenuItem value="frown">Frown ⌢ (edges curve UP toward stage)</MenuItem>
											<MenuItem value="smile">Smile ⌣ (edges curve DOWN away from stage)</MenuItem>
										</Select>
										<FormHelperText>
											Frown = theater-style rows curving toward stage (default)
										</FormHelperText>
									</FormControl>
								</Grid>
							)}

							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									type="number"
									label="Top Margin (px)"
									value={sectionForm.spacingConfig?.topMargin ?? 60}
									onChange={(e) => setSectionForm({
										...sectionForm,
										spacingConfig: {
											...sectionForm.spacingConfig,
											topMargin: parseFloat(e.target.value) || 60
										}
									})}
									inputProps={{ min: 0, step: 1 }}
									helperText="Top margin for frontend rendering (default: 60px)"
								/>
							</Grid>

							{rowConfigMode === 'variable' && (
								<Grid item xs={12}>
									<Divider sx={{ my: 2 }} />
									<FormControl fullWidth>
										<InputLabel>Seating Presentation Style</InputLabel>
										<Select
											value={sectionForm.presentationStyle || 'flat'}
											label="Seating Presentation Style"
											onChange={(e) => setSectionForm({ ...sectionForm, presentationStyle: e.target.value })}
										>
											<MenuItem value="flat">Flat (Both sides unchanged)</MenuItem>
											<MenuItem value="cone">Cone/Fan Shape (Both sides expand outward)</MenuItem>
											<MenuItem value="left_fixed">Left Fixed (Left stays same, right expands)</MenuItem>
											<MenuItem value="right_fixed">Right Fixed (Right stays same, left expands)</MenuItem>
										</Select>
										<FormHelperText>
											{sectionForm.presentationStyle === 'flat' && 'Standard rectangular arrangement. Both left and right sides maintain consistent width across all rows. Use this when rows have different seat counts but you want uniform spacing.'}
											{sectionForm.presentationStyle === 'cone' && 'Fan-shaped arrangement. Both left and right sides expand outward as rows progress, creating a cone/fan shape. Perfect for corner sections or curved venues where rows get progressively longer.'}
											{sectionForm.presentationStyle === 'left_fixed' && 'Left side remains fixed width, right side expands outward. Useful when left side is against a wall or boundary and rows get longer on the right.'}
											{sectionForm.presentationStyle === 'right_fixed' && 'Right side remains fixed width, left side expands outward. Useful when right side is against a wall or boundary and rows get longer on the left.'}
											<br />
											<strong>Note:</strong> Presentation styles only apply when rows have different seat counts. If all rows have the same number of seats, the style will have no effect.
										</FormHelperText>
									</FormControl>
								</Grid>
							)}

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
														offsetY: 0,
														blockedSeats: []
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
														<TableCell>Blocked Seats</TableCell>
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
																	placeholder="0"
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
																	placeholder="0"
																/>
															</TableCell>
															<TableCell>
																<TextField
																	size="small"
																	value={(row.blockedSeats || []).join(',')}
																	onChange={(e) => {
																		const updated = [...(sectionForm.rowConfig || [])]
																		const value = e.target.value
																		if (value === '') {
																			updated[index].blockedSeats = []
																		} else {
																			updated[index].blockedSeats = value
																				.split(',')
																				.map(s => parseInt(s.trim()))
																				.filter(n => !isNaN(n))
																		}
																		setSectionForm({ ...sectionForm, rowConfig: updated })
																	}}
																	placeholder="e.g., 5,6,7"
																	helperText="Comma-separated grid positions"
																	sx={{ minWidth: '100px' }}
																	inputProps={{
																		inputMode: 'text',
																		autoComplete: 'off'
																	}}
																/>
															</TableCell>
															<TableCell>
																<Tooltip title="Shift the entire row horizontally (left/right) by this many pixels. Use for fine-tuning alignment. Positive = right, Negative = left.">
																	<span>
																		<TextField
																			size="small"
																			type="number"
																			value={row.offsetX || 0}
																			onChange={(e) => {
																				const updated = [...(sectionForm.rowConfig || [])]
																				updated[index].offsetX = parseFloat(e.target.value) || 0
																				setSectionForm({ ...sectionForm, rowConfig: updated })
																			}}
																			placeholder="0"
																		/>
																	</span>
																</Tooltip>
															</TableCell>
															<TableCell>
																<Tooltip title="Shift the entire row vertically (up/down) by this many pixels. Use for fine-tuning alignment. Positive = down, Negative = up.">
																	<span>
																		<TextField
																			size="small"
																			type="number"
																			value={row.offsetY || 0}
																			onChange={(e) => {
																				const updated = [...(sectionForm.rowConfig || [])]
																				updated[index].offsetY = parseFloat(e.target.value) || 0
																				setSectionForm({ ...sectionForm, rowConfig: updated })
																			}}
																			placeholder="0"
																		/>
																	</span>
																</Tooltip>
															</TableCell>
															<TableCell align="right">
																<MuiIconButton
																	size="small"
																	color="error"
																	onClick={() => {
																		const updated = (sectionForm.rowConfig || []).filter((_, i) => i !== index)
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

							{/* Area Calculation Display */}
							{(rowConfigMode === 'variable' && sectionForm.rowConfig && sectionForm.rowConfig.length > 0) ||
							(sectionForm.capacity > 0) ||
							(sectionForm.rows > 0 && sectionForm.seatsPerRow > 0) ? (
								<Grid item xs={12}>
									{(() => {
										const requiredArea = calculateRequiredArea(sectionForm, rowConfigMode)
										const actualArea = calculateActualArea(sectionForm)
										const hasArea = actualArea > 0
										const areaRatio = hasArea && requiredArea > 0 ? requiredArea / actualArea : 0

										if (!hasArea) {
											return (
												<Alert
													severity="warning"
													sx={{
														position: 'fixed',
														top: 20,
														right: 20,
														zIndex: 9999,
														maxWidth: '500px',
														boxShadow: 3
													}}
												>
													<strong>No area defined:</strong> Please draw the {sectionForm.shape === 'polygon' ? 'polygon' : 'rectangle'} on the canvas first. The section needs a defined area to place seats.
												</Alert>
											)
										}

										if (areaRatio > 1.05) {
											// Required area is larger than actual (insufficient)
											const shortfall = ((areaRatio - 1) * 100).toFixed(1)
											return (
												<Alert
													severity="warning"
													sx={{
														position: 'fixed',
														top: 20,
														right: 20,
														zIndex: 9999,
														maxWidth: '500px',
														boxShadow: 3
													}}
												>
													<strong>Insufficient Area:</strong> Required {requiredArea.toFixed(0)} sq units, drawn {actualArea.toFixed(0)} sq units ({shortfall}% too small). Click "Save Section" to expand polygon OR auto-adjust spacing.
												</Alert>
											)
										} else if (areaRatio < 0.9) {
											// Actual area is 10%+ larger than required (excess)
											const excess = ((1 - areaRatio) * 100).toFixed(1)
											return (
												<Alert
													severity="info"
													sx={{
														position: 'fixed',
														top: 20,
														right: 20,
														zIndex: 9999,
														maxWidth: '500px',
														boxShadow: 3
													}}
												>
													<strong>Large Area:</strong> Drawn area (<strong>{actualArea.toFixed(0)}</strong> sq units) is larger than required (<strong>{requiredArea.toFixed(0)}</strong> sq units). The section is <strong>{excess}%</strong> larger than needed. Click "Save Section" to auto-shrink.
												</Alert>
											)
										} else {
											// Area ratio is between 0.9 and 1.05 (good fit, within 10% tolerance)
											return (
												<Alert
													severity="success"
													sx={{
														position: 'fixed',
														top: 20,
														right: 20,
														zIndex: 9999,
														maxWidth: '500px',
														boxShadow: 3
													}}
												>
													<strong>Area Check:</strong> Required area: <strong>{requiredArea.toFixed(0)}</strong> sq units, Actual area: <strong>{actualArea.toFixed(0)}</strong> sq units. ✓ Good fit! (within 10% tolerance)
												</Alert>
											)
										}
									})()}
								</Grid>
							) : null}

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
						)}

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


						</Box>
					</Box>

					{/* Footer Actions */}
					<Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
							<Button onClick={() => {
								setEditingSection(null)
								setEditingObstruction(null)
							}}>
								Cancel
							</Button>
							<Button onClick={handleSaveSection} variant="contained" disabled={!sectionForm.name} size="large">
								Save Section
							</Button>
						</Box>
					</Box>
				</Box>
			</Drawer>

			{/* Obstruction Form Drawer - Keep as drawer for consistency */}
			<Drawer
				anchor="right"
				open={editingObstruction !== null && editingObstruction === editingSection?.id}
				onClose={() => setEditingObstruction(null)}
				PaperProps={{
					sx: {
						width: { xs: '100%', sm: '500px' },
						maxWidth: '100vw'
					}
				}}
			>
				<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
					<AppBar position="static" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
						<Toolbar>
							<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
								{obstructionForm.id ? 'Edit Obstruction' : 'Add Obstruction'}
							</Typography>
							<IconButton edge="end" onClick={() => setEditingObstruction(null)}>
								<Close />
							</IconButton>
						</Toolbar>
						<Box sx={{ px: 2, pb: 1 }}>
							<Typography variant="caption" color="textSecondary">
								Define an area where seats cannot be placed. Draw this on the canvas or specify coordinates manually.
							</Typography>
						</Box>
					</AppBar>
					<Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<TextField
							label="Obstruction Name"
							value={obstructionForm.name}
							onChange={(e) => setObstructionForm({ ...obstructionForm, name: e.target.value })}
							fullWidth
							placeholder="e.g., Entrance, Pillar, Aisle Block"
						/>

						<FormControl fullWidth>
							<InputLabel>Obstruction Type</InputLabel>
							<Select
								value={obstructionForm.type}
								label="Obstruction Type"
								onChange={(e) => setObstructionForm({ ...obstructionForm, type: e.target.value })}
							>
								<MenuItem value="entrance">Entrance</MenuItem>
								<MenuItem value="pillar">Pillar</MenuItem>
								<MenuItem value="aisle">Aisle</MenuItem>
								<MenuItem value="obstruction">General Obstruction</MenuItem>
								<MenuItem value="custom">Custom</MenuItem>
							</Select>
						</FormControl>

						<FormControl fullWidth>
							<InputLabel>Shape</InputLabel>
							<Select
								value={obstructionForm.shape}
								label="Shape"
								onChange={(e) => setObstructionForm({ ...obstructionForm, shape: e.target.value })}
							>
								<MenuItem value="rectangle">Rectangle</MenuItem>
								<MenuItem value="polygon">Polygon (Irregular)</MenuItem>
							</Select>
							<FormHelperText>
								{obstructionForm.shape === 'rectangle'
									? 'Draw a rectangle on the canvas to define the obstruction area.'
									: 'Draw a polygon on the canvas by clicking points to define the obstruction area.'}
							</FormHelperText>
						</FormControl>

						<Alert severity="info">
							💡 <strong>Tip:</strong> After saving this obstruction form, click "Draw on Canvas" below to draw the obstruction area on the canvas. The bounds will be automatically saved to this obstruction.
						</Alert>

						<Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
							<Button
								variant="outlined"
								fullWidth
								startIcon={<Add />}
								onClick={() => {
									// Ensure obstruction has an ID
									if (!obstructionForm.id) {
										const newId = `obstruction-${Date.now()}`
										setObstructionForm({ ...obstructionForm, id: newId })
										setCurrentObstruction({ ...obstructionForm, id: newId })
									} else {
										setCurrentObstruction(obstructionForm)
									}
									setObstructionDrawMode(obstructionForm.shape === 'polygon' ? 'obstruction-polygon' : 'obstruction-rectangle')
								}}
								disabled={!obstructionForm.name}
							>
								Draw {obstructionForm.shape === 'polygon' ? 'Polygon' : 'Rectangle'} on Canvas
							</Button>
							{currentObstruction && (
								<Button
									variant="outlined"
									color="error"
									onClick={() => {
										setCurrentObstruction(null)
										setObstructionDrawMode(null)
									}}
								>
									Cancel Drawing
								</Button>
							)}
						</Box>
						{currentObstruction && (
							<Alert severity="info" sx={{ mt: 1 }}>
								{obstructionForm.shape === 'polygon'
									? 'Click points on the canvas to define the polygon. Double-click to finish.'
									: 'Click and drag on the canvas to draw the rectangle.'}
							</Alert>
						)}

						<Grid container spacing={2}>
							<Grid item xs={6}>
								<TextField
									label="Color"
									type="color"
									value={obstructionForm.color}
									onChange={(e) => setObstructionForm({ ...obstructionForm, color: e.target.value })}
									fullWidth
								/>
							</Grid>
							<Grid item xs={6}>
								<TextField
									label="Stroke Color"
									type="color"
									value={obstructionForm.strokeColor}
									onChange={(e) => setObstructionForm({ ...obstructionForm, strokeColor: e.target.value })}
									fullWidth
								/>
							</Grid>
						</Grid>
						</Box>
					</Box>
					<Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
							<Button onClick={() => setEditingObstruction(null)}>Cancel</Button>
							<Button onClick={handleSaveObstruction} variant="contained">
								Save Obstruction
							</Button>
						</Box>
					</Box>
				</Box>
			</Drawer>
		</Box>
	)
}

export default SectionEditorContent

