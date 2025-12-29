'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Box, Paper, Typography, IconButton, Tooltip, Button, ButtonGroup } from '@mui/material'
import { ZoomIn, ZoomOut, Add, Edit, Fullscreen, FullscreenExit, FitScreen } from '@mui/icons-material'

/**
 * VenueCanvasEditor Component
 * Canvas-based visual editor for drawing section boundaries
 * Supports drawing rectangles and polygons
 */
const VenueCanvasEditor = ({
	width = 800,
	height = 600,
	sections = [],
	centralFeature = null,
	venue = null, // Full venue object (for backgroundSvg)
	onSectionAdd,
	onSectionUpdate,
	onSectionDelete,
	onCentralFeatureUpdate,
	onObstructionAdd,
	onObstructionUpdate,
	onSelectionChange, // Callback when section selection changes
	mode = 'advanced',
	drawingObstruction = null, // Current obstruction being drawn (from sectionForm)
	directionLabel = 'Kenttä' // Direction label (Field/Stage/Rink) - shown as arrow pointing up
}) => {
	const canvasRef = useRef(null)
	const containerRef = useRef(null)
	const [isDrawing, setIsDrawing] = useState(false)
	const [drawMode, setDrawMode] = useState(null) // 'rectangle', 'polygon', 'obstruction-rectangle', 'obstruction-polygon', null
	const [currentShape, setCurrentShape] = useState(null)
	const [selectedSection, setSelectedSection] = useState(null)
	const [scale, setScale] = useState(1)
	const [pan, setPan] = useState({ x: 0, y: 0 })
	const [startPoint, setStartPoint] = useState(null)
	const [polygonPoints, setPolygonPoints] = useState([])
	const [loadedImages, setLoadedImages] = useState(new Map()) // Cache for loaded images
	const [loadedSvgs, setLoadedSvgs] = useState(new Map()) // Cache for loaded SVG images
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [isPanning, setIsPanning] = useState(false)
	const [lastPanPoint, setLastPanPoint] = useState(null)
	const [currentObstruction, setCurrentObstruction] = useState(null) // Track which obstruction is being drawn
	const [hoveredPointIndex, setHoveredPointIndex] = useState(null) // Track which polygon point is being hovered
	const [mouseCoords, setMouseCoords] = useState(null) // Track mouse position in pixel coordinates
	const [isSpacePressed, setIsSpacePressed] = useState(false) // Track if space key is pressed for panning
	const [draggedSection, setDraggedSection] = useState(null) // Track which section is being dragged
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }) // Offset from click point to section origin
	const [resizingSection, setResizingSection] = useState(null) // Track which section is being resized
	const [resizeHandle, setResizeHandle] = useState(null) // Which handle: 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w', or polygon point index
	const [resizeStartBounds, setResizeStartBounds] = useState(null) // Original bounds before resize
	const [draggedPolygonPoint, setDraggedPolygonPoint] = useState(null) // Which polygon point is being dragged (index)

	// Grid spacing for visual reference (pixels)
	const GRID_SPACING = 50 // Pixels between grid lines

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

	// Load images when centralFeature changes
	useEffect(() => {
		if (centralFeature?.imageUrl && !loadedImages.has(centralFeature.imageUrl)) {
			const img = new Image()
			// Set crossOrigin for CORS support (important for external SVG/API endpoints)
			// Try 'anonymous' first, fallback to no CORS if it fails
			img.crossOrigin = 'anonymous'

			img.onload = () => {
				setLoadedImages(prev => new Map(prev).set(centralFeature.imageUrl, img))
				// Trigger re-render by updating state, which will call drawCanvas
			}
			img.onerror = (error) => {
				console.error('Failed to load image:', centralFeature.imageUrl, error)
				// If CORS fails, try without crossOrigin (for same-origin or CORS-enabled servers)
				if (img.crossOrigin === 'anonymous') {
					const imgRetry = new Image()
					imgRetry.onload = () => {
						setLoadedImages(prev => new Map(prev).set(centralFeature.imageUrl, imgRetry))
					}
					imgRetry.onerror = () => {
						console.error('Failed to load image even without CORS:', centralFeature.imageUrl)
					}
					imgRetry.src = centralFeature.imageUrl
				}
		}
		img.src = centralFeature.imageUrl
		}
	}, [centralFeature?.imageUrl, loadedImages])

	// Track Blob URLs for cleanup
	const blobUrlsRef = useRef(new Map())

	// Load SVG as Image when venue.backgroundSvg changes
	useEffect(() => {
		if (venue?.backgroundSvg?.svgContent && venue.backgroundSvg.isVisible) {
			const svgContent = venue.backgroundSvg.svgContent

			// Check if already cached
			if (loadedSvgs.has(svgContent)) return

			// Convert SVG string to data URL and create Image
			try {
				const img = new Image()
				// Only set crossOrigin for external URLs, not for data URLs or Blob URLs
				// crossOrigin can cause issues with data URLs in some browsers

				let svgDataUrl = svgContent
				let useBlobUrl = false
				let blobUrl = null

				// Handle different SVG content formats (matching SeatMapViewer approach)
				if (svgDataUrl.startsWith('data:image/svg+xml')) {
					// Already a proper data URL, use as-is
				} else if (svgDataUrl.startsWith('<svg') || svgDataUrl.startsWith('<?xml')) {
					// Raw SVG content - SVG may contain embedded PNG images (xlink:href="data:image/png;base64,...")
					// These embedded images must be preserved when encoding the SVG
					let svgString = typeof svgContent === 'string' ? svgContent : String(svgContent)

					// Sanitize SVG: Fix common issues like invalid attributes (e.g., "c" without value)
					// Remove invalid single-letter attributes without values
					// Pattern: space(s) + single letter + space(s) + > or />
					svgString = svgString.replace(/\s+([a-z])\s*>/gi, '>') // Remove ' c>' -> '>'
					svgString = svgString.replace(/\s+([a-z])\s*\/>/gi, '/>') // Remove ' c />' -> '/>'
					// Handle cases where invalid attribute appears after valid attributes: 'viewBox="..." c>'
					svgString = svgString.replace(/(="[^"]*")\s+([a-z])\s*>/gi, '$1>') // Remove ' c>' after quoted attributes
					svgString = svgString.replace(/(=\S+)\s+([a-z])\s*>/gi, '$1>') // Remove ' c>' after unquoted attributes

					// Check if SVG contains embedded images (xlink:href with data:image)
					const hasEmbeddedImages = svgString.includes('xlink:href="data:image') || svgString.includes('href="data:image')

					if (hasEmbeddedImages) {
						// For SVGs with embedded images, Blob URL is the most reliable method
						// It preserves the embedded base64 PNG data URLs without encoding issues
						try {
							const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
							blobUrl = URL.createObjectURL(svgBlob)
							blobUrlsRef.current.set(svgContent, blobUrl) // Track for cleanup
							useBlobUrl = true
							svgDataUrl = blobUrl
							console.log('Using Blob URL for SVG with embedded images')
						} catch (blobError) {
							// If Blob fails, try base64 encoding (preserves embedded images better than URI)
							console.warn('Blob URL creation failed, trying base64:', blobError)
							try {
								// Base64 encoding preserves embedded base64 PNG images in the SVG
								// The embedded data:image/png;base64,... strings remain intact
								svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`
								console.log('Using base64 encoding for SVG with embedded images')
							} catch (base64Error) {
								// URI encoding can break embedded images, but it's the last resort
								console.warn('Base64 encoding failed, using URI encoding (may break embedded images):', base64Error)
								svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
							}
						}
					} else {
						// No embedded images - can use any encoding method
						// Try Blob URL first for consistency
						try {
							const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
							blobUrl = URL.createObjectURL(svgBlob)
							blobUrlsRef.current.set(svgContent, blobUrl)
							useBlobUrl = true
							svgDataUrl = blobUrl
						} catch (blobError) {
							// Fall back to URI encoding (works in SeatMapViewer)
							svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
						}
					}
				} else if (svgDataUrl.startsWith('data:')) {
					// Some other data URL format, use as-is
				} else {
					// Try Blob URL approach for other formats
					try {
						const svgString = typeof svgContent === 'string' ? svgContent : String(svgContent)
						const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
						blobUrl = URL.createObjectURL(svgBlob)
						blobUrlsRef.current.set(svgContent, blobUrl) // Track for cleanup
						useBlobUrl = true
						svgDataUrl = blobUrl
					} catch (blobError) {
						// If Blob fails, try base64 encoding
						console.warn('Blob URL failed, trying base64:', blobError)
						const svgString = typeof svgContent === 'string' ? svgContent : String(svgContent)
						svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`
					}
				}

				// Set up handlers
				img.onload = () => {
					setLoadedSvgs(prev => new Map(prev).set(svgContent, img))
					// Don't revoke Blob URL immediately - keep it until component unmounts
					// The Blob URL is needed for the image to remain loaded
				}
				img.onerror = (error) => {
					console.error('Failed to load SVG as image:', error)
					console.error('SVG content length:', svgContent.length)
					console.error('SVG data URL starts with:', svgDataUrl.substring(0, 100))
					console.error('Original SVG content starts with:', svgContent.substring(0, 100))
					console.error('Image error details:', {
						naturalWidth: img.naturalWidth,
						naturalHeight: img.naturalHeight,
						complete: img.complete,
						width: img.width,
						height: img.height
					})

					// If Blob URL failed, try URI encoding (which works in SeatMapViewer)
					if (useBlobUrl && blobUrl) {
						URL.revokeObjectURL(blobUrl)
						blobUrlsRef.current.delete(svgContent)
						console.log('Blob URL failed, retrying with URI encoding (matching SeatMapViewer approach)...')

						// Retry with URI encoding (same as SeatMapViewer uses)
						const retryImg = new Image()
						const svgString = typeof svgContent === 'string' ? svgContent : String(svgContent)
						const uriEncodedUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`

						retryImg.onload = () => {
							console.log('URI encoding succeeded!')
							setLoadedSvgs(prev => new Map(prev).set(svgContent, retryImg))
						}
						retryImg.onerror = (retryError) => {
							console.error('URI encoding also failed:', retryError)
							console.error('URI URL length:', uriEncodedUrl.length)
							console.error('URI URL starts with:', uriEncodedUrl.substring(0, 150))
							console.error('SVG content sample (first 500 chars):', svgString.substring(0, 500))

							// Check if SVG is valid XML and try to fix it
							try {
								const parser = new DOMParser()
								let svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
								let parseError = svgDoc.querySelector('parsererror')

								if (parseError) {
									console.error('SVG parsing error:', parseError.textContent)

									// Try to fix common issues and reparse
									let fixedSvg = svgString
									// Remove invalid single-letter attributes without values
									fixedSvg = fixedSvg.replace(/\s+([a-z])\s*>/gi, '>')
									fixedSvg = fixedSvg.replace(/\s+([a-z])\s*\/>/gi, '/>')
									// Remove attributes with no value (e.g., ' c' before > or />)
									fixedSvg = fixedSvg.replace(/\s+([a-z])\s*([=>])/gi, '$2')

									// Try parsing again
									svgDoc = parser.parseFromString(fixedSvg, 'image/svg+xml')
									parseError = svgDoc.querySelector('parsererror')

									if (!parseError) {
										console.log('SVG fixed! Retrying with sanitized SVG...')
										// Retry loading with fixed SVG
										const fixedImg = new Image()
										const fixedBlob = new Blob([fixedSvg], { type: 'image/svg+xml;charset=utf-8' })
										const fixedBlobUrl = URL.createObjectURL(fixedBlob)
										blobUrlsRef.current.set(svgContent, fixedBlobUrl)

										fixedImg.onload = () => {
											setLoadedSvgs(prev => new Map(prev).set(svgContent, fixedImg))
										}
										fixedImg.onerror = () => {
											console.error('Fixed SVG still failed to load')
											URL.revokeObjectURL(fixedBlobUrl)
										}
										fixedImg.src = fixedBlobUrl
										return // Exit early, fixed version is loading
									} else {
										console.error('SVG could not be fixed:', parseError.textContent)
									}
								} else {
									console.log('SVG is valid XML, but Image element cannot load it')
									console.log('SVG root element:', svgDoc.documentElement.tagName)
									console.log('SVG namespace:', svgDoc.documentElement.namespaceURI)
								}
							} catch (parseErr) {
								console.error('Failed to parse SVG as XML:', parseErr)
							}

							// Last resort: try base64
							console.log('Trying base64 encoding as last resort...')
							const base64Img = new Image()
							try {
								const base64Url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`
								base64Img.onload = () => {
									console.log('Base64 encoding succeeded!')
									setLoadedSvgs(prev => new Map(prev).set(svgContent, base64Img))
								}
								base64Img.onerror = () => {
									console.error('All encoding methods failed. SVG may be invalid or too large.')
								}
								base64Img.src = base64Url
							} catch (base64Err) {
								console.error('Failed to create base64 URL:', base64Err)
							}
						}
						retryImg.src = uriEncodedUrl
					}
				}

				// Set src after handlers are attached
				img.src = svgDataUrl
			} catch (error) {
				console.error('Error creating SVG image:', error)
			}
		}

		// Cleanup function: revoke Blob URLs when SVG content changes or component unmounts
		return () => {
			blobUrlsRef.current.forEach((url, content) => {
				// Only revoke if this SVG is no longer in use
				if (!loadedSvgs.has(content)) {
					URL.revokeObjectURL(url)
					blobUrlsRef.current.delete(content)
				}
			})
		}
	}, [venue?.backgroundSvg?.svgContent, venue?.backgroundSvg?.isVisible, loadedSvgs])

	// Function to draw background SVG
	const drawBackgroundSvg = (ctx, bgSvg) => {
		const img = loadedSvgs.get(bgSvg.svgContent)
		if (!img || !img.complete) return

		ctx.save()
		ctx.globalAlpha = bgSvg.opacity || 0.5

		// Apply additional transforms (translate, scale, rotate)
		const translateX = bgSvg.translateX || 0
		const translateY = bgSvg.translateY || 0
		const svgScale = bgSvg.scale || 1.0
		const rotation = bgSvg.rotation || 0

		ctx.translate(translateX, translateY)

		// Apply rotation around the center of the image
		if (rotation !== 0) {
			const centerX = (img.width * svgScale) / 2
			const centerY = (img.height * svgScale) / 2
			ctx.translate(centerX, centerY)
			ctx.rotate((rotation * Math.PI) / 180)
			ctx.translate(-centerX, -centerY)
		}

		// Draw the SVG image
		ctx.drawImage(img, 0, 0, img.width * svgScale, img.height * svgScale)

		ctx.restore()
	}

	const drawCanvas = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		// Draw background SVG (if available, FIRST LAYER, with transformations)
		if (venue?.backgroundSvg?.svgContent && venue.backgroundSvg.isVisible) {
			ctx.save()
			ctx.translate(pan.x, pan.y)
			ctx.scale(scale, scale)
			drawBackgroundSvg(ctx, venue.backgroundSvg)
			ctx.restore()
		}

		// Draw background grid (before transformations)
		// Calculate visible grid lines based on pan and scale
		const startX = Math.floor(-pan.x / scale / GRID_SPACING) * GRID_SPACING
		const endX = Math.ceil((canvas.width - pan.x) / scale / GRID_SPACING) * GRID_SPACING
		const startY = Math.floor(-pan.y / scale / GRID_SPACING) * GRID_SPACING
		const endY = Math.ceil((canvas.height - pan.y) / scale / GRID_SPACING) * GRID_SPACING

		// Draw minor grid lines
		ctx.strokeStyle = '#d0d0d0'
		ctx.lineWidth = 1
		for (let x = startX; x <= endX; x += GRID_SPACING) {
			const pixelX = (x * scale) + pan.x
			if (pixelX >= 0 && pixelX <= canvas.width) {
				ctx.beginPath()
				ctx.moveTo(pixelX, 0)
				ctx.lineTo(pixelX, canvas.height)
				ctx.stroke()
			}
		}
		for (let y = startY; y <= endY; y += GRID_SPACING) {
			const pixelY = (y * scale) + pan.y
			if (pixelY >= 0 && pixelY <= canvas.height) {
				ctx.beginPath()
				ctx.moveTo(0, pixelY)
				ctx.lineTo(canvas.width, pixelY)
				ctx.stroke()
			}
		}

		// Draw major grid lines (every 5 units) with labels
		ctx.strokeStyle = '#b0b0b0'
		ctx.lineWidth = 2
		ctx.fillStyle = '#666'
		ctx.font = '12px Arial'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'top'
		for (let x = Math.floor(startX / (GRID_SPACING * 5)) * (GRID_SPACING * 5); x <= endX; x += GRID_SPACING * 5) {
			const pixelX = (x * scale) + pan.x
			if (pixelX >= 0 && pixelX <= canvas.width) {
				ctx.beginPath()
				ctx.moveTo(pixelX, 0)
				ctx.lineTo(pixelX, canvas.height)
				ctx.stroke()
				ctx.fillText(x.toString(), pixelX, 2)
			}
		}
		ctx.textAlign = 'left'
		ctx.textBaseline = 'middle'
		for (let y = Math.floor(startY / (GRID_SPACING * 5)) * (GRID_SPACING * 5); y <= endY; y += GRID_SPACING * 5) {
			const pixelY = (y * scale) + pan.y
			if (pixelY >= 0 && pixelY <= canvas.height) {
				ctx.beginPath()
				ctx.moveTo(0, pixelY)
				ctx.lineTo(canvas.width, pixelY)
				ctx.stroke()
				ctx.fillText(y.toString(), 2, pixelY)
			}
		}

		// Apply transformations for zoom and pan (for drawing content)
		ctx.save()
		ctx.translate(pan.x, pan.y)
		ctx.scale(scale, scale)

		// Draw central feature (rink, stage, etc.)
		if (centralFeature && centralFeature.type !== 'none') {
			drawCentralFeature(ctx, centralFeature)
		}

		// Draw sections
		if (sections && Array.isArray(sections) && sections.length > 0) {
			sections.forEach((section) => {
				if (section && section.id) {
					drawSection(ctx, section, section.id === selectedSection?.id)
					// Draw obstructions within this section
					if (section.obstructions && Array.isArray(section.obstructions)) {
						section.obstructions.forEach((obstruction) => {
							drawObstruction(ctx, obstruction)
						})
					}
				}
			})
		}

		// Draw resize handles for selected section
		if (selectedSection) {
			if (selectedSection.shape === 'rectangle') {
				drawResizeHandles(ctx, selectedSection)
			} else if (selectedSection.shape === 'polygon' && selectedSection.polygon && selectedSection.polygon.length >= 3) {
				drawPolygonResizeHandles(ctx, selectedSection)
			}
		}

		// Draw current shape being drawn
		if (currentShape) {
			if (currentShape.type === 'rectangle' || currentShape.type === 'obstruction-rectangle') {
				drawCurrentRectangle(ctx, currentShape, currentShape.type === 'obstruction-rectangle')
			}
		}

		// Draw polygon points being collected
		// Points are in pixel coordinates
		if (polygonPoints.length > 0) {
			drawPolygonPoints(ctx, polygonPoints, drawMode === 'obstruction-polygon', hoveredPointIndex)
		}

		ctx.restore()
	}, [sections, centralFeature, scale, pan, currentShape, polygonPoints, selectedSection, loadedImages, loadedSvgs, isPanning, drawingObstruction, drawMode, hoveredPointIndex, directionLabel, venue])

	// Draw canvas whenever sections or state changes, or when canvas size changes
	useEffect(() => {
		drawCanvas()
	}, [drawCanvas, width, height, isFullscreen])

	// No coordinate conversion needed - we use pixel coordinates directly

	const drawCentralFeature = (ctx, feature) => {
		// Don't draw if dimensions haven't been configured yet
		if (feature.shape === 'rectangle') {
			// Check if x, y, width, height are explicitly set (not just defaults)
			const hasValidBounds = (
				feature.x !== undefined && feature.x !== null &&
				feature.y !== undefined && feature.y !== null &&
				feature.width !== undefined && feature.width !== null && feature.width > 0 &&
				feature.height !== undefined && feature.height !== null && feature.height > 0
			)
			if (!hasValidBounds) {
				return // Don't draw unconfigured rectangle
			}
		} else if (feature.shape === 'circle') {
			const hasValidCircle = (
				feature.centerX !== undefined && feature.centerX !== null &&
				feature.centerY !== undefined && feature.centerY !== null &&
				feature.radiusX !== undefined && feature.radiusX !== null && feature.radiusX > 0
			)
			if (!hasValidCircle) {
				return // Don't draw unconfigured circle
			}
		} else if (feature.shape === 'polygon') {
			if (!feature.points || feature.points.length < 3) {
				return // Don't draw unconfigured polygon
			}
		}

		// If image is provided, draw it first
		if (feature.imageUrl) {
			const img = loadedImages.get(feature.imageUrl)

			if (img && img.complete && (img.naturalWidth > 0 || img.naturalHeight > 0)) {
				// Calculate image dimensions and position
				let imgX, imgY, imgWidth, imgHeight

				// For SVG images, naturalWidth/naturalHeight might be 0, use viewBox or default dimensions
				const svgWidth = img.naturalWidth || img.width || 800
				const svgHeight = img.naturalHeight || img.height || 600

				if (feature.shape === 'circle') {
					const radius = feature.radiusX || 50 // Pixels
					const centerX = feature.centerX || 400 // Pixels
					const centerY = feature.centerY || 300 // Pixels
					imgX = centerX - radius
					imgY = centerY - radius
					imgWidth = radius * 2
					imgHeight = radius * 2
				} else if (feature.shape === 'polygon' && feature.points && feature.points.length > 0) {
					// For polygon, use bounding box (points are in pixel coordinates)
					const minX = Math.min(...feature.points.map(p => p.x))
					const maxX = Math.max(...feature.points.map(p => p.x))
					const minY = Math.min(...feature.points.map(p => p.y))
					const maxY = Math.max(...feature.points.map(p => p.y))
					imgX = minX
					imgY = minY
					imgWidth = maxX - minX
					imgHeight = maxY - minY
				} else {
					// Rectangle - coordinates are in pixels
					imgX = feature.x || 0
					imgY = feature.y || 0
					imgWidth = feature.imageWidth || feature.width || 200
					imgHeight = feature.imageHeight || feature.height || 200
				}

				// Draw image with opacity
				ctx.save()
				ctx.globalAlpha = feature.imageOpacity || 1.0

				// If shape is circle, clip to circle
				if (feature.shape === 'circle') {
					const radius = feature.radiusX || 50 // Pixels
					const centerX = feature.centerX || 400 // Pixels
					const centerY = feature.centerY || 300 // Pixels
					ctx.beginPath()
					ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
					ctx.clip()
				} else if (feature.shape === 'polygon' && feature.points && feature.points.length > 0) {
					// Clip to polygon (points are in pixel coordinates)
					ctx.beginPath()
					ctx.moveTo(feature.points[0].x, feature.points[0].y)
					for (let i = 1; i < feature.points.length; i++) {
						ctx.lineTo(feature.points[i].x, feature.points[i].y)
					}
					ctx.closePath()
					ctx.clip()
				}

				// Draw the image
				ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight)
				ctx.restore()
			}
		}

		// Draw shape overlay (with reduced opacity if image is present)
		ctx.fillStyle = feature.color || '#E3F2FD'
		ctx.strokeStyle = feature.strokeColor || '#1976D2'
		ctx.lineWidth = 2

		if (feature.shape === 'circle') {
			const radius = feature.radiusX || 50 // Pixels
			const centerX = feature.centerX || 400 // Pixels
			const centerY = feature.centerY || 300 // Pixels
			ctx.beginPath()
			ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
			if (!feature.imageUrl) {
				ctx.fill()
			}
			ctx.stroke()
		} else if (feature.shape === 'polygon' && feature.points && feature.points.length > 0) {
			// Points are in pixel coordinates
			drawPolygonShape(ctx, feature.points, !feature.imageUrl)
		} else {
			// Rectangle - coordinates are in pixels
			const x = feature.x || 0
			const y = feature.y || 0
			const w = feature.width || 200
			const h = feature.height || 200

			if (!feature.imageUrl) {
				ctx.fillRect(x, y, w, h)
			}
			ctx.strokeRect(x, y, w, h)
		}

		// Draw label
		if (feature.name) {
			ctx.fillStyle = '#1976D2'
			ctx.font = 'bold 14px Arial'
			ctx.textAlign = 'center'
			let centerX, centerY
			if (feature.shape === 'circle') {
				centerX = feature.centerX || 400
				centerY = feature.centerY || 300
			} else if (feature.shape === 'polygon' && feature.points && feature.points.length > 0) {
				// Calculate center from polygon points (in pixel coordinates)
				const sumX = feature.points.reduce((sum, p) => sum + p.x, 0)
				const sumY = feature.points.reduce((sum, p) => sum + p.y, 0)
				centerX = sumX / feature.points.length
				centerY = sumY / feature.points.length
			} else {
				centerX = (feature.x || 0) + (feature.width || 200) / 2
				centerY = (feature.y || 0) + (feature.height || 200) / 2
			}
			ctx.fillText(feature.name, centerX, centerY)
		}
	}

	const drawSection = (ctx, section, isSelected = false) => {
		if (!section) return

		ctx.fillStyle = section.color || '#1976D2'
		ctx.strokeStyle = isSelected ? '#FF5722' : (section.strokeColor || '#0D47A1')
		ctx.lineWidth = isSelected ? 3 : 2
		ctx.globalAlpha = section.opacity || 0.6

		if (section.shape === 'polygon' && section.polygon && Array.isArray(section.polygon) && section.polygon.length >= 3) {
			// Points are in pixel coordinates
			drawPolygonShape(ctx, section.polygon, true)
		} else if (section.bounds) {
			// Rectangle - bounds are in pixel coordinates
			const bounds = section.bounds
			if (bounds.x1 !== undefined && bounds.x2 !== undefined && bounds.y1 !== undefined && bounds.y2 !== undefined) {
				const x = Math.min(bounds.x1, bounds.x2)
				const y = Math.min(bounds.y1, bounds.y2)
				const w = Math.abs(bounds.x2 - bounds.x1)
				const h = Math.abs(bounds.y2 - bounds.y1)

				if (w > 0 && h > 0) {
					ctx.fillRect(x, y, w, h)
					ctx.strokeRect(x, y, w, h)
				}
			}
		}

		ctx.globalAlpha = 1.0

		// Draw section label
		if (section.name) {
			ctx.fillStyle = '#000'
			ctx.font = 'bold 12px Arial'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'

			let centerX = 0
			let centerY = 0

			if (section.shape === 'polygon' && section.polygon && section.polygon.length > 0) {
				// Polygon points are in pixel coordinates
				const sumX = section.polygon.reduce((sum, p) => sum + (p.x || 0), 0)
				const sumY = section.polygon.reduce((sum, p) => sum + (p.y || 0), 0)
				centerX = sumX / section.polygon.length
				centerY = sumY / section.polygon.length
			} else if (section.bounds) {
				// Bounds are in pixel coordinates
				centerX = (section.bounds.x1 + section.bounds.x2) / 2
				centerY = (section.bounds.y1 + section.bounds.y2) / 2
			}

			if (centerX > 0 || centerY > 0) {
				ctx.fillText(section.name, centerX, centerY)
			}
		}
	}

	const drawPolygonShape = (ctx, points, fill = true) => {
		if (!points || points.length < 3) return

		ctx.beginPath()
		ctx.moveTo(points[0].x, points[0].y)
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y)
		}
		ctx.closePath()

		if (fill) {
			ctx.fill()
		}
		ctx.stroke()
	}

	const drawObstruction = (ctx, obstruction) => {
		if (!obstruction) return

		ctx.fillStyle = obstruction.color || '#CCCCCC'
		ctx.strokeStyle = obstruction.strokeColor || '#999999'
		ctx.lineWidth = 2 / scale
		ctx.globalAlpha = 0.8

		if (obstruction.shape === 'polygon' && obstruction.polygon && obstruction.polygon.length >= 3) {
			// Points are in pixel coordinates
			drawPolygonShape(ctx, obstruction.polygon, true)
		} else if (obstruction.bounds) {
			// Bounds are in pixel coordinates
			const { x1, y1, x2, y2 } = obstruction.bounds
			if (x1 !== undefined && x2 !== undefined && y1 !== undefined && y2 !== undefined) {
				const x = Math.min(x1, x2)
				const y = Math.min(y1, y2)
				const w = Math.abs(x2 - x1)
				const h = Math.abs(y2 - y1)
				if (w > 0 && h > 0) {
					ctx.fillRect(x, y, w, h)
					ctx.strokeRect(x, y, w, h)
				}
			}
		}

		ctx.globalAlpha = 1.0

		// Draw label if provided
		if (obstruction.name) {
			ctx.fillStyle = '#666'
			ctx.font = '10px Arial'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			let centerX = 0
			let centerY = 0
			if (obstruction.bounds) {
				centerX = (obstruction.bounds.x1 + obstruction.bounds.x2) / 2
				centerY = (obstruction.bounds.y1 + obstruction.bounds.y2) / 2
			} else if (obstruction.polygon && obstruction.polygon.length > 0) {
				const sumX = obstruction.polygon.reduce((sum, p) => sum + (p.x || 0), 0)
				const sumY = obstruction.polygon.reduce((sum, p) => sum + (p.y || 0), 0)
				centerX = sumX / obstruction.polygon.length
				centerY = sumY / obstruction.polygon.length
			}
			if (centerX > 0 || centerY > 0) {
				ctx.fillText(obstruction.name, centerX, centerY)
			}
		}
	}

	const drawCurrentRectangle = (ctx, shape, isObstruction = false) => {
		if (!shape.start || !shape.end) return

		// Shape coordinates are in pixel coordinates
		const x = Math.min(shape.start.x, shape.end.x)
		const y = Math.min(shape.start.y, shape.end.y)
		const w = Math.abs(shape.end.x - shape.start.x)
		const h = Math.abs(shape.end.y - shape.start.y)

		ctx.strokeStyle = isObstruction ? '#CCCCCC' : '#FF5722'
		ctx.fillStyle = isObstruction ? 'rgba(204, 204, 204, 0.3)' : 'transparent'
		ctx.lineWidth = 2 / scale
		ctx.setLineDash([5 / scale, 5 / scale])
		if (isObstruction) {
			ctx.fillRect(x, y, w, h)
		}
		ctx.strokeRect(x, y, w, h)
		ctx.setLineDash([])
	}

	// Add keyboard handler for Backspace to remove last point and Space for panning
	useEffect(() => {
		const handleKeyDown = (e) => {
			// Check if user is typing in an input/textarea
			const isTyping = e.target.tagName === 'INPUT' ||
			                 e.target.tagName === 'TEXTAREA' ||
			                 e.target.isContentEditable

			// Handle space key for panning (but not when typing)
			if ((e.key === ' ' || e.key === 'Spacebar') && !isTyping) {
				e.preventDefault()
				setIsSpacePressed(true)
				return
			}

			// Only handle if we're in polygon drawing mode and not typing
			if ((drawMode === 'polygon' || drawMode === 'obstruction-polygon') && polygonPoints.length > 0 && !isTyping) {
				if (e.key === 'Backspace' || e.key === 'Delete') {
					e.preventDefault()
					// Remove last point
					const newPoints = polygonPoints.slice(0, -1)
					setPolygonPoints(newPoints)
				} else if (e.key === 'Escape') {
					// Cancel polygon drawing
					setPolygonPoints([])
					setDrawMode(null)
				}
			}
		}

		const handleKeyUp = (e) => {
			// Check if user is typing in an input/textarea
			const isTyping = e.target.tagName === 'INPUT' ||
			                 e.target.tagName === 'TEXTAREA' ||
			                 e.target.isContentEditable

			// Handle space key release (but not when typing)
			if ((e.key === ' ' || e.key === 'Spacebar') && !isTyping) {
				e.preventDefault()
				setIsSpacePressed(false)
				// Stop panning if space is released
				if (isPanning) {
					setIsPanning(false)
				}
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('keyup', handleKeyUp)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('keyup', handleKeyUp)
		}
	}, [drawMode, polygonPoints, isPanning])


	const drawPolygonPoints = (ctx, points, isObstruction = false, hoveredIndex = null) => {
		if (!points || points.length === 0) return

		// Points are in pixel coordinates

		// Radius in pixels (in the transformed coordinate space)
		// Since we're scaled, we need larger radius to be visible
		const radiusPx = 8 / scale // Scale inversely so it stays visible
		const hoverRadiusPx = 12 / scale

		// Draw lines between points
		if (points.length > 1) {
			ctx.strokeStyle = isObstruction ? '#999999' : '#FF5722'
			ctx.lineWidth = 2 / scale
			ctx.setLineDash([5 / scale, 5 / scale])
			ctx.beginPath()
			ctx.moveTo(points[0].x, points[0].y)
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(points[i].x, points[i].y)
			}
			ctx.stroke()
			ctx.setLineDash([])
		}

		// Draw points
		points.forEach((point, index) => {
			const isHovered = hoveredIndex === index
			const radius = isHovered ? hoverRadiusPx : radiusPx

			// Draw outer circle for hovered point
			if (isHovered) {
				ctx.fillStyle = '#FF0000'
				ctx.beginPath()
				ctx.arc(point.x, point.y, radius + 2, 0, 2 * Math.PI)
				ctx.fill()
			}

			// Draw point circle
			ctx.fillStyle = isObstruction ? '#CCCCCC' : (isHovered ? '#FF0000' : '#FF5722')
			ctx.strokeStyle = isObstruction ? '#999999' : (isHovered ? '#FF0000' : '#FF5722')
			ctx.lineWidth = (isHovered ? 2 : 1.5) / scale
			ctx.beginPath()
			ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI)
			ctx.fill()
			ctx.stroke()

			// Draw point number
			ctx.fillStyle = '#FFFFFF'
			ctx.font = `bold ${Math.max(10, 12 / scale)}px Arial`
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillText((index + 1).toString(), point.x, point.y)
		})
	}

	const getCanvasCoordinates = (e) => {
		const canvas = canvasRef.current
		if (!canvas) return null

		const rect = canvas.getBoundingClientRect()
		// Get screen coordinates relative to canvas
		const screenX = e.clientX - rect.left
		const screenY = e.clientY - rect.top

		// Convert screen coordinates to canvas coordinates
		// Account for pan and scale transformations
		// The transformation is: translate(pan.x, pan.y), then scale(scale, scale)
		// So to reverse: first unscale, then untranslate
		const x = (screenX - pan.x) / scale
		const y = (screenY - pan.y) / scale

		// Round to nearest 5 pixels for better snapping to grid
		return {
			x: Math.round(x / 5) * 5,
			y: Math.round(y / 5) * 5
		}
	}

	const handleMouseDown = (e) => {
		// Handle panning with middle mouse button or space key + left click
		if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
			setIsPanning(true)
			setLastPanPoint({ x: e.clientX, y: e.clientY })
			e.preventDefault()
			return
		}

		const coords = getCanvasCoordinates(e)
		if (!coords) return

		// If not in draw mode, check if clicking on resize handle or section
		if (mode === 'advanced' && !drawMode) {
			// First check if clicking on a resize handle of the selected section
			if (selectedSection) {
				const handle = findResizeHandle(coords, selectedSection)

				if (handle) {
					setResizingSection(selectedSection)
					setResizeHandle(handle)

					// Store original bounds/polygon for comparison
					if (selectedSection.shape === 'rectangle' && selectedSection.bounds) {
						setResizeStartBounds({ ...selectedSection.bounds })
					} else if (selectedSection.shape === 'polygon' && selectedSection.polygon) {
						// For polygons, store the original polygon points
						setResizeStartBounds({
							polygon: selectedSection.polygon.map(p => ({ ...p }))
						})
					}

					setIsDrawing(true)
					return
				}
			}

			// Then check if clicking on a section
			const clickedSection = findSectionAtPoint(coords)
			if (clickedSection) {
				// Select the section (show resize handles)
				setSelectedSection(clickedSection)
				if (onSelectionChange) {
					onSelectionChange(clickedSection.id)
				}

				// If there's an update handler, allow dragging
				if (onSectionUpdate) {
					setDraggedSection(clickedSection)
					// Calculate offset from click point to section's center/origin
					if (clickedSection.shape === 'rectangle' && clickedSection.bounds) {
						const centerX = (clickedSection.bounds.x1 + clickedSection.bounds.x2) / 2
						const centerY = (clickedSection.bounds.y1 + clickedSection.bounds.y2) / 2
						setDragOffset({
							x: coords.x - centerX,
							y: coords.y - centerY
						})
					} else if (clickedSection.shape === 'polygon' && clickedSection.polygon) {
						// For polygon, use the first point as reference
						const refPoint = clickedSection.polygon[0]
						setDragOffset({
							x: coords.x - refPoint.x,
							y: coords.y - refPoint.y
						})
					}
					setIsDrawing(true) // Use isDrawing to track dragging
				}
				return
			} else {
				// Clicked on empty space - deselect
				setSelectedSection(null)
				if (onSelectionChange) {
					onSelectionChange(null)
				}
			}
		}

		if (mode !== 'advanced' || !drawMode) return

		// Handle obstruction drawing
		if (drawMode === 'obstruction-rectangle' || drawMode === 'obstruction-polygon') {
			if (drawMode === 'obstruction-rectangle') {
				setIsDrawing(true)
				setStartPoint(coords)
				setCurrentShape({ type: 'obstruction-rectangle', start: coords, end: coords })
			} else if (drawMode === 'obstruction-polygon') {
				// Check if clicking on an existing point to delete it
				const clickedPointIndex = findPointIndex(coords, polygonPoints)
				if (clickedPointIndex >= 0) {
					// Remove the clicked point
					const newPoints = polygonPoints.filter((_, i) => i !== clickedPointIndex)
					setPolygonPoints(newPoints)
				} else {
					// Add new point
					setPolygonPoints([...polygonPoints, coords])
				}
			}
			return
		}

		// Handle section drawing
		if (drawMode === 'rectangle') {
			setIsDrawing(true)
			setStartPoint(coords)
			setCurrentShape({ type: 'rectangle', start: coords, end: coords })
		} else if (drawMode === 'polygon') {
			// Check if clicking on an existing point to delete it
			const clickedPointIndex = findPointIndex(coords, polygonPoints)
			if (clickedPointIndex >= 0) {
				// Remove the clicked point
				const newPoints = polygonPoints.filter((_, i) => i !== clickedPointIndex)
				setPolygonPoints(newPoints)
			} else {
				// Add new point
				setPolygonPoints([...polygonPoints, coords])
			}
		}
	}

	const handleMouseMove = (e) => {
		// Update mouse coordinates display
		const coords = getCanvasCoordinates(e)
		if (coords) {
			setMouseCoords(coords)
		}

		// Handle panning
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

		// Update cursor based on hover state (when not in draw mode and not dragging/resizing)
		if (mode === 'advanced' && !drawMode && !draggedSection && !resizingSection && !isDrawing) {
			const canvas = canvasRef.current
			if (canvas && coords) {
				// Check if hovering over a resize handle first
				if (selectedSection) {
					const handle = findResizeHandle(coords, selectedSection)
					if (handle) {
				// Set resize cursor based on handle type
				const cursors = {
					'nw': 'nw-resize',
					'ne': 'ne-resize',
					'sw': 'sw-resize',
					'se': 'se-resize',
					'n': 'n-resize',
					's': 's-resize',
					'w': 'w-resize',
					'e': 'e-resize'
				}
				// Polygon points get move cursor
				if (handle && handle.startsWith('polygon-point-')) {
					canvas.style.cursor = 'move'
				} else {
					canvas.style.cursor = cursors[handle] || 'default'
				}
						return
					}
				}

				// Otherwise check if hovering over a section
				const hoveredSection = findSectionAtPoint(coords)
				canvas.style.cursor = hoveredSection ? 'move' : 'default'
			}
		} else if (draggedSection) {
			const canvas = canvasRef.current
			if (canvas) {
				canvas.style.cursor = 'grabbing'
			}
		} else if (resizingSection) {
			// Keep resize cursor during drag
			const canvas = canvasRef.current
			if (canvas && resizeHandle) {
				const cursors = {
					'nw': 'nw-resize',
					'ne': 'ne-resize',
					'sw': 'sw-resize',
					'se': 'se-resize',
					'n': 'n-resize',
					's': 's-resize',
					'w': 'w-resize',
					'e': 'e-resize'
				}
				// Polygon points get move cursor
				if (resizeHandle && resizeHandle.startsWith('polygon-point-')) {
					canvas.style.cursor = 'move'
				} else {
					canvas.style.cursor = cursors[resizeHandle] || 'default'
				}
			}
		}

		// Handle rectangle section resizing (NOT polygon points)
		if (resizingSection && isDrawing && coords && onSectionUpdate && resizeHandle && resizeStartBounds &&
		    !resizeHandle.startsWith('polygon-point-')) {
			// Find the current version of the section from the sections array (as it may have been updated)
			const currentSection = sections.find(s => s.id === resizingSection.id)
			if (!currentSection || !currentSection.bounds) return

			const currentBounds = currentSection.bounds

			// Compare against ORIGINAL bounds (when resize started), not current bounds
			const originalWidth = Math.abs(resizeStartBounds.x2 - resizeStartBounds.x1)
			const originalHeight = Math.abs(resizeStartBounds.y2 - resizeStartBounds.y1)
			const minWidth = 50 // Absolute minimum section width
			const minHeight = 50 // Absolute minimum section height

			let newBounds = { ...currentBounds }

			// Update bounds based on which handle is being dragged
			switch (resizeHandle) {
				case 'nw':
					newBounds.x1 = coords.x
					newBounds.y1 = coords.y
					break
				case 'ne':
					newBounds.x2 = coords.x
					newBounds.y1 = coords.y
					break
				case 'sw':
					newBounds.x1 = coords.x
					newBounds.y2 = coords.y
					break
				case 'se':
					newBounds.x2 = coords.x
					newBounds.y2 = coords.y
					break
				case 'n':
					newBounds.y1 = coords.y
					break
				case 's':
					newBounds.y2 = coords.y
					break
				case 'w':
					newBounds.x1 = coords.x
					break
				case 'e':
					newBounds.x2 = coords.x
					break
			}

			// Ensure bounds are normalized (x1 < x2, y1 < y2)
			const normalizedBounds = {
				x1: Math.min(newBounds.x1, newBounds.x2),
				y1: Math.min(newBounds.y1, newBounds.y2),
				x2: Math.max(newBounds.x1, newBounds.x2),
				y2: Math.max(newBounds.y1, newBounds.y2)
			}

			// Calculate new dimensions
			const newWidth = normalizedBounds.x2 - normalizedBounds.x1
			const newHeight = normalizedBounds.y2 - normalizedBounds.y1

			// Check if we're strictly enlarging (BOTH dimensions growing, compare to ORIGINAL size)
			const isStrictlyEnlarging = newWidth > originalWidth && newHeight > originalHeight

			// If strictly enlarging, allow without checks
			if (isStrictlyEnlarging) {
				onSectionUpdate(resizingSection.id, { bounds: normalizedBounds })
				return
			}

			// For any other movement (shrinking or mixed), enforce constraints

			// Enforce minimum size
			if (newWidth < minWidth || newHeight < minHeight) {
				// Too small - block
				return
			}

			// ALWAYS check required bounds to prevent cutting off seats
			const requiredBounds = calculateRequiredBounds(currentSection)
			if (requiredBounds) {
				const requiredWidth = requiredBounds.width
				const requiredHeight = requiredBounds.height

				if (newWidth < requiredWidth || newHeight < requiredHeight) {
					// Would cut off seats - BLOCK this movement
					return
				}
			}

			// Only allow if all constraints are met
			onSectionUpdate(resizingSection.id, { bounds: normalizedBounds })
			return
		}

		// Handle polygon vertex dragging
		if (resizingSection && isDrawing && coords && onSectionUpdate && resizeHandle && resizeHandle.startsWith('polygon-point-')) {
			const currentSection = sections.find(s => s.id === resizingSection.id)
			if (!currentSection || !currentSection.polygon || currentSection.polygon.length < 3) return

			// Get the point index from the handle name
			const pointIndex = parseInt(resizeHandle.split('-')[2])
			if (isNaN(pointIndex) || pointIndex < 0 || pointIndex >= currentSection.polygon.length) return

			// Get original polygon from resizeStartBounds
			if (!resizeStartBounds || !resizeStartBounds.polygon) return

			const originalPolygon = resizeStartBounds.polygon

			// Calculate original bounding box
			const origXs = originalPolygon.map(p => p.x)
			const origYs = originalPolygon.map(p => p.y)
			const origMinX = Math.min(...origXs)
			const origMaxX = Math.max(...origXs)
			const origMinY = Math.min(...origYs)
			const origMaxY = Math.max(...origYs)
			const origWidth = origMaxX - origMinX
			const origHeight = origMaxY - origMinY

			// Create new polygon with the dragged point updated
			const newPolygon = currentSection.polygon.map((point, index) => {
				if (index === pointIndex) {
					// Update this point to the mouse position
					return { x: coords.x, y: coords.y }
				}
				return { ...point }
			})

			// Calculate new bounding box
			const newXs = newPolygon.map(p => p.x)
			const newYs = newPolygon.map(p => p.y)
			const newMinX = Math.min(...newXs)
			const newMaxX = Math.max(...newXs)
			const newMinY = Math.min(...newYs)
			const newMaxY = Math.max(...newYs)
			const newWidth = newMaxX - newMinX
			const newHeight = newMaxY - newMinY

			// Check if we're strictly enlarging (BOTH dimensions growing)
			const isStrictlyEnlarging = newWidth > origWidth && newHeight > origHeight

			// If strictly enlarging, allow without checks
			if (isStrictlyEnlarging) {
				onSectionUpdate(resizingSection.id, { polygon: newPolygon })
				return
			}

			// For any other movement (shrinking or mixed), always check constraints

			// Enforce minimum size
			const minSize = 50
			if (newWidth < minSize || newHeight < minSize) {
				// Too small - block
				return
			}

			// ALWAYS check required bounds to prevent cutting off seats
			const requiredBounds = calculateRequiredBounds(currentSection)
			if (requiredBounds) {
				const requiredWidth = requiredBounds.width
				const requiredHeight = requiredBounds.height

				if (newWidth < requiredWidth || newHeight < requiredHeight) {
					// Would cut off seats - BLOCK this movement
					return
				}
			}

			// Only allow if all constraints are met
			onSectionUpdate(resizingSection.id, { polygon: newPolygon })
			return
		}

		// Handle section dragging
		if (draggedSection && isDrawing && coords && onSectionUpdate) {
			if (draggedSection.shape === 'rectangle' && draggedSection.bounds) {
				// Calculate new center position
				const newCenterX = coords.x - dragOffset.x
				const newCenterY = coords.y - dragOffset.y

				// Calculate width and height
				const width = Math.abs(draggedSection.bounds.x2 - draggedSection.bounds.x1)
				const height = Math.abs(draggedSection.bounds.y2 - draggedSection.bounds.y1)

				// Update bounds
				const newBounds = {
					x1: newCenterX - width / 2,
					y1: newCenterY - height / 2,
					x2: newCenterX + width / 2,
					y2: newCenterY + height / 2
				}

				onSectionUpdate(draggedSection.id, { bounds: newBounds })
			} else if (draggedSection.shape === 'polygon' && draggedSection.polygon) {
				// Calculate translation delta
				const refPoint = draggedSection.polygon[0]
				const deltaX = (coords.x - dragOffset.x) - refPoint.x
				const deltaY = (coords.y - dragOffset.y) - refPoint.y

				// Translate all polygon points
				const newPolygon = draggedSection.polygon.map(point => ({
					...point,
					x: point.x + deltaX,
					y: point.y + deltaY
				}))

				onSectionUpdate(draggedSection.id, { polygon: newPolygon })
			}
			return
		}

		// Check for hover over polygon points
		if ((drawMode === 'polygon' || drawMode === 'obstruction-polygon') && polygonPoints.length > 0) {
			if (coords) {
				const hoveredIndex = findPointIndex(coords, polygonPoints)
				setHoveredPointIndex(hoveredIndex)
			}
		} else {
			setHoveredPointIndex(null)
		}

		if (!isDrawing) return

		if (!coords || !startPoint) return

		// Handle obstruction rectangle drawing
		if (drawMode === 'obstruction-rectangle') {
			setCurrentShape({
				type: 'obstruction-rectangle',
				start: startPoint,
				end: coords
			})
			return
		}

		// Handle section rectangle drawing
		if (drawMode === 'rectangle') {
			setCurrentShape({
				type: 'rectangle',
				start: startPoint,
				end: coords
			})
		}
	}

	// Helper function to find if a click is near an existing polygon point
	const findPointIndex = (coords, points, threshold = 10) => {
		// Threshold is in pixels (accounting for scale)
		// 10 pixels = reasonable click tolerance
		if (!points || points.length === 0) return -1
		const scaledThreshold = threshold / scale // Adjust for zoom level
		for (let i = 0; i < points.length; i++) {
			const point = points[i]
			const distance = Math.sqrt(
				Math.pow(coords.x - point.x, 2) + Math.pow(coords.y - point.y, 2)
			)
			if (distance <= scaledThreshold) {
				return i
			}
		}
		return -1
	}

	// Check if a point is inside a rectangle
	const isPointInRectangle = (point, bounds) => {
		if (!bounds || bounds.x1 === undefined || bounds.x2 === undefined ||
			bounds.y1 === undefined || bounds.y2 === undefined) return false
		const minX = Math.min(bounds.x1, bounds.x2)
		const maxX = Math.max(bounds.x1, bounds.x2)
		const minY = Math.min(bounds.y1, bounds.y2)
		const maxY = Math.max(bounds.y1, bounds.y2)
		return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
	}

	// Check if a point is inside a polygon (ray casting algorithm)
	const isPointInPolygon = (point, polygon) => {
		if (!polygon || polygon.length < 3) return false
		let inside = false
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const xi = polygon[i].x
			const yi = polygon[i].y
			const xj = polygon[j].x
			const yj = polygon[j].y
			const intersect = ((yi > point.y) !== (yj > point.y)) &&
				(point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
			if (intersect) inside = !inside
		}
		return inside
	}

	// Find which section (if any) is at the given coordinates
	const findSectionAtPoint = (coords) => {
		if (!sections || sections.length === 0) return null

		// Check sections in reverse order (topmost first)
		for (let i = sections.length - 1; i >= 0; i--) {
			const section = sections[i]
			if (section.shape === 'rectangle' && section.bounds) {
				if (isPointInRectangle(coords, section.bounds)) {
					return section
				}
			} else if (section.shape === 'polygon' && section.polygon && section.polygon.length >= 3) {
				if (isPointInPolygon(coords, section.polygon)) {
					return section
				}
			}
		}
		return null
	}

	// Calculate minimum required bounds for a section based on its seat configuration
	const calculateRequiredBounds = (section) => {
		if (!section) return null

		// Get spacing multiplier from section config (default 1.0, but may be smaller like 0.75)
		const spacingMultiplier = section.spacingConfig?.seatSpacingMultiplier || 1.0
		const rowSpacingMultiplier = section.spacingConfig?.rowSpacingMultiplier || 1.0

		// Use MINIMUM spacing values - the backend will adjust seats to fit within polygon
		// These are absolute minimum values to prevent degenerate polygons
		const baseSeatSpacing = 8 // Minimum seat spacing
		const baseRowSpacing = 12 // Minimum row spacing

		// If section has rowConfig with variable rows, calculate based on that
		if (section.rowConfig && section.rowConfig.length > 0) {
			// Find max seats in a row (including aisles)
			let maxTotalPositions = 0
			section.rowConfig.forEach(row => {
				const totalPositions = (row.seatCount || 0) + (row.aisleLeft || 0) + (row.aisleRight || 0)
				maxTotalPositions = Math.max(maxTotalPositions, totalPositions)
			})

			const numRows = section.rowConfig.length
			const seatSpacing = baseSeatSpacing * spacingMultiplier
			const rowSpacing = baseRowSpacing * rowSpacingMultiplier

			const requiredWidth = maxTotalPositions * seatSpacing + 20 // Add small margins
			const requiredHeight = numRows * rowSpacing + 20

			return { width: requiredWidth, height: requiredHeight }
		}

		// If section has uniform rows configuration
		if (section.rows && section.seatsPerRow) {
			const seatSpacing = baseSeatSpacing * spacingMultiplier
			const rowSpacing = baseRowSpacing * rowSpacingMultiplier

			const requiredWidth = section.seatsPerRow * seatSpacing + 20
			const requiredHeight = section.rows * rowSpacing + 20

			return { width: requiredWidth, height: requiredHeight }
		}

		// If section only has capacity but no row info, estimate
		if (section.capacity && section.capacity > 0) {
			// Rough estimate: assume square-ish layout
			const seatsPerSide = Math.ceil(Math.sqrt(section.capacity))
			const seatSpacing = baseSeatSpacing * spacingMultiplier

			const requiredWidth = seatsPerSide * seatSpacing + 20
			const requiredHeight = seatsPerSide * seatSpacing + 20

			return { width: requiredWidth, height: requiredHeight }
		}

		// No seat configuration - no minimum bounds
		return null
	}

	// Find which resize handle (if any) is at the given point for a section
	const findResizeHandle = (coords, section) => {
		if (!section) return null

		if (section.shape === 'rectangle' && section.bounds) {
			const { x1, y1, x2, y2 } = section.bounds
			const handleSize = 10 / scale // Scale handle size inversely with zoom
			const threshold = handleSize

			// Check corners first (priority)
			if (Math.abs(coords.x - x1) < threshold && Math.abs(coords.y - y1) < threshold) return 'nw'
			if (Math.abs(coords.x - x2) < threshold && Math.abs(coords.y - y1) < threshold) return 'ne'
			if (Math.abs(coords.x - x1) < threshold && Math.abs(coords.y - y2) < threshold) return 'sw'
			if (Math.abs(coords.x - x2) < threshold && Math.abs(coords.y - y2) < threshold) return 'se'

			// Check edges
			const centerX = (x1 + x2) / 2
			const centerY = (y1 + y2) / 2
			if (Math.abs(coords.x - centerX) < threshold && Math.abs(coords.y - y1) < threshold) return 'n'
			if (Math.abs(coords.x - centerX) < threshold && Math.abs(coords.y - y2) < threshold) return 's'
			if (Math.abs(coords.x - x1) < threshold && Math.abs(coords.y - centerY) < threshold) return 'w'
			if (Math.abs(coords.x - x2) < threshold && Math.abs(coords.y - centerY) < threshold) return 'e'
		} else if (section.shape === 'polygon' && section.polygon && section.polygon.length >= 3) {
			// For polygons, check each vertex
			const handleSize = 15 / scale // Larger threshold for easier clicking
			const threshold = handleSize

			// Check each polygon point
			for (let i = 0; i < section.polygon.length; i++) {
				const point = section.polygon[i]
				if (Math.abs(coords.x - point.x) < threshold && Math.abs(coords.y - point.y) < threshold) {
					return `polygon-point-${i}` // Return which point index
				}
			}
		}

		return null
	}

	// Draw resize handles for the selected section
	const drawResizeHandles = (ctx, section) => {
		if (!section || section.shape !== 'rectangle' || !section.bounds) return

		const { x1, y1, x2, y2 } = section.bounds
		const handleSize = 8 / scale // Scale inversely with zoom
		const centerX = (x1 + x2) / 2
		const centerY = (y1 + y2) / 2

		// Style for handles
		ctx.fillStyle = '#1976d2'
		ctx.strokeStyle = '#fff'
		ctx.lineWidth = 2 / scale

		const handles = [
			{ x: x1, y: y1, cursor: 'nw' }, // Top-left
			{ x: x2, y: y1, cursor: 'ne' }, // Top-right
			{ x: x1, y: y2, cursor: 'sw' }, // Bottom-left
			{ x: x2, y: y2, cursor: 'se' }, // Bottom-right
			{ x: centerX, y: y1, cursor: 'n' }, // Top-center
			{ x: centerX, y: y2, cursor: 's' }, // Bottom-center
			{ x: x1, y: centerY, cursor: 'w' }, // Left-center
			{ x: x2, y: centerY, cursor: 'e' }, // Right-center
		]

		handles.forEach(handle => {
			ctx.fillRect(handle.x - handleSize, handle.y - handleSize, handleSize * 2, handleSize * 2)
			ctx.strokeRect(handle.x - handleSize, handle.y - handleSize, handleSize * 2, handleSize * 2)
		})
	}

	// Draw resize handles for polygon sections (on each vertex)
	const drawPolygonResizeHandles = (ctx, section) => {
		if (!section || section.shape !== 'polygon' || !section.polygon || section.polygon.length < 3) return

		const handleSize = 8 / scale // Scale inversely with zoom

		// Style for handles
		ctx.fillStyle = '#1976d2'
		ctx.strokeStyle = '#fff'
		ctx.lineWidth = 2 / scale

		// Draw a handle at each polygon vertex
		section.polygon.forEach((point, index) => {
			ctx.fillRect(point.x - handleSize, point.y - handleSize, handleSize * 2, handleSize * 2)
			ctx.strokeRect(point.x - handleSize, point.y - handleSize, handleSize * 2, handleSize * 2)

			// Draw point number for reference (optional, can remove if cluttered)
			ctx.fillStyle = '#fff'
			ctx.font = `${12 / scale}px Arial`
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillText((index + 1).toString(), point.x, point.y)

			// Reset fill style for next handle
			ctx.fillStyle = '#1976d2'
		})
	}

	const handleMouseUp = (e) => {
		// Stop panning
		if (isPanning) {
			setIsPanning(false)
			setLastPanPoint(null)
			return
		}

		// Stop resizing section
		if (resizingSection) {
			setResizingSection(null)
			setResizeHandle(null)
			setResizeStartBounds(null)
			setIsDrawing(false)
			return
		}

		// Stop dragging section
		if (draggedSection) {
			setDraggedSection(null)
			setDragOffset({ x: 0, y: 0 })
			setIsDrawing(false)
			return
		}

		if (!isDrawing) return

		const coords = getCanvasCoordinates(e)
		if (!coords || !startPoint) return

		const bounds = {
			x1: Math.min(startPoint.x, coords.x),
			y1: Math.min(startPoint.y, coords.y),
			x2: Math.max(startPoint.x, coords.x),
			y2: Math.max(startPoint.y, coords.y)
		}

		// Handle obstruction rectangle drawing
		if (drawMode === 'obstruction-rectangle' && drawingObstruction) {
			if (bounds.x2 - bounds.x1 > 10 && bounds.y2 - bounds.y1 > 10 && onObstructionAdd) {
				onObstructionAdd({
					...drawingObstruction,
					shape: 'rectangle',
					bounds
				})
			}
			setIsDrawing(false)
			setStartPoint(null)
			setCurrentShape(null)
			setDrawMode(null)
			return
		}

		// Handle section rectangle drawing
		if (drawMode === 'rectangle') {
			// Only create section if it has valid dimensions
			if (bounds.x2 - bounds.x1 > 10 && bounds.y2 - bounds.y1 > 10) {
				if (onSectionAdd) {
					onSectionAdd({
						shape: 'rectangle',
						bounds,
						name: `Section ${(sections?.length || 0) + 1}`,
						type: 'seating',
						color: '#1976D2',
						strokeColor: '#0D47A1'
					})
				}
			}
		}

		setIsDrawing(false)
		setStartPoint(null)
		setCurrentShape(null)
		setDrawMode(null)
	}

	const handleDoubleClick = (e) => {
		// Handle obstruction polygon
		if (drawMode === 'obstruction-polygon' && drawingObstruction && polygonPoints.length >= 3) {
			if (onObstructionAdd) {
				onObstructionAdd({
					...drawingObstruction,
					shape: 'polygon',
					polygon: [...polygonPoints]
				})
			}
			setPolygonPoints([])
			setDrawMode(null)
			return
		}

		// Handle section polygon
		if (drawMode === 'polygon' && polygonPoints.length >= 3) {
			if (onSectionAdd) {
				onSectionAdd({
					shape: 'polygon',
					polygon: [...polygonPoints],
					name: `Section ${(sections?.length || 0) + 1}`,
					type: 'seating',
					color: '#1976D2',
					strokeColor: '#0D47A1'
				})
			}
			setPolygonPoints([])
			setDrawMode(null)
		}
	}

	const handleZoom = (delta) => {
		setScale(prev => Math.max(0.1, Math.min(5, prev + delta)))
	}

	// Add wheel event listener with passive: false to allow preventDefault
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const wheelHandler = (e) => {
			e.preventDefault()
			const delta = e.deltaY > 0 ? -0.1 : 0.1
			handleZoom(delta)
		}

		canvas.addEventListener('wheel', wheelHandler, { passive: false })
		return () => {
			canvas.removeEventListener('wheel', wheelHandler)
		}
	}, []) // Empty deps - handleZoom is stable

	const handleZoomIn = () => {
		handleZoom(0.1)
	}

	const handleZoomOut = () => {
		handleZoom(-0.1)
	}

	const handleZoomReset = () => {
		setScale(1)
		setPan({ x: 0, y: 0 })
	}

	const handleFitToScreen = () => {
		// Calculate bounds of all sections and central feature
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

		sections.forEach(section => {
			if (section.bounds) {
				minX = Math.min(minX, section.bounds.x1, section.bounds.x2)
				minY = Math.min(minY, section.bounds.y1, section.bounds.y2)
				maxX = Math.max(maxX, section.bounds.x1, section.bounds.x2)
				maxY = Math.max(maxY, section.bounds.y1, section.bounds.y2)
			}
			if (section.polygon) {
				section.polygon.forEach(p => {
					minX = Math.min(minX, p.x)
					minY = Math.min(minY, p.y)
					maxX = Math.max(maxX, p.x)
					maxY = Math.max(maxY, p.y)
				})
			}
		})

		if (centralFeature) {
			if (centralFeature.bounds) {
				minX = Math.min(minX, centralFeature.x || 0)
				minY = Math.min(minY, centralFeature.y || 0)
				maxX = Math.max(maxX, (centralFeature.x || 0) + (centralFeature.width || 0))
				maxY = Math.max(maxY, (centralFeature.y || 0) + (centralFeature.height || 0))
			}
		}

		if (minX === Infinity) {
			// No content, reset to default
			handleZoomReset()
			return
		}

		const canvas = canvasRef.current
		if (!canvas) return

		const contentWidth = maxX - minX
		const contentHeight = maxY - minY
		const padding = 50

		const scaleX = (canvas.width - padding * 2) / contentWidth
		const scaleY = (canvas.height - padding * 2) / contentHeight
		const newScale = Math.min(scaleX, scaleY, 2) // Cap at 2x zoom

		const centerX = (minX + maxX) / 2
		const centerY = (minY + maxY) / 2

		setScale(newScale)
		setPan({
			x: canvas.width / 2 - centerX * newScale,
			y: canvas.height / 2 - centerY * newScale
		})
	}

	const handleFullscreen = async () => {
		const container = containerRef.current
		if (!container) return

		try {
			if (!document.fullscreenElement) {
				await container.requestFullscreen()
			} else {
				await document.exitFullscreen()
			}
		} catch (err) {
			console.error('Fullscreen error:', err)
		}
	}

	const handleWheel = useCallback((e) => {
		e.preventDefault()
		const delta = e.deltaY > 0 ? -0.1 : 0.1
		handleZoom(delta)
	}, [])

	return (
		<Box>
			{/* Toolbar */}
			<Paper elevation={1} sx={{ p: 1, mb: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
				{mode === 'advanced' && (
					<>
						<Tooltip title="Draw Rectangle Section (Click and drag)">
							<span>
								<IconButton
									size="small"
									color={drawMode === 'rectangle' ? 'primary' : 'default'}
									onClick={() => {
										setDrawMode(drawMode === 'rectangle' ? null : 'rectangle')
										setPolygonPoints([])
										setIsDrawing(false)
									}}
								>
									<Add />
								</IconButton>
							</span>
						</Tooltip>
						<Tooltip title="Draw Polygon Section (Click to add points, double-click to finish)">
							<span>
								<IconButton
									size="small"
									color={drawMode === 'polygon' ? 'primary' : 'default'}
									onClick={() => {
										setDrawMode(drawMode === 'polygon' ? null : 'polygon')
										setPolygonPoints([])
									}}
								>
									<Edit />
								</IconButton>
							</span>
						</Tooltip>
						<Box sx={{ width: 1, borderLeft: '1px solid #ddd', mx: 1, height: 24 }} />
					</>
				)}
				<Tooltip title="Zoom In">
					<IconButton size="small" onClick={handleZoomIn}>
						<ZoomIn />
					</IconButton>
				</Tooltip>
				<Tooltip title="Zoom Out">
					<IconButton size="small" onClick={handleZoomOut}>
						<ZoomOut />
					</IconButton>
				</Tooltip>
				<Tooltip title="Reset Zoom">
					<IconButton size="small" onClick={handleZoomReset}>
						<FitScreen fontSize="small" />
					</IconButton>
				</Tooltip>
				<Tooltip title="Fit All Content to Screen">
					<Button
						size="small"
						variant="outlined"
						startIcon={<FitScreen />}
						onClick={handleFitToScreen}
						sx={{ ml: 1 }}
					>
						Fit to Screen
					</Button>
				</Tooltip>
				<Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
					<IconButton size="small" onClick={handleFullscreen}>
						{isFullscreen ? <FullscreenExit /> : <Fullscreen />}
					</IconButton>
				</Tooltip>
				<Typography variant="caption" sx={{ ml: 1 }}>
					Zoom: {Math.round(scale * 100)}%
				</Typography>
				<Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
					Scroll to zoom • Space + drag to pan • Middle mouse button to pan
				</Typography>
				{mode === 'advanced' && (drawMode === 'polygon' || drawMode === 'obstruction-polygon') && polygonPoints.length > 0 && (
					<Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
						<Typography variant="caption" color="primary" fontWeight="bold">
							Points: {polygonPoints.length} (Need at least 3)
						</Typography>
						<Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
							• Click to add point • Click existing point to delete • Backspace/Delete: remove last • Right-click: remove last • Double-click: finish
						</Typography>
					</Box>
				)}
			</Paper>

			{/* Canvas */}
			<Paper
				elevation={2}
				sx={{
					p: 2,
					position: 'relative',
					overflow: 'hidden',
					height: isFullscreen ? '100vh' : 'calc(100vh - 200px)',
					minHeight: isFullscreen ? '100vh' : '600px'
				}}
				ref={containerRef}
			>
				<canvas
					ref={canvasRef}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onDoubleClick={handleDoubleClick}
					onContextMenu={(e) => {
						e.preventDefault()
						// Right-click to remove last polygon point
						if ((drawMode === 'polygon' || drawMode === 'obstruction-polygon') && polygonPoints.length > 0) {
							const newPoints = polygonPoints.slice(0, -1)
							setPolygonPoints(newPoints)
						}
					}}
					style={{
						border: '1px solid #ddd',
						cursor: isPanning ? 'grabbing' :
							(isSpacePressed ? 'grab' :
							(draggedSection ? 'grabbing' :
							(drawMode ? (drawMode === 'rectangle' || drawMode === 'polygon' ? 'crosshair' : 'default') : 'default'))),
						width: '100%',
						height: '100%',
						display: 'block',
						backgroundColor: '#fafafa'
					}}
				/>
				{/* Coordinate display overlay */}
				{mouseCoords && (
					<Box
						sx={{
							position: 'absolute',
							bottom: 50, // Move up to avoid blocking grid labels
							right: 50, // Move left to avoid blocking grid labels
							bgcolor: 'rgba(0, 0, 0, 0.7)',
							color: 'white',
							p: 0.75,
							borderRadius: 1,
							fontSize: '11px',
							fontFamily: 'monospace',
							zIndex: 10,
							minWidth: 100,
							pointerEvents: 'none' // Don't block clicks
						}}
					>
						<Typography variant="caption" sx={{ display: 'block', color: 'white' }}>
							X: {mouseCoords.x.toFixed(1)}
						</Typography>
						<Typography variant="caption" sx={{ display: 'block', color: 'white' }}>
							Y: {mouseCoords.y.toFixed(1)}
						</Typography>
					</Box>
				)}
				{/* Instructions overlay when drawing polygon */}
				{(drawMode === 'polygon' || drawMode === 'obstruction-polygon') && (
					<Box
						sx={{
							position: 'absolute',
							top: 16,
							left: 16,
							bgcolor: 'rgba(255, 255, 255, 0.95)',
							p: 1.5,
							borderRadius: 1,
							boxShadow: 2,
							zIndex: 10,
							maxWidth: 350,
							pointerEvents: 'none' // Don't block clicks
						}}
					>
						<Typography variant="subtitle2" gutterBottom fontWeight="bold">
							Drawing Polygon Section
						</Typography>
						<Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.875rem' }}>
							<li><strong>Click</strong> on canvas to add a point</li>
							<li><strong>Click</strong> an existing point (red circle) to delete it</li>
							<li><strong>Backspace/Delete</strong> key to remove the last point</li>
							<li><strong>Right-click</strong> to remove the last point</li>
							<li><strong>Double-click</strong> to finish (need at least 3 points)</li>
							<li><strong>Escape</strong> key to cancel</li>
						</Box>
						{polygonPoints.length > 0 && (
							<Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block', fontWeight: 'bold' }}>
								Current: {polygonPoints.length} point{polygonPoints.length !== 1 ? 's' : ''}
								{polygonPoints.length < 3 && ' (need at least 3 to complete)'}
							</Typography>
						)}
					</Box>
				)}

				{/* Instructions overlay when drawing rectangle */}
				{drawMode === 'rectangle' && (
					<Box
						sx={{
							position: 'absolute',
							bottom: 10,
							left: '50%',
							transform: 'translateX(-50%)',
							px: 2,
							py: 1,
							bgcolor: 'rgba(0, 0, 0, 0.7)',
							color: 'white',
							borderRadius: 1,
							pointerEvents: 'none',
							zIndex: 10
						}}
					>
						<Typography variant="caption">
							Click and drag to draw a rectangle section
						</Typography>
					</Box>
				)}
				{/* Polygon instructions are shown in the detailed overlay at the top */}
				{drawMode === 'obstruction-rectangle' && (
					<Box
						sx={{
							position: 'absolute',
							bottom: 10,
							left: '50%',
							transform: 'translateX(-50%)',
							px: 2,
							py: 1,
							bgcolor: 'rgba(204, 204, 204, 0.9)',
							color: '#333',
							borderRadius: 1,
							pointerEvents: 'none',
							zIndex: 10
						}}
					>
						<Typography variant="caption">
							Drawing Obstruction: Click and drag to draw rectangle
						</Typography>
					</Box>
				)}
			</Paper>
		</Box>
	)
}

export default VenueCanvasEditor

