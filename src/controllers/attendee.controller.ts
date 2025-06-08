import type { Request, Response, NextFunction } from "express"
import Attendee from "../models/attendee.model"
import Event from "../models/event.model"
import { asyncHandler } from "../middleware/async.middleware"
import { ErrorResponse } from "../utils/errorResponse"
import { generateQRCode } from "../utils/qrCode"
import { sendEmail } from "../utils/email"

// @desc    Register for an event
// @route   POST /api/events/:eventId/register
// @access  Private
export const registerForEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const eventId = req.params.eventId
  const userId = req.user.id

  // Check if event exists
  const event = await Event.findById(eventId)
  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${eventId}`, 404))
  }

  // Check if event is published
  if (event.status !== "published") {
    return next(new ErrorResponse(`Cannot register for an event that is not published`, 400))
  }

  // Check if event date has passed
  if (new Date(event.startDate) < new Date()) {
    return next(new ErrorResponse(`Cannot register for an event that has already started`, 400))
  }

  // Check if user is already registered
  const existingRegistration = await Attendee.findOne({ user: userId, event: eventId })
  if (existingRegistration) {
    return next(new ErrorResponse(`User is already registered for this event`, 400))
  }

  // Check if event has reached capacity
  if (event.capacity > 0) {
    const attendeesCount = await Attendee.countDocuments({ event: eventId, status: { $ne: "cancelled" } })
    if (attendeesCount >= event.capacity) {
      return next(new ErrorResponse(`Event has reached maximum capacity`, 400))
    }
  }

  // Create attendee record
  const attendee = await Attendee.create({
    user: userId,
    event: eventId,
    status: "registered",
  })

  // Generate QR code for ticket
  const qrCodeData = await generateQRCode(attendee.ticketNumber)

  // Send confirmation email with ticket details
  await sendEmail({
    email: req.user.email,
    subject: `Registration Confirmation: ${event.title}`,
    message: `
      <h1>Registration Confirmed!</h1>
      <p>Thank you for registering for ${event.title}.</p>
      <p>Your ticket number is: <strong>${attendee.ticketNumber}</strong></p>
      <p>Event Date: ${new Date(event.startDate).toLocaleDateString()}</p>
      <p>Event Time: ${new Date(event.startDate).toLocaleTimeString()}</p>
      <div>
        <img src="${qrCodeData}" alt="QR Code" style="width: 200px; height: 200px;" />
      </div>
      <p>Please present this QR code at the event for check-in.</p>
    `,
  })

  res.status(201).json({
    success: true,
    data: attendee,
  })
})

// @desc    Cancel registration
// @route   PUT /api/events/:eventId/cancel-registration
// @access  Private
export const cancelRegistration = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const eventId = req.params.eventId
  const userId = req.user.id

  // Find the registration
  const registration = await Attendee.findOne({ user: userId, event: eventId })

  if (!registration) {
    return next(new ErrorResponse(`Registration not found`, 404))
  }

  // Check if event has already started
  const event = await Event.findById(eventId)
  if (new Date(event.startDate) < new Date()) {
    return next(new ErrorResponse(`Cannot cancel registration for an event that has already started`, 400))
  }

  // Update status to cancelled
  registration.status = "cancelled"
  await registration.save()

  res.status(200).json({
    success: true,
    data: registration,
  })
})

// @desc    Check in attendee
// @route   PUT /api/attendees/:id/check-in
// @access  Private (Admin or Organizer only)
export const checkInAttendee = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const attendee = await Attendee.findById(req.params.id).populate({
    path: "event",
    select: "organizer",
  })

  if (!attendee) {
    return next(new ErrorResponse(`Attendee not found with id of ${req.params.id}`, 404))
  }

  // Check if user is admin or event organizer
  const event = attendee.event as any
  if (req.user.role !== "admin" && event.organizer.toString() !== req.user.id) {
    return next(new ErrorResponse(`User is not authorized to check in attendees for this event`, 401))
  }

  // Update attendee status and check-in time
  attendee.status = "attended"
  attendee.checkInTime = new Date()
  await attendee.save()

  res.status(200).json({
    success: true,
    data: attendee,
  })
})

// @desc    Get attendees for an event
// @route   GET /api/events/:eventId/attendees
// @access  Private (Admin or Organizer only)
export const getEventAttendees = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const eventId = req.params.eventId

  // Check if event exists
  const event = await Event.findById(eventId)
  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${eventId}`, 404))
  }

  // Check if user is admin or event organizer
  if (req.user.role !== "admin" && event.organizer.toString() !== req.user.id) {
    return next(new ErrorResponse(`User is not authorized to view attendees for this event`, 401))
  }

  // Get attendees
  const attendees = await Attendee.find({ event: eventId })
    .populate({
      path: "user",
      select: "name email profileImage",
    })
    .sort("-createdAt")

  res.status(200).json({
    success: true,
    count: attendees.length,
    data: attendees,
  })
})

// @desc    Get user's registered events
// @route   GET /api/attendees/my-events
// @access  Private
export const getUserEvents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id

  const attendees = await Attendee.find({ user: userId })
    .populate({
      path: "event",
      populate: [
        { path: "category", select: "name color" },
        { path: "location", select: "name city" },
      ],
    })
    .sort("-createdAt")

  res.status(200).json({
    success: true,
    count: attendees.length,
    data: attendees,
  })
})

// @desc    Verify ticket
// @route   GET /api/attendees/verify/:ticketNumber
// @access  Private (Admin or Organizer only)
export const verifyTicket = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { ticketNumber } = req.params

  const attendee = await Attendee.findOne({ ticketNumber })
    .populate({
      path: "event",
      select: "title startDate endDate organizer",
    })
    .populate({
      path: "user",
      select: "name email",
    })

  if (!attendee) {
    return next(new ErrorResponse(`Invalid ticket number`, 404))
  }

  // Check if user is admin or event organizer
  const event = attendee.event as any
  if (req.user.role !== "admin" && event.organizer.toString() !== req.user.id) {
    return next(new ErrorResponse(`User is not authorized to verify tickets for this event`, 401))
  }

  res.status(200).json({
    success: true,
    data: attendee,
  })
})
