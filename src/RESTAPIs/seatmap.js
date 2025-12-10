import apiHandler from './helper'

/**
 * Get all manifests
 */
export const getManifests = async (params = {}) => {
	const queryString = new URLSearchParams(params).toString()
	const endpoint = queryString ? `manifest?${queryString}` : 'manifest'
	return await apiHandler('GET', endpoint, true, false, null)
}

/**
 * Get manifest by ID
 */
export const getManifest = async (id) => {
	return await apiHandler('GET', `manifest/${id}`, true, false, null)
}

/**
 * Get manifests for a venue
 */
export const getManifestsByVenue = async (venueId) => {
	return await apiHandler('GET', `manifest/venue/${venueId}`, true, false, null)
}

/**
 * Create manifest
 */
export const createManifest = async (data) => {
	return await apiHandler('POST', 'manifest', true, false, data)
}

/**
 * Update manifest
 */
export const updateManifest = async (id, data) => {
	return await apiHandler('PUT', `manifest/${id}`, true, false, data)
}

/**
 * Delete manifest
 */
export const deleteManifest = async (id) => {
	return await apiHandler('DELETE', `manifest/${id}`, true, false, null)
}

/**
 * Add or update place in manifest
 */
export const addOrUpdatePlace = async (manifestId, placeData) => {
	return await apiHandler('POST', `manifest/${manifestId}/place`, true, false, placeData)
}

/**
 * Delete place from manifest
 */
export const deletePlace = async (manifestId, placeId) => {
	return await apiHandler('DELETE', `manifest/${manifestId}/place/${placeId}`, true, false, null)
}

/**
 * Generate manifest (similar to Ticketmaster structure)
 */
export const generateManifest = async (data) => {
	return await apiHandler('POST', 'manifest/generate', true, false, data)
}

/**
 * Venue API functions
 */
export const getVenues = async (params = {}) => {
	const queryString = new URLSearchParams(params).toString()
	const endpoint = queryString ? `venue?${queryString}` : 'venue'
	return await apiHandler('GET', endpoint, true, false, null)
}

export const getVenue = async (id) => {
	// Ensure id is a string - handle both string IDs and objects
	const venueId = typeof id === 'string'
		? id
		: (id?._id || id?.id || String(id))

	if (!venueId || typeof venueId !== 'string') {
		throw new Error('Invalid venue ID: must be a string')
	}

	return await apiHandler('GET', `venue/${venueId}`, true, false, null)
}

export const getVenueById = async (id) => {
	// Ensure id is a string - handle both string IDs and objects
	const venueId = typeof id === 'string'
		? id
		: (id?._id || id?.id || String(id))

	if (!venueId || typeof venueId !== 'string') {
		throw new Error('Invalid venue ID: must be a string')
	}

	return await apiHandler('GET', `venue/${venueId}`, true, false, null)
}

export const createVenue = async (data) => {
	return await apiHandler('POST', 'venue', true, false, data)
}

export const updateVenue = async (id, data) => {
	return await apiHandler('PUT', `venue/${id}`, true, false, data)
}

export const deleteVenue = async (id) => {
	return await apiHandler('DELETE', `venue/${id}`, true, false, null)
}

/**
 * Update venue sections configuration
 */
export const updateVenueSections = async (venueId, data) => {
	// Ensure data is a valid object
	if (!data || typeof data !== 'object') {
		throw new Error('Invalid data: must be an object')
	}
	// Ensure sections is an array if provided
	if (data.sections && !Array.isArray(data.sections)) {
		throw new Error('Invalid data: sections must be an array')
	}
	return await apiHandler('PUT', `venue/${venueId}/sections`, true, false, data)
}

/**
 * Sync manifest to event-merchant-service via S3 and RabbitMQ
 */
export const syncManifestToEventMerchant = async (manifestId) => {
	return await apiHandler('POST', `manifest/${manifestId}/sync`, true, false, null)
}

