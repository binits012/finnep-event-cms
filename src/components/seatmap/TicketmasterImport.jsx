'use client'

import React, { useState } from 'react'
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
	Grid,
	CircularProgress,
	Alert,
	Chip
} from '@mui/material'
import { generateManifest } from '@/RESTAPIs/seatmap'

/**
 * ManifestGenerator Component
 * Interface for generating manifests (similar to Ticketmaster structure)
 */
const TicketmasterImport = ({ venueId, onImportSuccess, venue = null }) => {
	const [eventId, setEventId] = useState('')
	const [layoutAlgorithm, setLayoutAlgorithm] = useState('grid')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [success, setSuccess] = useState(false)
	const [totalPlaces, setTotalPlaces] = useState(100)
	const [placePrefix, setPlacePrefix] = useState('')
	const [placePattern, setPlacePattern] = useState('sequential')
	const [sectionNamingPattern, setSectionNamingPattern] = useState('numeric')
	const [customSectionNames, setCustomSectionNames] = useState('')

	// Check if venue has manually configured sections
	const hasManualSections = venue?.sections && venue.sections.length > 0
	// Calculate total capacity: use explicit capacity, or calculate from rowConfig, or fallback to rows*seatsPerRow
	const totalCapacity = hasManualSections
		? venue.sections.reduce((sum, section) => {
			// Use explicit capacity if set
			if (section.capacity) {
				return sum + section.capacity
			}
			// If rowConfig exists, sum up seatCount from all rows
			if (section.rowConfig && Array.isArray(section.rowConfig) && section.rowConfig.length > 0) {
				const rowConfigCapacity = section.rowConfig.reduce((rowSum, row) => {
					return rowSum + (row.seatCount || 0)
				}, 0)
				return sum + rowConfigCapacity
			}
			// Fallback to rows * seatsPerRow
			return sum + ((section.rows || 0) * (section.seatsPerRow || 0))
		}, 0)
		: 0

	// Layout configuration based on algorithm
	const [layoutConfig, setLayoutConfig] = useState({
		// Grid layout config
		sections: 1,
		seatsPerRow: 20,
		sectionWidth: 100,
		seatSpacing: 2,
		rowSpacing: 3,
		// Curved layout config
		centerX: 500,
		centerY: 500,
		baseRadius: 100,
		totalRows: 20
	})

	const handleGenerate = async () => {
		if (!venueId) {
			setError('Venue ID is required')
			return
		}

		setLoading(true)
		setError(null)
		setSuccess(false)

		try {
			// Build payload - exclude redundant fields when manual sections exist
			const payload = {
				...(eventId && { eventId }), // Only include eventId if provided
				venueId,
				totalPlaces: hasManualSections ? totalCapacity : totalPlaces
			}

			// Only include layout-related fields if NOT using manual sections
			if (!hasManualSections) {
				// Parse custom section names if provided
				let parsedCustomNames = []
				if (sectionNamingPattern === 'custom' && customSectionNames) {
					parsedCustomNames = customSectionNames.split(',').map(name => name.trim()).filter(Boolean)
				}

				payload.layoutAlgorithm = layoutAlgorithm
				payload.layoutConfig = layoutConfig
				payload.placeGeneration = {
					prefix: placePrefix,
					pattern: placePattern,
					patternConfig: layoutConfig
				}
				payload.sectionNaming = {
					pattern: sectionNamingPattern,
					...(parsedCustomNames.length > 0 && { customNames: parsedCustomNames })
				}
			} else {
				// For manual sections, only include minimal place generation info
				payload.placeGeneration = {
					prefix: placePrefix,
					pattern: placePattern
					// No patternConfig needed - sections define the layout
				}
			}

			const response = await generateManifest(payload)

			if (response.data) {
				setSuccess(true)
				if (onImportSuccess) {
					onImportSuccess(response.data)
				}
				setEventId('') // Reset form
			}
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Failed to generate manifest')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Paper elevation={2} sx={{ p: 3 }}>
			<Typography variant="h6" gutterBottom>
				Generate Manifest
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			{success && (
				<Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
					Manifest generated successfully!
				</Alert>
			)}

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{hasManualSections && (
					<Alert severity="info" sx={{ mb: 2 }}>
						<strong>Using Manually Configured Sections</strong>
						<Typography variant="body2" sx={{ mt: 0.5 }}>
							This venue has {venue.sections.length} section{venue.sections.length !== 1 ? 's' : ''} configured with a total capacity of {totalCapacity} seats.
							Seats will be generated within these sections based on their individual configurations (capacity, rows, seats per row).
						</Typography>
					</Alert>
				)}

				{!hasManualSections && (
					<Alert severity="warning" sx={{ mb: 2 }}>
						<strong>No Sections Configured</strong>
						<Typography variant="body2" sx={{ mt: 0.5 }}>
							This venue doesn't have manually configured sections. The system will auto-generate sections using the layout algorithm below.
							For better control, consider configuring sections manually first.
						</Typography>
					</Alert>
				)}

				<TextField
					label="Event ID (Optional)"
					value={eventId}
					onChange={(e) => setEventId(e.target.value)}
					placeholder="e.g., FI-1024126397 or custom identifier"
					fullWidth
					disabled={loading}
					helperText="Optional: For developer reference. Leave empty to create venue seat plan only. Event association can be added later."
				/>

				<TextField
					label="Total Places/Seats"
					type="number"
					value={hasManualSections ? totalCapacity : totalPlaces}
					onChange={(e) => setTotalPlaces(parseInt(e.target.value) || 100)}
					fullWidth
					disabled={loading || hasManualSections}
					inputProps={{ min: 1, max: 100000 }}
					helperText={hasManualSections
						? `Calculated from configured sections (${totalCapacity} seats). Adjust section capacities to change this.`
						: 'Total number of seats to generate'}
				/>

				<FormControl fullWidth>
					<InputLabel>Place ID Pattern</InputLabel>
					<Select
						value={placePattern}
						label="Place ID Pattern"
						onChange={(e) => setPlacePattern(e.target.value)}
						disabled={loading}
					>
						<MenuItem value="sequential">Sequential</MenuItem>
						<MenuItem value="grid">Grid (Section-Row-Seat)</MenuItem>
					</Select>
					{placePattern === 'sequential' && (
						<Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5, display: 'block' }}>
							Simple linear numbering: PREFIX001, PREFIX002, PREFIX003... Best for general admission or simple layouts where structure doesn't matter.
						</Box>
					)}
					{placePattern === 'grid' && (
						<Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5, display: 'block' }}>
							Hierarchical encoding: Encodes section, row, and seat info into the ID. Best for stadiums/theaters with clear section-row-seat structure. Allows extracting location from ID.
						</Box>
					)}
				</FormControl>

				<TextField
					label="Place ID Prefix (Optional)"
					value={placePrefix}
					onChange={(e) => setPlacePrefix(e.target.value)}
					placeholder="e.g., J4WUCTZ2GE"
					fullWidth
					disabled={loading}
				/>

				<FormControl fullWidth>
					<InputLabel>Layout Algorithm</InputLabel>
					<Select
						value={layoutAlgorithm}
						label="Layout Algorithm"
						onChange={(e) => setLayoutAlgorithm(e.target.value)}
						disabled={loading || hasManualSections}
					>
						<MenuItem value="grid">Grid (Stadium/Arena)</MenuItem>
						<MenuItem value="curved">Curved (Theater)</MenuItem>
						<MenuItem value="general">General Admission</MenuItem>
					</Select>
					{hasManualSections && (
						<Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5, display: 'block' }}>
							Disabled: Using manually configured sections instead of auto-generation.
						</Box>
					)}
					{!hasManualSections && (
						<Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5, display: 'block' }}>
							Select how seats should be arranged. This is only used when sections are not manually configured.
						</Box>
					)}
					{layoutAlgorithm === 'grid' && (
						<Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
							<Typography variant="caption" display="block" fontWeight="bold" gutterBottom>
								Grid Layout Preview:
							</Typography>
							<Box sx={{ fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'pre' }}>
{`┌─────┬─────┬─────┐
│ S1  │ S2  │ S3  │
│ ░░░ │ ░░░ │ ░░░ │
│ ░░░ │ ░░░ │ ░░░ │
└─────┴─────┴─────┘
Rectangular grid pattern.
Sections side-by-side.
Best for: Stadiums, arenas`}
							</Box>
						</Box>
					)}
					{layoutAlgorithm === 'curved' && (
						<Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
							<Typography variant="caption" display="block" fontWeight="bold" gutterBottom>
								Curved Layout Preview:
							</Typography>
							<Box sx={{ fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'pre' }}>
{`      ╱╲
    ╱    ╲
  ╱        ╲
╱            ╲
  Curved rows
  fanning out
Best for: Theaters`}
							</Box>
						</Box>
					)}
					{layoutAlgorithm === 'general' && (
						<Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
							<Typography variant="caption" display="block" fontWeight="bold" gutterBottom>
								General Admission Preview:
							</Typography>
							<Box sx={{ fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'pre' }}>
{`┌─────────────┐
│   Zone A    │
│  (500 cap)  │
├─────────────┤
│   Zone B    │
│  (500 cap)  │
└─────────────┘
Zone-based, no assigned seats
Best for: Standing room, festivals`}
							</Box>
						</Box>
					)}
				</FormControl>

				{/* Layout-specific configuration - Only show if NO manual sections */}
				{!hasManualSections && layoutAlgorithm === 'grid' && (
					<>
						<Grid container spacing={2}>
							<Grid item xs={6}>
								<TextField
									label="Number of Sections"
									type="number"
									value={layoutConfig.sections}
									onChange={(e) => setLayoutConfig({ ...layoutConfig, sections: parseInt(e.target.value) || 1 })}
									fullWidth
									inputProps={{ min: 1 }}
									helperText="How many sections?"
								/>
							</Grid>
							<Grid item xs={6}>
								<TextField
									label="Seats per Row"
									type="number"
									value={layoutConfig.seatsPerRow}
									onChange={(e) => setLayoutConfig({ ...layoutConfig, seatsPerRow: parseInt(e.target.value) || 20 })}
									fullWidth
									inputProps={{ min: 1 }}
									helperText="Seats in each row"
								/>
							</Grid>
						</Grid>

						{/* Live Calculation Preview */}
						<Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
							<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
								Layout Calculation Preview:
							</Typography>
							{(() => {
								const sections = layoutConfig.sections || 1
								const seatsPerRow = layoutConfig.seatsPerRow || 20
								const totalSeats = totalPlaces || 100
								const seatsPerSection = Math.floor(totalSeats / sections)
								const rowsPerSection = Math.ceil(seatsPerSection / seatsPerRow)
								const actualSeatsPerSection = rowsPerSection * seatsPerRow
								const totalRows = rowsPerSection * sections
								const totalCapacity = sections * actualSeatsPerSection

								return (
									<Box>
										<Typography variant="body2" component="div">
											<strong>Total Seats:</strong> {totalSeats} seats
										</Typography>
										<Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
											<strong>Layout:</strong> {sections} section{sections !== 1 ? 's' : ''} × {rowsPerSection} row{rowsPerSection !== 1 ? 's' : ''} × {seatsPerRow} seats/row
										</Typography>
										<Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
											<strong>Result:</strong> {totalRows} total rows across {sections} section{sections !== 1 ? 's' : ''}
										</Typography>
										{totalCapacity !== totalSeats && (
											<Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
												⚠️ Note: With these settings, you'll get {totalCapacity} seats (closest fit to {totalSeats})
											</Typography>
										)}
										<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
											Formula: Rows per Section = ⌈(Total Seats ÷ Sections) ÷ Seats per Row⌉
										</Typography>
									</Box>
								)
							})()}
						</Box>

						{/* Section Naming Configuration */}
						<Box sx={{ mt: 2 }}>
							<Typography variant="subtitle2" gutterBottom>
								Section Naming
							</Typography>
							<FormControl fullWidth sx={{ mb: 1 }}>
								<InputLabel>Naming Pattern</InputLabel>
								<Select
									value={sectionNamingPattern}
									label="Naming Pattern"
									onChange={(e) => setSectionNamingPattern(e.target.value)}
									disabled={loading}
								>
									<MenuItem value="numeric">Numeric (Section 1, Section 2...)</MenuItem>
									<MenuItem value="alphabetic">Alphabetic (A, B, C...)</MenuItem>
									<MenuItem value="alphanumeric">Alphanumeric (A1, A2, B1...)</MenuItem>
									<MenuItem value="custom">Custom Names</MenuItem>
								</Select>
							</FormControl>

							{sectionNamingPattern === 'custom' && (
								<TextField
									fullWidth
									label="Custom Section Names"
									value={customSectionNames}
									onChange={(e) => setCustomSectionNames(e.target.value)}
									placeholder="e.g., Orchestra, Mezzanine, Balcony, VIP"
									helperText="Enter comma-separated names. Example: Orchestra, Mezzanine, Balcony"
									disabled={loading}
								/>
							)}

							{sectionNamingPattern === 'numeric' && (
								<Box sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
									Example: Section 1, Section 2, Section 3
								</Box>
							)}
							{sectionNamingPattern === 'alphabetic' && (
								<Box sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
									Example: A, B, C, D (supports AA, AB for 27+ sections)
								</Box>
							)}
							{sectionNamingPattern === 'alphanumeric' && (
								<Box sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
									Example: A1, A2, B1, B2 (10 sections per letter)
								</Box>
							)}
						</Box>
					</>
				)}

				{hasManualSections && (
					<Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1, border: '1px solid', borderColor: 'success.main' }}>
						<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
							Section Configuration Summary:
						</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
							{venue.sections.map((section, index) => {
								// Determine row information display
								let rowInfo = ''
								if (section.rowConfig && Array.isArray(section.rowConfig) && section.rowConfig.length > 0) {
									// Variable row configuration
									const totalRows = section.rowConfig.length
									const minSeats = Math.min(...section.rowConfig.map(r => r.seatCount || 0))
									const maxSeats = Math.max(...section.rowConfig.map(r => r.seatCount || 0))
									if (minSeats === maxSeats) {
										rowInfo = ` (${totalRows} rows × ${minSeats} seats/row)`
									} else {
										rowInfo = ` (${totalRows} rows, ${minSeats}-${maxSeats} seats/row)`
									}
								} else if (section.rows && section.seatsPerRow) {
									// Uniform configuration
									rowInfo = ` (${section.rows} rows × ${section.seatsPerRow} seats/row)`
								}

								return (
									<Box key={section.id || index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
										<Typography variant="body2">
											<strong>{section.name}</strong> - {section.capacity || 0} seats{rowInfo}
										</Typography>
										<Chip
											label={section.shape || 'rectangle'}
											size="small"
											variant="outlined"
											sx={{ ml: 1 }}
										/>
									</Box>
								)
							})}
						</Box>
						<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
							Seats will be generated within these sections based on their individual configurations.
						</Typography>
					</Box>
				)}

				{!hasManualSections && layoutAlgorithm === 'curved' && (
					<Grid container spacing={2}>
						<Grid item xs={6}>
							<TextField
								label="Base Radius"
								type="number"
								value={layoutConfig.baseRadius}
								onChange={(e) => setLayoutConfig({ ...layoutConfig, baseRadius: parseInt(e.target.value) || 100 })}
								fullWidth
							/>
						</Grid>
						<Grid item xs={6}>
							<TextField
								label="Total Rows"
								type="number"
								value={layoutConfig.totalRows}
								onChange={(e) => setLayoutConfig({ ...layoutConfig, totalRows: parseInt(e.target.value) || 20 })}
								fullWidth
							/>
						</Grid>
					</Grid>
				)}

				<Button
					variant="contained"
					onClick={handleGenerate}
					disabled={loading || !venueId}
					fullWidth
					sx={{ mt: 2 }}
				>
					{loading ? <CircularProgress size={24} /> : 'Generate Manifest'}
				</Button>
			</Box>
		</Paper>
	)
}

export default TicketmasterImport

