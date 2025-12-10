'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import SeatMapOverview from './SeatMapOverview'

const SeatMapCanvas = ({
	places = [],
	onSeatClick,
	onSeatHover,
	selectedSeats = [],
	width = 800,
	height = 600,
	zoom = 1,
	panX = 0,
	panY = 0,
	onZoomChange,
	onPanChange,
	venue = null,
	showOverview = true
}) => {
	const [hoveredSeat, setHoveredSeat] = useState(null)
	const svgRef = useRef(null)
	const [isDragging, setIsDragging] = useState(false)
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
	const [backgroundSvgImage, setBackgroundSvgImage] = useState(null) // Loaded SVG image for background

	// CONFIGURATION: Default values for spacing - use raw backend coordinates without expansion
	// Backend generates coordinates that fit within polygons, no need to expand them
	const SEAT_RADIUS = 7 // Default seat radius for visibility
	const HORIZONTAL_SCALE = 1.0 // No horizontal scaling - use backend coordinates directly
	const VERTICAL_SCALE = 1.0 // No vertical scaling - use backend coordinates directly
	// NO MORE EXPANSION MULTIPLIERS - use 1.0 to render backend coordinates as-is
	const SEAT_SPACING_MULTIPLIER = 1.0 // No seat expansion (was 1.3 which caused overflow)
	const ROW_SPACING_MULTIPLIER = 1.0 // No row expansion (was 1.2 which caused overflow)
	const TOP_MARGIN = 30 // Small top margin for visual spacing

	// Check if venue has manually configured sections (polygon/presentation styles)
	const hasManualSections = venue?.sections?.some(s => s.shape === 'polygon' || s.presentationStyle)

	// Load background SVG image when venue.backgroundSvg changes
	useEffect(() => {
		if (venue?.backgroundSvg?.svgContent && venue.backgroundSvg.isVisible) {
			const svgContent = venue.backgroundSvg.svgContent
			const img = new Image()
			const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`

			img.onload = () => {
				setBackgroundSvgImage(img)
			}
			img.onerror = (error) => {
				console.error('Failed to load background SVG:', error)
				setBackgroundSvgImage(null)
			}
			img.src = svgDataUrl
		} else {
			setBackgroundSvgImage(null)
		}
	}, [venue?.backgroundSvg?.svgContent, venue?.backgroundSvg?.isVisible])

	// Group places by section and row
	const groupPlacesBySection = useCallback((places) => {
		const grouped = {}

		places.forEach(place => {
			const section = place.section || 'Unknown'
			if (!grouped[section]) {
				grouped[section] = {
					rows: {},
					bounds: { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
					rawBounds: { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
				}
			}

			const row = place.row || 'Unknown'
			if (!grouped[section].rows[row]) {
				grouped[section].rows[row] = []
			}

			grouped[section].rows[row].push(place)

			// Update raw bounds (before scaling)
			if (place.x !== undefined && place.x !== null) {
				grouped[section].rawBounds.minX = Math.min(grouped[section].rawBounds.minX, place.x)
				grouped[section].rawBounds.maxX = Math.max(grouped[section].rawBounds.maxX, place.x)
			}
			if (place.y !== undefined && place.y !== null) {
				grouped[section].rawBounds.minY = Math.min(grouped[section].rawBounds.minY, place.y)
				grouped[section].rawBounds.maxY = Math.max(grouped[section].rawBounds.maxY, place.y)
			}
		})

		// Sort seats within each row by seat number AND normalize Y coordinates
		Object.entries(grouped).forEach(([sectionName, section]) => {
			const rawBounds = section.rawBounds
			const centerX = (rawBounds.minX + rawBounds.maxX) / 2
			const centerY = (rawBounds.minY + rawBounds.maxY) / 2

			// Get section-specific spacing configuration from venue
			const venueSection = venue?.sections?.find(s => s.name === sectionName)
			const spacingConfig = venueSection?.spacingConfig || {}
			const sectionSeatRadius = spacingConfig.seatRadius !== undefined ? spacingConfig.seatRadius : SEAT_RADIUS
			// IMPORTANT: Clamp multipliers to max 1.0 to prevent seats from expanding beyond polygon bounds
			// Values > 1.0 would cause overflow - old schema had defaults of 1.3 and 1.2 which caused issues
			const rawSeatSpacingMultiplier = spacingConfig.seatSpacingVisual !== undefined ? spacingConfig.seatSpacingVisual : SEAT_SPACING_MULTIPLIER
			const rawRowSpacingMultiplier = spacingConfig.rowSpacingVisual !== undefined ? spacingConfig.rowSpacingVisual : ROW_SPACING_MULTIPLIER
			const sectionSeatSpacingMultiplier = Math.min(1.0, rawSeatSpacingMultiplier)
			const sectionRowSpacingMultiplier = Math.min(1.0, rawRowSpacingMultiplier)
			const sectionTopMargin = spacingConfig.topMargin !== undefined ? spacingConfig.topMargin : TOP_MARGIN

			Object.keys(section.rows).forEach(rowKey => {
				section.rows[rowKey].sort((a, b) => {
					const seatA = parseInt(a.seat) || 0
					const seatB = parseInt(b.seat) || 0
					return seatA - seatB
				})

				// Normalize Y coordinate and apply scaling for spacing
				const rowSeats = section.rows[rowKey]
				if (rowSeats.length > 0) {
					const avgY = rowSeats.reduce((sum, seat) => sum + (seat.y || 0), 0) / rowSeats.length

					rowSeats.forEach(seat => {
						// For manual sections, apply spacing multipliers to create visual gaps while preserving curves
						// For auto-generated sections, apply scaling for spacing
						if (hasManualSections) {
							// Apply spacing from section center to create gaps between seats and rows
							// This preserves the curve pattern while adding visual spacing
							const scaledX = centerX + (seat.x - centerX) * sectionSeatSpacingMultiplier
							const scaledY = sectionTopMargin + centerY + ((seat.y || avgY) - centerY) * sectionRowSpacingMultiplier
							seat.scaledX = scaledX
							seat.scaledY = scaledY // Preserves curve while adding row spacing and top margin
							seat.seatRadius = sectionSeatRadius // Store section-specific seat radius
						} else {
							// Apply scaling from center to create spacing
							const scaledX = centerX + (seat.x - centerX) * HORIZONTAL_SCALE
							const scaledY = sectionTopMargin + centerY + (avgY - centerY) * VERTICAL_SCALE
							seat.scaledX = scaledX
							seat.scaledY = scaledY
							seat.seatRadius = sectionSeatRadius // Store section-specific seat radius
						}
						seat.normalizedY = avgY // Keep for sorting/grouping purposes
					})

					// Update scaled bounds
					rowSeats.forEach(seat => {
						section.bounds.minX = Math.min(section.bounds.minX, seat.scaledX)
						section.bounds.maxX = Math.max(section.bounds.maxX, seat.scaledX)
						section.bounds.minY = Math.min(section.bounds.minY, seat.scaledY)
						section.bounds.maxY = Math.max(section.bounds.maxY, seat.scaledY)
					})
				}
			})
		})

		return grouped
	}, [hasManualSections])

	const groupedPlaces = groupPlacesBySection(places)

	// Get seat color based on status/availability
	const getSeatColor = (place) => {
		if (selectedSeats.includes(place.placeId)) {
			return '#FFCC00' // Selected - yellow
		}
		if (hoveredSeat === place.placeId) {
			return '#42a5f5' // Hovered - light blue
		}
		if (place.status === 'sold' || !place.available) {
			return '#CCCCCC' // Sold/Unavailable - grey
		}
		if (place.status === 'reserved') {
			return '#CCCCCC' // Reserved - grey
		}
		if (place.status === 'blocked') {
			return '#CCCCCC' // Blocked - grey
		}
		return '#0088CC' // Available - blue
	}

	// Handle seat click
	const handleSeatClick = (place) => {
		if (onSeatClick) {
			onSeatClick(place)
		}
	}

	// Handle seat hover
	const handleSeatMouseEnter = (place) => {
		setHoveredSeat(place.placeId)
		if (onSeatHover) {
			onSeatHover(place)
		}
	}

	const handleSeatMouseLeave = () => {
		setHoveredSeat(null)
	}

	// Handle mouse wheel for zoom
	const handleWheel = (e) => {
		e.preventDefault()
		if (onZoomChange) {
			const delta = e.deltaY > 0 ? -0.1 : 0.1
			const newZoom = Math.max(0.5, Math.min(3, zoom + delta))
			onZoomChange(newZoom)
		}
	}

	// Handle drag for panning
	const handleMouseDown = (e) => {
		if (e.button === 0 && !e.target.closest('circle')) {
			setIsDragging(true)
			setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
		}
	}

	const handleMouseMove = (e) => {
		if (isDragging) {
			const newPanX = e.clientX - dragStart.x
			const newPanY = e.clientY - dragStart.y
			if (onPanChange) {
				onPanChange(newPanX, newPanY)
			}
		}
	}

	const handleMouseUp = () => {
		setIsDragging(false)
	}

	const handleResetView = () => {
		if (onZoomChange) onZoomChange(1)
		if (onPanChange) onPanChange(0, 0)
	}

	useEffect(() => {
		if (isDragging) {
			const handleMouseMoveGlobal = (e) => {
				const newPanX = e.clientX - dragStart.x
				const newPanY = e.clientY - dragStart.y
				if (onPanChange) {
					onPanChange(newPanX, newPanY)
				}
			}
			const handleMouseUpGlobal = () => {
				setIsDragging(false)
			}
			window.addEventListener('mousemove', handleMouseMoveGlobal)
			window.addEventListener('mouseup', handleMouseUpGlobal)
			return () => {
				window.removeEventListener('mousemove', handleMouseMoveGlobal)
				window.removeEventListener('mouseup', handleMouseUpGlobal)
			}
		}
	}, [isDragging, dragStart, onPanChange])

	// Render stage indicator (Kenttä arrow) based on ground direction
	const renderStageIndicator = (bounds, centerX, centerY, groundDirection = null) => {
		// If ground direction is null/undefined, don't render arrow
		if (!groundDirection) {
			return null
		}

		let arrowPath, textX, textY, textAnchor = 'middle'
		const offset = 100 // Distance from section bounds

		switch (groundDirection) {
			case 'up':
				// Arrow pointing up (tip at top), positioned ABOVE the section
				arrowPath = `M ${centerX} ${bounds.minY - offset - 50}
					L ${centerX - 15} ${bounds.minY - offset - 20}
					L ${centerX - 8} ${bounds.minY - offset - 20}
					L ${centerX - 8} ${bounds.minY - offset}
					L ${centerX + 8} ${bounds.minY - offset}
					L ${centerX + 8} ${bounds.minY - offset - 20}
					L ${centerX + 15} ${bounds.minY - offset - 20} Z`
				textX = centerX
				textY = bounds.minY - offset - 60
				break

			case 'down':
				// Arrow pointing down (tip at bottom), positioned BELOW the section
				arrowPath = `M ${centerX} ${bounds.maxY + offset + 50}
					L ${centerX - 15} ${bounds.maxY + offset + 20}
					L ${centerX - 8} ${bounds.maxY + offset + 20}
					L ${centerX - 8} ${bounds.maxY + offset}
					L ${centerX + 8} ${bounds.maxY + offset}
					L ${centerX + 8} ${bounds.maxY + offset + 20}
					L ${centerX + 15} ${bounds.maxY + offset + 20} Z`
				textX = centerX
				textY = bounds.maxY + offset + 70
				break

			case 'left':
				// Arrow pointing left (tip at left), positioned to the LEFT of the section
				arrowPath = `M ${bounds.minX - offset - 50} ${centerY}
					L ${bounds.minX - offset - 20} ${centerY - 15}
					L ${bounds.minX - offset - 20} ${centerY - 8}
					L ${bounds.minX - offset} ${centerY - 8}
					L ${bounds.minX - offset} ${centerY + 8}
					L ${bounds.minX - offset - 20} ${centerY + 8}
					L ${bounds.minX - offset - 20} ${centerY + 15} Z`
				textX = bounds.minX - offset - 60
				textY = centerY + 5
				textAnchor = 'end'
				break

			case 'right':
				// Arrow pointing right (tip at right), positioned to the RIGHT of the section
				arrowPath = `M ${bounds.maxX + offset + 50} ${centerY}
					L ${bounds.maxX + offset + 20} ${centerY - 15}
					L ${bounds.maxX + offset + 20} ${centerY - 8}
					L ${bounds.maxX + offset} ${centerY - 8}
					L ${bounds.maxX + offset} ${centerY + 8}
					L ${bounds.maxX + offset + 20} ${centerY + 8}
					L ${bounds.maxX + offset + 20} ${centerY + 15} Z`
				textX = bounds.maxX + offset + 60
				textY = centerY + 5
				textAnchor = 'start'
				break

			default:
				// Default to down
				arrowPath = `M ${centerX} ${bounds.maxY + offset + 50}
					L ${centerX - 15} ${bounds.maxY + offset + 20}
					L ${centerX - 8} ${bounds.maxY + offset + 20}
					L ${centerX - 8} ${bounds.maxY + offset}
					L ${centerX + 8} ${bounds.maxY + offset}
					L ${centerX + 8} ${bounds.maxY + offset + 20}
					L ${centerX + 15} ${bounds.maxY + offset + 20} Z`
				textX = centerX
				textY = bounds.maxY + offset + 70
		}

		return (
			<g key={`stage-indicator-${groundDirection}`}>
				{/* Arrow */}
				<path d={arrowPath} fill="#003d82" />
				{/* Label */}
				<text
					x={textX}
					y={textY}
					fill="#000"
					fontSize={16}
					fontWeight="bold"
					textAnchor={textAnchor}
				>
				</text>
			</g>
		)
	}

	return (
		<Paper elevation={2} sx={{ p: 2, overflow: 'hidden' }}>
			<Box
				sx={{
					width: '100%',
					height: height,
					overflow: 'auto',
					border: '1px solid #e0e0e0',
					borderRadius: 1,
					position: 'relative'
				}}
				onWheel={handleWheel}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
			>
				<svg
					ref={svgRef}
					width={width}
					height={height}
					viewBox={`0 0 ${width} ${height}`}
					style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
				>
					{/* Background SVG Image - rendered first, behind everything */}
					{backgroundSvgImage && venue?.backgroundSvg?.isVisible && (
						<g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
							<g
								opacity={venue.backgroundSvg.opacity || 0.5}
								transform={`
									translate(${venue.backgroundSvg.translateX || 0}, ${venue.backgroundSvg.translateY || 0})
									rotate(${venue.backgroundSvg.rotation || 0}, ${(backgroundSvgImage.naturalWidth || backgroundSvgImage.width || 1000) / 2}, ${(backgroundSvgImage.naturalHeight || backgroundSvgImage.height || 1000) / 2})
									scale(${venue.backgroundSvg.scale || 1.0})
								`}
							>
								<image
									x="0"
									y="0"
									width={backgroundSvgImage.naturalWidth || backgroundSvgImage.width || 1000}
									height={backgroundSvgImage.naturalHeight || backgroundSvgImage.height || 1000}
									href={`data:image/svg+xml;base64,${btoa(venue.backgroundSvg.svgContent)}`}
									preserveAspectRatio="xMidYMid meet"
								/>
							</g>
						</g>
					)}
					<g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
						{/* Render each section */}
						{Object.entries(groupedPlaces).map(([sectionName, sectionData]) => {
							const { rows, bounds } = sectionData
							const centerX = (bounds.minX + bounds.maxX) / 2
							const centerY = (bounds.minY + bounds.maxY) / 2

							// Get section configuration from venue
							const venueSection = venue?.sections?.find(s => s.name === sectionName)
							const groundDirection = venueSection?.groundDirection || null
							const showRowLabels = venueSection?.showRowLabels !== false // Default to true if not set
							const spacingConfig = venueSection?.spacingConfig || {}
							const sectionSeatRadius = spacingConfig.seatRadius !== undefined ? spacingConfig.seatRadius : SEAT_RADIUS

							// Get sorted row keys
							const rowKeys = Object.keys(rows).sort((a, b) => {
								const numA = parseInt(a.replace(/\D/g, '')) || 0
								const numB = parseInt(b.replace(/\D/g, '')) || 0
								return numA - numB
							})

							return (
								<g key={sectionName}>
									{/* Stage indicator based on ground direction */}
									{renderStageIndicator(bounds, centerX, centerY, groundDirection)}

									{/* Render rows */}
									{rowKeys.map((rowKey) => {
										const rowSeats = rows[rowKey]
										if (rowSeats.length === 0) return null

										// Calculate average Y for row label positioning (for manual sections, seats may have different Y)
										const avgRowY = rowSeats.reduce((sum, seat) => sum + (seat.scaledY || 0), 0) / rowSeats.length

										return (
											<g key={`${sectionName}-${rowKey}`}>
												{/* Row number - left side, close to first seat */}
												{showRowLabels && rowSeats.length > 0 && (() => {
													const firstSeat = rowSeats[0]
													const firstSeatY = firstSeat.scaledY || avgRowY
													return (
														<text
															key={`${sectionName}-${rowKey}-start`}
															x={firstSeat.scaledX - sectionSeatRadius - 8}
															y={firstSeatY + 5}
															fill="#000"
															fontSize={14}
															fontWeight="bold"
															textAnchor="end"
														>
															{rowKey}
														</text>
													)
												})()}

												{/* Seats */}
												{rowSeats.map((place) => {
													const color = getSeatColor(place)
													// Use each seat's individual scaledY to preserve curve/fan patterns
													const seatY = place.scaledY || avgRowY

													return (
														<g key={place.placeId}>
															<circle
																cx={place.scaledX}
																cy={seatY}
																r={place.seatRadius || sectionSeatRadius}
																fill={color}
																stroke={color === '#CCCCCC' ? '#999' : '#006699'}
																strokeWidth={2}
																style={{ cursor: 'pointer' }}
																onClick={() => handleSeatClick(place)}
																onMouseEnter={() => handleSeatMouseEnter(place)}
																onMouseLeave={handleSeatMouseLeave}
															/>
															{/* Tooltip on hover */}
															{hoveredSeat === place.placeId && (
																<g>
																	<rect
																		x={place.scaledX + 15}
																		y={seatY - 40}
																		width={150}
																		height={75}
																		fill="rgba(0, 0, 0, 0.9)"
																		rx={4}
																		stroke="#fff"
																		strokeWidth={1}
																	/>
																	<text
																		x={place.scaledX + 20}
																		y={seatY - 22}
																		fill="white"
																		fontSize="12"
																		fontWeight="bold"
																	>
																		{place.section} - Row {place.row}
																	</text>
																	<text
																		x={place.scaledX + 20}
																		y={seatY - 8}
																		fill="white"
																		fontSize="11"
																	>
																		Seat: {place.seat}
																	</text>
																	<text
																		x={place.scaledX + 20}
																		y={seatY + 6}
																		fill="white"
																		fontSize="11"
																	>
																		Price: €{((place.pricing?.currentPrice || place.pricing?.basePrice || 0) / 100).toFixed(2)}
																	</text>
																	<text
																		x={place.scaledX + 20}
																		y={seatY + 20}
																		fill="white"
																		fontSize="10"
																	>
																		Status: {place.status || 'available'}
																	</text>
																</g>
															)}
														</g>
													)
												})}

												{/* Row number - at end of row, close to last seat */}
												{showRowLabels && rowSeats.length > 0 && (() => {
													const lastSeat = rowSeats[rowSeats.length - 1]
													const lastSeatY = lastSeat.scaledY || avgRowY
													return (
														<text
															key={`${sectionName}-${rowKey}-end`}
															x={lastSeat.scaledX + sectionSeatRadius + 8}
															y={lastSeatY + 5}
															fill="#000"
															fontSize={14}
															fontWeight="bold"
															textAnchor="start"
														>
															{rowKey}
														</text>
													)
												})()}
											</g>
										)
									})}

									{/* Section label at bottom */}
									<text
										x={centerX}
										y={bounds.maxY + 50}
										fill="#000"
										fontSize={18}
										fontWeight="bold"
										textAnchor="middle"
									>
										{sectionName}
									</text>
								</g>
							)
						})}
					</g>
				</svg>

				{/* Overview Mini-Map */}
				{showOverview && (
					<SeatMapOverview
						places={places}
						sections={venue?.sections || []}
						centralFeature={venue?.centralFeature}
						viewport={{
							x: panX,
							y: panY,
							width: width * zoom,
							height: height * zoom
						}}
						onViewportChange={(x, y) => {
							if (onPanChange) onPanChange(x, y)
						}}
					/>
				)}
			</Box>

			{/* Legend */}
			<Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#0088CC', border: '2px solid #006699' }} />
					<Typography variant="caption">Available</Typography>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#FFCC00', border: '2px solid #CC9900' }} />
					<Typography variant="caption">Selected</Typography>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#CCCCCC', border: '2px solid #999' }} />
					<Typography variant="caption">Unavailable</Typography>
				</Box>
			</Box>
		</Paper>
	)
}

export default SeatMapCanvas