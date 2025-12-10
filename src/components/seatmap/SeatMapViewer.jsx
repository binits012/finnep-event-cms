'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Box, Paper, Typography, IconButton, Tooltip, Button, ButtonGroup } from '@mui/material'
import { ZoomIn, ZoomOut, Fullscreen, FullscreenExit, FitScreen } from '@mui/icons-material'

/**
 * SeatMapViewer Component
 * Interactive viewer/editor for displaying and adjusting venue seats and sections
 */
const SeatMapViewer = (props) => {
	const {
		manifest,
		venue, // Add venue prop (same as SeatMapCanvas)
		width = 800,
		height = 600,
		onSave,
		saving = false,
		// New props for background SVG alignment (stored on venue)
		bgSvgConfig = { translateX: 0, translateY: 0, scale: 1.0 },
		displayConfig = { dotSize: 4, rowGap: 8, seatGap: 8 },
		onBgSvgConfigChange, // Callback to update bgSvgConfig in parent (used in simpleMode)
		// Legacy props (for backward compatibility)
		seatMapConfig,
		onConfigChange,
		simpleMode = false,
		showSections = true // Toggle for showing section boundaries (default: visible)
	} = props

	// Use new props if available, otherwise fall back to legacy seatMapConfig
	const effectiveBgConfig = bgSvgConfig || {
		translateX: seatMapConfig?.offsetX || 0,
		translateY: seatMapConfig?.offsetY || 0,
		scale: 1.0
	}
	const effectiveDisplayConfig = displayConfig || {
		dotSize: seatMapConfig?.dotSize || 4,
		rowGap: seatMapConfig?.rowGap || 8,
		seatGap: seatMapConfig?.seatGap || 8
	}

	// Debug logging
	const canvasRef = useRef(null)
	const containerRef = useRef(null)
	const [scale, setScale] = useState(1)
	const [pan, setPan] = useState({ x: 0, y: 0 })
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [isPanning, setIsPanning] = useState(false)
	const [lastPanPoint, setLastPanPoint] = useState(null)
	const [loadedSvgs, setLoadedSvgs] = useState(new Map())

	// Editing state
	const [isEditMode, setIsEditMode] = useState(false)
	const [selectedSection, setSelectedSection] = useState(null)
	const [selectedSeats, setSelectedSeats] = useState([]) // Array of selected seat indices
	const [draggedItem, setDraggedItem] = useState(null) // 'section', 'seats', or polygon point index
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
	const [hoveredItem, setHoveredItem] = useState(null) // For hover effects
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

	// Temporary dragging offsets for smooth movement
	const [sectionDragOffset, setSectionDragOffset] = useState({ x: 0, y: 0 })
	const [seatsDragOffset, setSeatsDragOffset] = useState({ x: 0, y: 0 })
	const [backgroundDragOffset, setBackgroundDragOffset] = useState({ x: 0, y: 0 })

	// Local copies for editing
	const [localSections, setLocalSections] = useState([])
	const [localPlaces, setLocalPlaces] = useState([])

	// Initialize canvas size - responsive to container
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const updateCanvasSize = () => {
			const container = containerRef.current
			if (container) {
				const rect = container.getBoundingClientRect()
				// Account for padding
				canvas.width = rect.width - 32 // 16px padding on each side
				canvas.height = rect.height - 32
			} else {
				// Default size
				canvas.width = width
				canvas.height = height
			}
		}

		updateCanvasSize()
		window.addEventListener('resize', updateCanvasSize)
		return () => window.removeEventListener('resize', updateCanvasSize)
	}, [width, height, isFullscreen])

	// Handle fullscreen changes
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement)
		}

		document.addEventListener('fullscreenchange', handleFullscreenChange)
		return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
	}, [])

	// Load SVG background if available (from venue data or manifest)
	useEffect(() => {
		const backgroundSvg = manifest?.venue?.backgroundSvg || manifest?.backgroundSvg || props.venue?.backgroundSvg
		console.log('Loading SVG background:', {
			hasManifest: !!manifest,
			hasVenue: !!manifest?.venue,
			hasPropsVenue: !!props.venue,
			backgroundSvg: backgroundSvg,
			svgContentLength: backgroundSvg?.svgContent?.length
		})

		if (backgroundSvg?.svgContent && !loadedSvgs.has(backgroundSvg.svgContent)) {
			const img = new Image()
			img.crossOrigin = 'anonymous'

			let svgDataUrl = backgroundSvg.svgContent

			// Handle different SVG content formats
			if (svgDataUrl.startsWith('data:image/svg+xml')) {
				// Already a proper data URL, use as-is
			} else if (svgDataUrl.startsWith('<svg') || svgDataUrl.startsWith('<?xml')) {
				// Raw SVG content - encode as data URL
				svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDataUrl)}`
			} else if (svgDataUrl.startsWith('data:')) {
				// Some other data URL format, use as-is
			} else {
				// Assume it's base64 encoded SVG content
				try {
					svgDataUrl = `data:image/svg+xml;base64,${svgDataUrl}`
				} catch (e) {
					console.error('Failed to create SVG data URL:', e)
					return
				}
			}

			img.onload = () => {
				setLoadedSvgs(prev => new Map(prev).set(backgroundSvg.svgContent, img))
				redrawCanvas()
			}

			img.onerror = (error) => {
				console.error('Failed to load SVG background:', error)
				console.error('SVG content length:', svgDataUrl.length)
				console.error('SVG content starts with:', svgDataUrl.substring(0, 100))
				console.error('Original SVG content starts with:', backgroundSvg.svgContent.substring(0, 100))
			}

			img.src = svgDataUrl
		}
	}, [manifest?.venue?.backgroundSvg?.svgContent, manifest?.backgroundSvg?.svgContent, props.venue?.backgroundSvg?.svgContent])

	// Redraw canvas when data changes
	const redrawCanvas = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		console.log('SeatMapViewer redrawCanvas - manifest structure:', {
			hasPlaces: !!manifest.places,
			placesCount: manifest.places?.length,
			hasSections: !!manifest.sections,
			sectionsCount: manifest.sections?.length,
			hasVenueSections: !!manifest.venue?.sections,
			venueSectionsCount: manifest.venue?.sections?.length,
			firstPlace: manifest.places?.[0],
			firstPlaceKeys: manifest.places?.[0] ? Object.keys(manifest.places[0]) : null,
			venue: !!manifest.venue,
			propsVenue: !!props.venue
		})

		// Set background color based on mode (for debugging)
		if (simpleMode) {
			ctx.fillStyle = '#f0f8ff' // Light blue background for simple mode
			ctx.fillRect(0, 0, canvas.width, canvas.height)
		}

		// Save context for transformations
		ctx.save()

		// Apply transformations
		ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y)
		ctx.scale(scale, scale)
		ctx.translate(-canvas.width / 2, -canvas.height / 2)

		// Draw background SVG if available (from venue)
		// IMPORTANT: Draw at origin (0,0) with translateX/translateY offsets
		// This matches VenueCanvasEditor's coordinate system where sections/seats are defined
		const backgroundSvg = manifest?.venue?.backgroundSvg || manifest?.backgroundSvg
		if (backgroundSvg?.svgContent) {
			const bgImg = loadedSvgs.get(backgroundSvg.svgContent)
			if (bgImg) {
				// In simpleMode, use the effectiveBgConfig (from UI controls)
				// In normal mode, use the stored backgroundSvg values
				const bgScale = simpleMode ? effectiveBgConfig.scale : (backgroundSvg.scale || 1)
				const bgTranslateX = simpleMode ? effectiveBgConfig.translateX : (backgroundSvg.translateX || 0)
				const bgTranslateY = simpleMode ? effectiveBgConfig.translateY : (backgroundSvg.translateY || 0)
				const bgOpacity = backgroundSvg.opacity || 0.3
				const bgRotation = backgroundSvg.rotation || 0

				ctx.save()
				ctx.globalAlpha = bgOpacity

				// Apply translation - in simpleMode, include drag offset for interactive adjustment
				const totalTranslateX = bgTranslateX + (simpleMode ? backgroundDragOffset.x : 0)
				const totalTranslateY = bgTranslateY + (simpleMode ? backgroundDragOffset.y : 0)
				ctx.translate(totalTranslateX, totalTranslateY)

				// Apply rotation around the center of the image (same as VenueCanvasEditor)
				if (bgRotation !== 0) {
					const centerX = (bgImg.width * bgScale) / 2
					const centerY = (bgImg.height * bgScale) / 2
					ctx.translate(centerX, centerY)
					ctx.rotate((bgRotation * Math.PI) / 180)
					ctx.translate(-centerX, -centerY)
				}

				// Draw at origin (0, 0) - sections and seats are in the same coordinate system
				ctx.drawImage(
					bgImg,
					0,
					0,
					bgImg.width * bgScale,
					bgImg.height * bgScale
				)
				ctx.restore()
			}
		}

		// Draw sections (use local copies for editing)
		// In simpleMode, show sections as semi-transparent outlines for reference (if showSections is true)
		// In edit mode, always show sections
		if (localSections && (showSections || !simpleMode)) {
			localSections.forEach((section, index) => {
				ctx.save()

				// Highlight selected/hovered section
				const isSelected = selectedSection === index
				const isHovered = hoveredItem === `section-${index}`
				const shouldHighlight = isSelected || isHovered

				// In simpleMode, use lighter colors for section outlines (reference only)
				if (simpleMode) {
					ctx.strokeStyle = 'rgba(100, 100, 255, 0.6)' // Semi-transparent blue
					ctx.lineWidth = 2
					ctx.setLineDash([5, 5])
				} else {
					ctx.strokeStyle = shouldHighlight ? '#FF6B35' : (section.strokeColor || section.color || '#000')
					ctx.lineWidth = shouldHighlight ? 3 : 2
					ctx.setLineDash(shouldHighlight ? [] : [5, 5])
				}

				// Apply temporary drag offset if this section is being dragged
				const dragOffset = (isSelected && draggedItem === 'section') ? sectionDragOffset : { x: 0, y: 0 }

				if (section.polygon && section.polygon.length > 0) {
					// Draw polygon with drag offset
					ctx.beginPath()
					ctx.moveTo(section.polygon[0].x + dragOffset.x, section.polygon[0].y + dragOffset.y)
					for (let i = 1; i < section.polygon.length; i++) {
						ctx.lineTo(section.polygon[i].x + dragOffset.x, section.polygon[i].y + dragOffset.y)
					}
					ctx.closePath()
					ctx.stroke()

					// Draw polygon points if selected and in edit mode
					if (isSelected && isEditMode) {
						section.polygon.forEach((point, pointIndex) => {
							const isPointHovered = hoveredItem === `polygon-point-${pointIndex}`
							ctx.fillStyle = isPointHovered ? '#FF4444' : '#FF6B35'
							ctx.beginPath()
							ctx.arc(point.x + dragOffset.x, point.y + dragOffset.y, isPointHovered ? 5 : 4, 0, 2 * Math.PI)
							ctx.fill()
							ctx.strokeStyle = '#fff'
							ctx.lineWidth = 1
							ctx.stroke()
						})
					}
				} else if (section.bounds) {
					// Draw rectangle with drag offset
					const { x, y, width, height } = section.bounds
					ctx.strokeRect(x + dragOffset.x, y + dragOffset.y, width, height)

					// Draw resize handles if selected and in edit mode
					if (isSelected && isEditMode) {
						ctx.fillStyle = '#FF6B35'
						const handles = [
							{ x: x + dragOffset.x, y: y + dragOffset.y }, // nw
							{ x: x + width + dragOffset.x, y: y + dragOffset.y }, // ne
							{ x: x + dragOffset.x, y: y + height + dragOffset.y }, // sw
							{ x: x + width + dragOffset.x, y: y + height + dragOffset.y } // se
						]
						handles.forEach(handle => {
							ctx.beginPath()
							ctx.arc(handle.x, handle.y, 6, 0, 2 * Math.PI)
							ctx.fill()
							ctx.strokeStyle = '#fff'
							ctx.lineWidth = 1
							ctx.stroke()
						})
					}
				}

				// Draw section label
				if (simpleMode) {
					ctx.fillStyle = 'rgba(100, 100, 255, 0.8)' // Semi-transparent blue to match outline
				} else {
					ctx.fillStyle = shouldHighlight ? '#FF6B35' : (section.color || '#000')
				}
				ctx.font = '12px Arial'
				ctx.textAlign = 'center'

				let labelX, labelY
				if (section.polygon && section.polygon.length > 0) {
					// Use centroid of polygon
					const centroid = section.polygon.reduce((acc, point) => ({
						x: acc.x + point.x,
						y: acc.y + point.y
					}), { x: 0, y: 0 })
					labelX = (centroid.x / section.polygon.length) + dragOffset.x
					labelY = (centroid.y / section.polygon.length) + dragOffset.y
				} else if (section.bounds) {
					labelX = section.bounds.x + section.bounds.width / 2 + dragOffset.x
					labelY = section.bounds.y + section.bounds.height / 2 + dragOffset.y
				}

				if (labelX !== undefined && labelY !== undefined) {
					ctx.fillText(section.name, labelX, labelY)
				}

				ctx.restore()
			})
		}

		// Draw seats (use local copies for editing)
		if (localPlaces) {
			// In simpleMode (Seat Map Overview), apply per-section spacing adjustments.
			// rowGap and seatGap scale seats from their section's center.
			// Baseline is 10, values < 10 shrink, values > 10 expand (clamped to max 3.0 for higher spacing)
			const baselineSpacing = 15
			const rawSeatScale = (effectiveDisplayConfig.seatGap || baselineSpacing) / baselineSpacing
			const rawRowScale = (effectiveDisplayConfig.rowGap || baselineSpacing) / baselineSpacing
			// CLAMP to max 3.0 to allow higher spacing values (seats may overflow polygons)
			const seatSpacingScale = simpleMode ? Math.min(3.0, rawSeatScale) : 1
			const rowSpacingScale = simpleMode ? Math.min(3.0, rawRowScale) : 1

			// Group places by section for per-section scaling
			const placesBySection = {}
			localPlaces.forEach((place) => {
				const sectionName = place.section || 'default'
				if (!placesBySection[sectionName]) {
					placesBySection[sectionName] = []
				}
				placesBySection[sectionName].push(place)
			})

			// Calculate section centers for scaling
			const sectionCenters = {}
			Object.keys(placesBySection).forEach(sectionName => {
				const sectionPlaces = placesBySection[sectionName].filter(p => p.x !== null && p.y !== null)
				if (sectionPlaces.length > 0) {
					const sumX = sectionPlaces.reduce((sum, p) => sum + p.x, 0)
					const sumY = sectionPlaces.reduce((sum, p) => sum + p.y, 0)
					sectionCenters[sectionName] = {
						x: sumX / sectionPlaces.length,
						y: sumY / sectionPlaces.length
					}
				}
			})

			localPlaces.forEach((place, index) => {
				if (place.x !== null && place.y !== null) {
					ctx.save()

					// Seat color based on selection/hover status
					const isSelected = selectedSeats.includes(index)
					const isHovered = hoveredItem === `seat-${index}`
					const shouldHighlight = isSelected || isHovered
					ctx.fillStyle = shouldHighlight ? '#FF6B35' : '#4CAF50' // Orange for selected/hovered, green for available
					ctx.strokeStyle = shouldHighlight ? '#E53935' : '#2E7D32'
					ctx.lineWidth = shouldHighlight ? 2 : 1

					// Apply temporary drag offset if this seat is being dragged
					const dragOffset = (isSelected && draggedItem === 'seats') ? seatsDragOffset : { x: 0, y: 0 }
					const seatmapDragOffset = (draggedItem === 'seatmap') ? sectionDragOffset : { x: 0, y: 0 }

					// SeatMapViewer shows raw coordinates with only uniform visual controls
					// This ensures consistency across all presentation styles
					let seatX = place.x
					let seatY = place.y

					// Only apply uniform displayConfig scaling for row gap/seat gap controls
					// No section-specific transformations to avoid presentation style differences
					if (simpleMode && (seatSpacingScale !== 1 || rowSpacingScale !== 1)) {
						// Use overall map center for uniform scaling across all seats
						const mapCenterX = (Math.min(...localPlaces.map(p => p.x)) + Math.max(...localPlaces.map(p => p.x))) / 2
						const mapCenterY = (Math.min(...localPlaces.map(p => p.y)) + Math.max(...localPlaces.map(p => p.y))) / 2

						seatX = mapCenterX + (place.x - mapCenterX) * seatSpacingScale
						seatY = mapCenterY + (place.y - mapCenterY) * rowSpacingScale
					}

					// Draw seat as circle with drag offset - use displayConfig for SeatMapViewer
					const dotRadius = simpleMode ? effectiveDisplayConfig.dotSize : (shouldHighlight ? 4 : 3)
					ctx.beginPath()
					ctx.arc(
						seatX + dragOffset.x + seatmapDragOffset.x,
						seatY + dragOffset.y + seatmapDragOffset.y,
						dotRadius, 0, 2 * Math.PI
					)
					ctx.fill()
					ctx.stroke()

					ctx.restore()
				}
			})
		}

		ctx.restore()
	}, [localSections, localPlaces, scale, pan, loadedSvgs, selectedSection, selectedSeats, hoveredItem, isEditMode, sectionDragOffset, seatsDragOffset, backgroundDragOffset, simpleMode, showSections, effectiveBgConfig, effectiveDisplayConfig, manifest?.venue?.backgroundSvg, manifest?.backgroundSvg])

	// Initialize local copies when manifest changes
	useEffect(() => {
		if (manifest) {
			const sections = manifest?.venue?.sections || manifest?.sections || []
			const places = manifest?.places || []
			setLocalSections(JSON.parse(JSON.stringify(sections))) // Deep copy
			setLocalPlaces(JSON.parse(JSON.stringify(places))) // Deep copy
			setHasUnsavedChanges(false)
		}
	}, [manifest])

	// Redraw when dependencies change
	useEffect(() => {
		redrawCanvas()
	}, [redrawCanvas, localSections, localPlaces, selectedSection, selectedSeats, hoveredItem, isEditMode, seatMapConfig])


	// Keyboard event handling
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (!isEditMode) return

			// Escape to clear selection
			if (e.key === 'Escape') {
				setSelectedSection(null)
				setSelectedSeats([])
				setHoveredItem(null)
			}

			// Select all seats in current section (Ctrl+A or Cmd+A)
			if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
				e.preventDefault()
				if (selectedSection !== null) {
					const seatsInSection = getSeatsInSection(selectedSection, localPlaces)
					setSelectedSeats(seatsInSection)
					setSelectedSection(null)
					setDraggedItem(null)
				}
			}

			// Delete key to remove selected polygon points
			if (e.key === 'Delete' || e.key === 'Backspace') {
				if (selectedSection !== null && localSections[selectedSection]?.polygon) {
					const section = localSections[selectedSection]
					if (hoveredItem && hoveredItem.type === 'polygon-point') {
						const newPolygon = section.polygon.filter((_, idx) => idx !== hoveredItem.index)
						setLocalSections(prev => {
							const newSections = [...prev]
							newSections[selectedSection] = { ...section, polygon: newPolygon }
							return newSections
						})
						setHoveredItem(null)
					}
				}
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [isEditMode, selectedSection, hoveredItem, localSections, localPlaces])

	const handleZoomIn = () => {
		setScale(prev => Math.min(prev * 1.2, 5))
	}

	const handleZoomOut = () => {
		setScale(prev => Math.max(prev / 1.2, 0.1))
	}

	const handleFitToScreen = () => {
		setScale(1)
		setPan({ x: 0, y: 0 })
	}

	const handleFullscreen = () => {
		const container = containerRef.current
		if (!container) return

		if (!isFullscreen) {
			container.requestFullscreen?.()
		} else {
			document.exitFullscreen?.()
		}
	}

	const handleMouseDown = (e) => {
		if (!isEditMode && !simpleMode) {
			if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+left click
				setIsPanning(true)
				setLastPanPoint({ x: e.clientX, y: e.clientY })
			}
			return
		}

		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = (e.clientX - rect.left - canvas.width / 2) / scale + canvas.width / 2 - pan.x
		const y = (e.clientY - rect.top - canvas.height / 2) / scale + canvas.height / 2 - pan.y

		// Check for polygon point selection first
		if (selectedSection !== null && localSections[selectedSection]?.polygon) {
			const polygon = localSections[selectedSection].polygon
			for (let i = 0; i < polygon.length; i++) {
				const point = polygon[i]
				const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
				if (distance < 8) { // 8 pixel tolerance
					setDraggedItem(`polygon-${i}`)
					setDragOffset({ x: x - point.x, y: y - point.y })
					return
				}
			}
		}

		// Check for section selection
		for (let i = 0; i < localSections.length; i++) {
			const section = localSections[i]
			if (section.polygon && section.polygon.length > 0) {
				// Check if point is inside polygon
				if (isPointInPolygon(x, y, section.polygon)) {
					// If Ctrl+click on section, select all seats in that section
					if (e.ctrlKey || e.metaKey) {
						const seatsInSection = getSeatsInSection(i, localPlaces)
						setSelectedSeats(seatsInSection)
						setSelectedSection(null)
						setDraggedItem('seats')
						setDragOffset({ x, y })
						setSeatsDragOffset({ x: 0, y: 0 })
						return
					} else {
						// Normal section selection for polygon editing
						setSelectedSection(i)
						setSelectedSeats([])
						setDraggedItem('section')
						setDragOffset({ x, y })
						setSectionDragOffset({ x: 0, y: 0 })
						return
					}
				}
			} else if (section.bounds) {
				// Check if point is inside rectangle
				const { x: bx, y: by, width, height } = section.bounds
				if (x >= bx && x <= bx + width && y >= by && y <= by + height) {
					// If Ctrl+click on section, select all seats in that section
					if (e.ctrlKey || e.metaKey) {
						const seatsInSection = getSeatsInSection(i, localPlaces)
						setSelectedSeats(seatsInSection)
						setSelectedSection(null)
						setDraggedItem('seats')
						setDragOffset({ x, y })
						setSeatsDragOffset({ x: 0, y: 0 })
						return
					} else {
						// Normal section selection for polygon editing
						setSelectedSection(i)
						setSelectedSeats([])
						setDraggedItem('section')
						setDragOffset({ x, y })
						setSectionDragOffset({ x: 0, y: 0 })
						return
					}
				}
			}
		}

		// Check for seat selection
		for (let i = 0; i < localPlaces.length; i++) {
			const place = localPlaces[i]
			if (place.x !== null && place.y !== null) {
				const distance = Math.sqrt((x - place.x) ** 2 + (y - place.y) ** 2)
				const clickTolerance = simpleMode ? effectiveDisplayConfig.dotSize : 6 // Use dotSize for click detection in simple mode
				if (distance < clickTolerance) {
					console.log('Seat clicked at distance:', distance, 'tolerance:', clickTolerance)
					setSelectedSection(null)

					// Handle bulk selection with shift+click
					if (e.shiftKey) {
						setSelectedSeats(prev => {
							const isSelected = prev.includes(i)
							if (isSelected) {
								// Remove from selection
								return prev.filter(idx => idx !== i)
							} else {
								// Add to selection
								return [...prev, i]
							}
						})
					} else {
						// Single selection - replace current selection
						setSelectedSeats([i])
					}

					setDraggedItem('seats')
					setDragOffset({ x, y })
					setSeatsDragOffset({ x: 0, y: 0 })
					return
				}
			}
		}

		// If in simple mode and no seat was clicked, allow dragging the background SVG
		if (simpleMode) {
			setDraggedItem('background')
			setDragOffset({ x, y })
			setBackgroundDragOffset({ x: 0, y: 0 })
			return
		}

		// If in edit mode and no items were selected, select the background
		if (isEditMode && !selectedSection && selectedSeats.length === 0) {
			setDraggedItem('background')
			setDragOffset({ x, y })
			setBackgroundDragOffset({ x: 0, y: 0 })
		} else {
			// Clear selection if clicked on empty space
			setSelectedSection(null)
			setSelectedSeats([])
			setDraggedItem(null)
			setSectionDragOffset({ x: 0, y: 0 })
			setSeatsDragOffset({ x: 0, y: 0 })
			setBackgroundDragOffset({ x: 0, y: 0 })
		}
	}

	const handleMouseMove = (e) => {
		if (isPanning && lastPanPoint) {
			const deltaX = e.clientX - lastPanPoint.x
			const deltaY = e.clientY - lastPanPoint.y
			setPan(prev => ({
				x: prev.x + deltaX,
				y: prev.y + deltaY
			}))
			setLastPanPoint({ x: e.clientX, y: e.clientY })
			return
		}

		if (!isEditMode && !simpleMode) return

		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = (e.clientX - rect.left - canvas.width / 2) / scale + canvas.width / 2 - pan.x
		const y = (e.clientY - rect.top - canvas.height / 2) / scale + canvas.height / 2 - pan.y

		// Handle hover detection
		let newHoveredItem = null

		if (!draggedItem) {
			// Check for polygon point hover
			if (selectedSection !== null && localSections[selectedSection]?.polygon) {
				const polygon = localSections[selectedSection].polygon
				for (let i = 0; i < polygon.length; i++) {
					const point = polygon[i]
					const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
					if (distance < 6) {
						newHoveredItem = `polygon-point-${i}`
						break
					}
				}
			}

			// Check for section hover (only if not already hovering over a point)
			if (!newHoveredItem) {
				for (let i = 0; i < localSections.length; i++) {
					const section = localSections[i]
					if (section.polygon && section.polygon.length > 0) {
						if (isPointInPolygon(x, y, section.polygon)) {
							newHoveredItem = `section-${i}`
							break
						}
					} else if (section.bounds) {
						const { x: bx, y: by, width, height } = section.bounds
						if (x >= bx && x <= bx + width && y >= by && y <= by + height) {
							newHoveredItem = `section-${i}`
							break
						}
					}
				}
			}

			// Check for seat hover (only if not already hovering over section)
			if (!newHoveredItem) {
				for (let i = 0; i < localPlaces.length; i++) {
					const place = localPlaces[i]
					if (place.x !== null && place.y !== null) {
						const distance = Math.sqrt((x - place.x) ** 2 + (y - place.y) ** 2)
						if (distance < 5) {
							newHoveredItem = `seat-${i}`
							break
						}
					}
				}
			}
		}

		setHoveredItem(newHoveredItem)

		// Handle dragging - use temporary offsets for smooth movement
		if (draggedItem) {
			if (draggedItem === 'seatmap') {
				// For seatmap dragging, update the offset for all seats
				const deltaX = x - dragOffset.x
				const deltaY = y - dragOffset.y
				setSectionDragOffset({ x: deltaX, y: deltaY })
				setHasUnsavedChanges(true)
			} else {
				setHasUnsavedChanges(true)

				if (draggedItem === 'section' && selectedSection !== null) {
					// Update temporary offset for smooth dragging
					const deltaX = x - dragOffset.x
					const deltaY = y - dragOffset.y
					setSectionDragOffset({ x: deltaX, y: deltaY })
			} else if (draggedItem.startsWith('polygon-') && selectedSection !== null) {
				// For polygon points, update immediately since they don't need smooth dragging
				const pointIndex = parseInt(draggedItem.split('-')[1])
				const section = localSections[selectedSection]

				if (section.polygon && section.polygon.length > pointIndex) {
					setLocalSections(prev => {
						const newSections = [...prev]
						const newPolygon = [...section.polygon]
						newPolygon[pointIndex] = { x, y }
						newSections[selectedSection] = { ...section, polygon: newPolygon }
						return newSections
					})
				}
			} else 				if (draggedItem === 'seats' && selectedSeats.length > 0) {
					// Update temporary offset for smooth bulk seat dragging
					const deltaX = x - dragOffset.x
					const deltaY = y - dragOffset.y
					console.log('Dragging seats, delta:', deltaX, deltaY, 'selectedSeats:', selectedSeats)
					setSeatsDragOffset({ x: deltaX, y: deltaY })
				} else if (draggedItem === 'background') {
				// Update temporary offset for background dragging
				const deltaX = x - dragOffset.x
				const deltaY = y - dragOffset.y
				setBackgroundDragOffset({ x: deltaX, y: deltaY })
			}
		}
		}
	}

	const handleMouseUp = () => {
		setIsPanning(false)
		setLastPanPoint(null)

		// Apply temporary offsets to actual positions
		if (draggedItem === 'section' && selectedSection !== null) {
			const section = localSections[selectedSection]

			// Move the section itself
			if (section.polygon && section.polygon.length > 0) {
				// Apply polygon offset
				const movedPolygon = section.polygon.map(point => ({
					x: point.x + sectionDragOffset.x,
					y: point.y + sectionDragOffset.y
				}))
				setLocalSections(prev => {
					const newSections = [...prev]
					newSections[selectedSection] = { ...section, polygon: movedPolygon }
					return newSections
				})
			} else if (section.bounds) {
				// Apply bounds offset
				const movedBounds = {
					...section.bounds,
					x: section.bounds.x + sectionDragOffset.x,
					y: section.bounds.y + sectionDragOffset.y
				}
				setLocalSections(prev => {
					const newSections = [...prev]
					newSections[selectedSection] = { ...section, bounds: movedBounds }
					return newSections
				})
			}

			// Move all seats within this section
			const seatsInSection = getSeatsInSection(selectedSection, localPlaces)
			if (seatsInSection.length > 0) {
				setLocalPlaces(prev => {
					const newPlaces = [...prev]
					seatsInSection.forEach(seatIndex => {
						const place = newPlaces[seatIndex]
						newPlaces[seatIndex] = {
							...place,
							x: place.x + sectionDragOffset.x,
							y: place.y + sectionDragOffset.y
						}
					})
					return newPlaces
				})
			}

			setSectionDragOffset({ x: 0, y: 0 })
		} else if (draggedItem === 'seats' && selectedSeats.length > 0) {
			// Apply bulk seat offsets
			console.log('Applying seat drag offset:', seatsDragOffset, 'to seats:', selectedSeats)
			setLocalPlaces(prev => {
				const newPlaces = [...prev]
				selectedSeats.forEach(seatIndex => {
					const place = newPlaces[seatIndex]
					newPlaces[seatIndex] = {
						...place,
						x: place.x + seatsDragOffset.x,
						y: place.y + seatsDragOffset.y
					}
				})
				return newPlaces
			})
			setSeatsDragOffset({ x: 0, y: 0 })
		} else if (draggedItem === 'seatmap') {
			// In edit mode, apply seatmap drag offset to all seats permanently
			setLocalPlaces(prev => {
				const newPlaces = [...prev]
				newPlaces.forEach((place, index) => {
					if (place.x !== null && place.y !== null) {
						newPlaces[index] = {
							...place,
							x: place.x + sectionDragOffset.x,
							y: place.y + sectionDragOffset.y
						}
					}
				})
				return newPlaces
			})
			setSectionDragOffset({ x: 0, y: 0 })
		} else if (draggedItem === 'background') {
			// In simpleMode, update the background SVG config instead of modifying seat coordinates
			// This way the background alignment is saved to the venue and persists after refresh
			if (simpleMode && onBgSvgConfigChange) {
				const newTranslateX = (effectiveBgConfig.translateX || 0) + backgroundDragOffset.x
				const newTranslateY = (effectiveBgConfig.translateY || 0) + backgroundDragOffset.y
				onBgSvgConfigChange({
					...effectiveBgConfig,
					translateX: Math.round(newTranslateX),
					translateY: Math.round(newTranslateY)
				})
			}
			setBackgroundDragOffset({ x: 0, y: 0 })
		}

		setDraggedItem(null)
		setDragOffset({ x: 0, y: 0 })
	}

	// Helper function to check if point is inside polygon
	const isPointInPolygon = (x, y, polygon) => {
		let inside = false
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const xi = polygon[i].x, yi = polygon[i].y
			const xj = polygon[j].x, yj = polygon[j].y

			if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
				inside = !inside
			}
		}
		return inside
	}

	// Helper function to get seats within a section
	const getSeatsInSection = (sectionIndex, places) => {
		const section = localSections[sectionIndex]
		const seatsInSection = []

		if (!section || !places) return seatsInSection

		places.forEach((place, placeIndex) => {
			if (place.x !== null && place.y !== null) {
				let isInside = false

				if (section.polygon && section.polygon.length > 0) {
					isInside = isPointInPolygon(place.x, place.y, section.polygon)
				} else if (section.bounds) {
					const { x, y, width, height } = section.bounds
					isInside = place.x >= x && place.x <= x + width &&
							   place.y >= y && place.y <= y + height
				}

				if (isInside) {
					seatsInSection.push(placeIndex)
				}
			}
		})

		return seatsInSection
	}

	const handleSaveChanges = async () => {
		if (!onSave) {
			console.error('onSave prop is not provided')
			return
		}

		try {
			await onSave({
				sections: localSections,
				places: localPlaces
			})

			setHasUnsavedChanges(false)
		} catch (error) {
			console.error('Failed to save changes:', error)
		}
	}

	if (!manifest) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
				<Typography variant="body1" color="textSecondary">
					No manifest data available
				</Typography>
			</Box>
		)
	}

	return (
		<Box>
			{/* Controls */}
			<Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<ButtonGroup variant="outlined" size="small">
					<Button onClick={handleZoomOut} disabled={scale <= 0.1}>
						<ZoomOut />
					</Button>
					<Button onClick={handleFitToScreen}>
						<FitScreen />
					</Button>
					<Button onClick={handleZoomIn} disabled={scale >= 5}>
						<ZoomIn />
					</Button>
					<Button onClick={handleFullscreen}>
						{isFullscreen ? <FullscreenExit /> : <Fullscreen />}
					</Button>
				</ButtonGroup>

				{!simpleMode && (
					<Box sx={{ display: 'flex', gap: 1 }}>
						<Button
							variant={isEditMode ? "contained" : "outlined"}
							size="small"
							onClick={() => {
								setIsEditMode(!isEditMode)
								// Clear selections and drag offsets when exiting edit mode
								if (isEditMode) {
									setSelectedSection(null)
									setSelectedSeats([])
									setDraggedItem(null)
									setSectionDragOffset({ x: 0, y: 0 })
									setSeatsDragOffset({ x: 0, y: 0 })
									setBackgroundDragOffset({ x: 0, y: 0 })
									setHoveredItem(null)
								}
							}}
							color="secondary"
						>
							{isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
						</Button>
						{isEditMode && onSave && (
							<Button
								variant="contained"
								size="small"
								onClick={handleSaveChanges}
								disabled={saving || !hasUnsavedChanges}
								color="primary"
							>
								{saving ? 'Saving...' : 'Save Changes'}
							</Button>
						)}
					</Box>
				)}
			</Box>

			{/* Canvas Container */}
			<Paper
				ref={containerRef}
				elevation={2}
				sx={{
					width: '100%',
					height: height,
					position: 'relative',
					overflow: 'hidden',
					cursor: isPanning ? 'grabbing' : 'grab'
				}}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
			>
				<canvas
					ref={canvasRef}
					style={{
						display: 'block',
						width: '100%',
						height: '100%'
					}}
				/>

				{/* Instructions overlay */}
				{!simpleMode && (
					<Box
						sx={{
							position: 'absolute',
							top: 10,
							left: 10,
							backgroundColor: 'rgba(255, 255, 255, 0.9)',
							padding: 1,
							borderRadius: 1,
							fontSize: '0.75rem',
							maxWidth: '250px'
						}}
					>
					<Typography variant="caption">
						<strong>Controls:</strong><br />
						• Zoom: Buttons or mouse wheel<br />
						• Pan: Alt+drag or middle mouse<br />
						• Click seat + drag = Move individual seat<br />
						• Click empty space + drag = Move entire seat map<br />
						{isEditMode ? (
							<>
								<br />• Click sections to select (moves all seats inside)<br />
								• Ctrl+click sections to select all seats in section<br />
								• Drag sections to move (seats follow)<br />
								• Drag orange dots to reshape sections<br />
								• Click seats to select, Shift+click for bulk<br />
								• Ctrl+A (when section selected) to select all seats<br />
								• Drag selected seats to move in bulk<br />
								• Click empty background to move image<br />
								• Orange = selected items
							</>
						) : (
							<>
								<br />• Green dots = Available seats
							</>
						)}
					</Typography>
					</Box>
				)}
			</Paper>
		</Box>
	)
}

export default SeatMapViewer
