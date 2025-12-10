'use client'

import React from 'react'
import {
	Box,
	Paper,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Slider,
	FormControlLabel,
	Checkbox,
	Button,
	Typography
} from '@mui/material'

/**
 * SeatMapControls Component
 * Provides filtering and zoom controls for seat map
 */
const SeatMapControls = ({
	sections = [],
	selectedSection,
	onSectionChange,
	priceRange = [0, 1000],
	onPriceRangeChange,
	showAvailableOnly = false,
	onAvailableOnlyChange,
	zoom = 1,
	onZoomChange,
	onResetView
}) => {
	return (
		<Paper elevation={2} sx={{ p: 2 }}>
			<Typography variant="h6" gutterBottom>
				Controls
			</Typography>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
				{/* Section Filter */}
				{sections.length > 0 && (
					<FormControl fullWidth>
						<InputLabel>Filter by Section</InputLabel>
						<Select
							value={selectedSection || ''}
							label="Filter by Section"
							onChange={(e) => onSectionChange?.(e.target.value)}
						>
							<MenuItem value="">All Sections</MenuItem>
							{sections.map((section) => (
								<MenuItem key={section} value={section}>
									{section}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				)}

				{/* Price Range Filter */}
				<Box>
					<Typography gutterBottom>
						Price Range: €{(priceRange[0] / 100).toFixed(2)} - €{(priceRange[1] / 100).toFixed(2)}
					</Typography>
					<Slider
						value={priceRange}
						onChange={(e, newValue) => onPriceRangeChange?.(newValue)}
						valueLabelDisplay="auto"
						min={0}
						max={10000}
						step={100}
						valueLabelFormat={(value) => `€${(value / 100).toFixed(2)}`}
					/>
				</Box>

				{/* Availability Toggle */}
				<FormControlLabel
					control={
						<Checkbox
							checked={showAvailableOnly}
							onChange={(e) => onAvailableOnlyChange?.(e.target.checked)}
						/>
					}
					label="Show Available Only"
				/>

				{/* Zoom Controls */}
				<Box>
					<Typography gutterBottom>Zoom: {Math.round(zoom * 100)}%</Typography>
					<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
						<Button
							variant="outlined"
							size="small"
							onClick={() => onZoomChange?.(Math.max(0.5, zoom - 0.1))}
						>
							-
						</Button>
						<Button
							variant="outlined"
							size="small"
							onClick={() => onZoomChange?.(Math.min(2, zoom + 0.1))}
						>
							+
						</Button>
						<Button
							variant="outlined"
							size="small"
							onClick={() => onZoomChange?.(1)}
						>
							Reset
						</Button>
					</Box>
				</Box>

				{/* Reset View */}
				<Button
					variant="contained"
					fullWidth
					onClick={onResetView}
				>
					Reset View
				</Button>
			</Box>
		</Paper>
	)
}

export default SeatMapControls

