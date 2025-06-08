import type { Request, Response, NextFunction } from "express"
import Location from "../models/location.model"
import { asyncHandler } from "../middleware/async.middleware"
import { ErrorResponse } from "../utils/errorResponse"

// @desc    Create a new location
// @route   POST /api/locations
// @access  Private
export const createLocation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const location = await Location.create(req.body)

  res.status(201).json({
    success: true,
    data: location,
  })
})

// @desc    Get all locations
// @route   GET /api/locations
// @access  Public
export const getLocations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Copy req.query
  const reqQuery = { ...req.query }

  // Fields to exclude
  const removeFields = ["select", "sort", "page", "limit", "search"]

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param])

  // Create query string
  let queryStr = JSON.stringify(reqQuery)

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)

  // Finding resource
  let query = Location.find(JSON.parse(queryStr))

  // Handle search
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, "i")
    query = query.or([{ name: searchRegex }, { address: searchRegex }, { city: searchRegex }, { country: searchRegex }])
  }

  // Select Fields
  if (req.query.select) {
    const fields = (req.query.select as string).split(",").join(" ")
    query = query.select(fields)
  }

  // Sort
  if (req.query.sort) {
    const sortBy = (req.query.sort as string).split(",").join(" ")
    query = query.sort(sortBy)
  } else {
    query = query.sort("name")
  }

  // Pagination
  const page = Number.parseInt(req.query.page as string, 10) || 1
  const limit = Number.parseInt(req.query.limit as string, 10) || 10
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const total = await Location.countDocuments()

  query = query.skip(startIndex).limit(limit)

  // Executing query
  const locations = await query

  // Pagination result
  const pagination: any = {}

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }

  res.status(200).json({
    success: true,
    count: locations.length,
    pagination,
    data: locations,
  })
})

// @desc    Get single location
// @route   GET /api/locations/:id
// @access  Public
export const getLocation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const location = await Location.findById(req.params.id)

  if (!location) {
    return next(new ErrorResponse(`Location not found with id of ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: location,
  })
})

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Private
export const updateLocation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let location = await Location.findById(req.params.id)

  if (!location) {
    return next(new ErrorResponse(`Location not found with id of ${req.params.id}`, 404))
  }

  location = await Location.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: location,
  })
})

// @desc    Delete location
// @route   DELETE /api/locations/:id
// @access  Private (Admin only)
export const deleteLocation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const location = await Location.findById(req.params.id)

  if (!location) {
    return next(new ErrorResponse(`Location not found with id of ${req.params.id}`, 404))
  }

  await location.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Get locations near coordinates
// @route   GET /api/locations/near
// @access  Public
export const getNearbyLocations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { latitude, longitude, distance = 10 } = req.query

  // Check if coordinates are provided
  if (!latitude || !longitude) {
    return next(new ErrorResponse("Please provide latitude and longitude", 400))
  }

  // Convert distance to number
  const maxDistance = Number.parseFloat(distance as string)

  // Find locations near the coordinates
  const locations = await Location.find({
    "coordinates.latitude": {
      $gte: Number.parseFloat(latitude as string) - 0.1,
      $lte: Number.parseFloat(latitude as string) + 0.1,
    },
    "coordinates.longitude": {
      $gte: Number.parseFloat(longitude as string) - 0.1,
      $lte: Number.parseFloat(longitude as string) + 0.1,
    },
  }).sort("name")

  // Calculate actual distance for each location
  const locationsWithDistance = locations.map((location) => {
    const dist = calculateDistance(
      Number.parseFloat(latitude as string),
      Number.parseFloat(longitude as string),
      location.coordinates.latitude,
      location.coordinates.longitude,
    )

    return {
      ...location.toObject(),
      distance: dist,
    }
  })

  // Filter by max distance and sort by distance
  const filteredLocations = locationsWithDistance
    .filter((loc) => loc.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)

  res.status(200).json({
    success: true,
    count: filteredLocations.length,
    data: filteredLocations,
  })
})

// Helper function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
}

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180)
}
