'use client'

import React, { useState, useRef } from 'react'
import { Box, Paper } from '@mui/material'

/**
 * SeatMapOverview Component
 * Mini-map overview showing the entire venue layout
 * Shows current viewport position and allows quick navigation
 */
const SeatMapOverview = ({
	places = [],
	sections = [],
	centralFeature = null,
	viewport = { x: 0, y: 0, width: 800, height: 600 },
	onViewportChange,
	width = 200,
	height = 150
}) => {
	const overviewRef = useRef(null)

	// Calculate bounds for overview
	const getBounds = () => {
		if (!places || places.length === 0) {
			return { minX: 0, maxX: 1000, minY: 0, maxY: 1000 }
		}

		let minX = Infinity, maxX = -Infinity
		let minY = Infinity, maxY = -Infinity

		places.forEach(place => {
			if (place.x !== undefined && place.x !== null) {
				minX = Math.min(minX, place.x)
				maxX = Math.max(maxX, place.x)
			}
			if (place.y !== undefined && place.y !== null) {
				minY = Math.min(minY, place.y)
				maxY = Math.max(maxY, place.y)
			}
		})

		// Add padding
		const padding = 50
		return {
			minX: minX === Infinity ? 0 : minX - padding,
			maxX: maxX === -Infinity ? 1000 : maxX + padding,
			minY: minY === Infinity ? 0 : minY - padding,
			maxY: maxY === -Infinity ? 1000 : maxY + padding
		}
	}

	const bounds = getBounds()
	const totalWidth = bounds.maxX - bounds.minX
	const totalHeight = bounds.maxY - bounds.minY

	// Scale factor for overview
	const scaleX = width / totalWidth
	const scaleY = height / totalHeight
	const scale = Math.min(scaleX, scaleY)

	// Convert main viewport to overview coordinates
	const overviewViewport = {
		x: ((viewport.x - bounds.minX) * scale),
		y: ((viewport.y - bounds.minY) * scale),
		width: (viewport.width * scale),
		height: (viewport.height * scale)
	}

	const handleClick = (e) => {
		const rect = overviewRef.current?.getBoundingClientRect()
		if (!rect) return

		const clickX = e.clientX - rect.left
		const clickY = e.clientY - rect.top

		// Convert to main coordinate system
		const mainX = (clickX / scale) + bounds.minX - (viewport.width / 2)
		const mainY = (clickY / scale) + bounds.minY - (viewport.height / 2)

		if (onViewportChange) {
			onViewportChange(mainX, mainY)
		}
	}

	return (
		<Paper
			elevation={3}
			sx={{
				position: 'absolute',
				top: 16,
				right: 16,
				width: width + 20,
				zIndex: 1000,
				p: 1
			}}
		>
			<Box
				ref={overviewRef}
				onClick={handleClick}
				sx={{
					width,
					height,
					border: '1px solid #ddd',
					borderRadius: 1,
					position: 'relative',
					overflow: 'hidden',
					cursor: 'pointer',
					bgcolor: '#f5f5f5'
				}}
			>
				<svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
					{/* Draw central feature */}
					{centralFeature && centralFeature.type !== 'none' && (
						<g>
							{centralFeature.shape === 'circle' && (
								<circle
									cx={(centralFeature.centerX - bounds.minX) * scale}
									cy={(centralFeature.centerY - bounds.minY) * scale}
									r={(centralFeature.radiusX || 50) * scale}
									fill={centralFeature.color || '#E3F2FD'}
									stroke={centralFeature.strokeColor || '#1976D2'}
									strokeWidth={1}
								/>
							)}
							{centralFeature.shape === 'rectangle' && (
								<rect
									x={(centralFeature.x - bounds.minX) * scale}
									y={(centralFeature.y - bounds.minY) * scale}
									width={(centralFeature.width || 100) * scale}
									height={(centralFeature.height || 100) * scale}
									fill={centralFeature.color || '#E3F2FD'}
									stroke={centralFeature.strokeColor || '#1976D2'}
									strokeWidth={1}
								/>
							)}
						</g>
					)}

					{/* Draw sections */}
					{sections.map((section) => {
						if (section.shape === 'polygon' && section.polygon) {
							const points = section.polygon
								.map(p => `${(p.x - bounds.minX) * scale},${(p.y - bounds.minY) * scale}`)
								.join(' ')
							return (
								<polygon
									key={section.id}
									points={points}
									fill={section.color || '#1976D2'}
									stroke={section.strokeColor || '#0D47A1'}
									strokeWidth={0.5}
									opacity={0.3}
								/>
							)
						} else if (section.bounds) {
							return (
								<rect
									key={section.id}
									x={(section.bounds.x1 - bounds.minX) * scale}
									y={(section.bounds.y1 - bounds.minY) * scale}
									width={(section.bounds.x2 - section.bounds.x1) * scale}
									height={(section.bounds.y2 - section.bounds.y1) * scale}
									fill={section.color || '#1976D2'}
									stroke={section.strokeColor || '#0D47A1'}
									strokeWidth={0.5}
									opacity={0.3}
								/>
							)
						}
						return null
					})}

					{/* Draw viewport indicator */}
					<rect
						x={overviewViewport.x}
						y={overviewViewport.y}
						width={overviewViewport.width}
						height={overviewViewport.height}
						fill="none"
						stroke="#FF5722"
						strokeWidth={2}
						strokeDasharray="4 4"
					/>

					{/* Draw all seats as tiny dots */}
					{places.slice(0, 1000).map((place, index) => {
						// Only show subset for performance
						if (index % 10 !== 0) return null
						const x = place.x !== undefined ? (place.x - bounds.minX) * scale : 0
						const y = place.y !== undefined ? (place.y - bounds.minY) * scale : 0
						const color = place.status === 'sold' || !place.available ? '#9E9E9E' : '#1976D2'

						return (
							<circle
								key={place.placeId}
								cx={x}
								cy={y}
								r={0.5}
								fill={color}
							/>
						)
					})}
				</svg>
			</Box>
		</Paper>
	)
}

export default SeatMapOverview

