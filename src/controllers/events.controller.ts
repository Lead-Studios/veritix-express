import type { Request, Response, NextFunction } from "express"
import Event, { type IEvent } from "../models/event.model"
import { asyncHandler } from "../middleware/async.middleware"
import { ErrorResponse } from "../utils/errorResponse"
import type { FilterQuery } from "mongoose"
import { uploadImage } from "../utils/imageUpload"

// @desc    Create a new event
// @route   POST /api/events
// @access  Private
export const createEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Add user to req.body
  req.body.organizer = req.user.id

  // Handle banner image upload if provided
  if (req.files && req.files.bannerImage) {
    const file = req.files.bannerImage
    const uploadResult = await uploadImage(file)
    req.body.bannerImage = uploadResult.secure_url
  }

  const event = await Event.create(req.body)

  res.status(201).json({
    success: true,
    data: event,
  })
})

// @desc    Get all events with filtering, sorting, and pagination
// @route   GET /api/events
// @access  Public
export const getEvents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
  const query: FilterQuery<IEvent> = JSON.parse(queryStr)

  // Handle search
  if (req.query.search) {
    query.$text = { $search: req.query.search as string }
  }

  // Handle date filtering
  if (req.query.startDate) {
    query.startDate = { $gte: new Date(req.query.startDate as string) }
  }

  if (req.query.endDate) {
    query.endDate = { $lte: new Date(req.query.endDate as string) }
  }

  // Handle free events
  if (req.query.isFree === "true") {
    query.isFree = true
  }

  // Handle virtual events
  if (req.query.isVirtual === "true") {
    query.isVirtual = true
  }

  // Handle featured events
  if (req.query.isFeatured === "true") {
    query.isFeatured = true
  }

  // Handle status
  if (req.query.status) {
    query.status = req.query.status
  } else {
    // By default, only show published events
    query.status = "published"
  }

  // Select Fields
  let findQuery = Event.find(query)

  if (req.query.select) {
    const fields = (req.query.select as string).split(",").join(" ")
    findQuery = findQuery.select(fields)
  }

  // Sort
  if (req.query.sort) {
    const sortBy = (req.query.sort as string).split(",").join(" ")
    findQuery = findQuery.sort(sortBy)
  } else {
    findQuery = findQuery.sort("-createdAt")
  }

  // Pagination
  const page = Number.parseInt(req.query.page as string, 10) || 1
  const limit = Number.parseInt(req.query.limit as string, 10) || 10
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const total = await Event.countDocuments(query)

  findQuery = findQuery.skip(startIndex).limit(limit)

  // Populate references
  findQuery = findQuery.populate([
    { path: "organizer", select: "name email profileImage" },
    { path: "category", select: "name color icon" },
    { path: "location", select: "name address city country" },
  ])

  // Executing query
  const events = await findQuery

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
    count: events.length,
    pagination,
    data: events,
  })
})

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
export const getEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const event = await Event.findById(req.params.id)
    .populate([
      { path: "organizer", select: "name email profileImage" },
      { path: "category", select: "name color icon" },
      { path: "location", select: "name address city country coordinates" },
      {
        path: "comments",
        match: { isPublic: true, parentComment: null },
        populate: {
          path: "user",
          select: "name profileImage",
        },
      },
    ])
    .populate("attendeesCount")

  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: event,
  })
})

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
export const updateEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let event = await Event.findById(req.params.id)

  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is event organizer or admin
  if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this event`, 401))
  }

  // Handle banner image upload if provided
  if (req.files && req.files.bannerImage) {
    const file = req.files.bannerImage
    const uploadResult = await uploadImage(file)
    req.body.bannerImage = uploadResult.secure_url
  }

  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: event,
  })
})

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
export const deleteEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const event = await Event.findById(req.params.id)

  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is event organizer or admin
  if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this event`, 401))
  }

  await event.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Get events by organizer
// @route   GET /api/events/organizer/:userId
// @access  Public
export const getEventsByOrganizer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const events = await Event.find({ organizer: req.params.userId })
    .populate([
      { path: "category", select: "name color" },
      { path: "location", select: "name city" },
    ])
    .sort("-startDate")

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  })
})

// @desc    Get featured events
// @route   GET /api/events/featured
// @access  Public
export const getFeaturedEvents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const events = await Event.find({
    isFeatured: true,
    status: "published",
    startDate: { $gte: new Date() },
  })
    .populate([
      { path: "organizer", select: "name" },
      { path: "category", select: "name color" },
      { path: "location", select: "name city" },
    ])
    .sort("startDate")
    .limit(6)

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  })
})

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Public
export const getUpcomingEvents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const events = await Event.find({
    status: "published",
    startDate: { $gte: new Date() },
  })
    .populate([
      { path: "organizer", select: "name" },
      { path: "category", select: "name color" },
      { path: "location", select: "name city" },
    ])
    .sort("startDate")
    .limit(10)

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  })
})

// @desc    Change event status
// @route   PUT /api/events/:id/status
// @access  Private
export const changeEventStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body

  if (!["draft", "published", "cancelled"].includes(status)) {
    return next(new ErrorResponse("Invalid status value", 400))
  }

  const event = await Event.findById(req.params.id)

  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is event organizer or admin
  if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this event`, 401))
  }

  event.status = status
  await event.save()

  res.status(200).json({
    success: true,
    data: event,
  })
})

// @desc    Get events by category
// @route   GET /api/events/category/:categoryId
// @access  Public
export const getEventsByCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const events = await Event.find({
    category: req.params.categoryId,
    status: "published",
  })
    .populate([
      { path: "organizer", select: "name" },
      { path: "location", select: "name city" },
    ])
    .sort("startDate")

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  })
})
