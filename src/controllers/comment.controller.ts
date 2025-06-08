import type { Request, Response, NextFunction } from "express"
import Comment from "../models/comment.model"
import Event from "../models/event.model"
import { asyncHandler } from "../middleware/async.middleware"
import { ErrorResponse } from "../utils/errorResponse"
import mongoose from "mongoose"

// @desc    Add comment to event
// @route   POST /api/events/:eventId/comments
// @access  Private
export const addComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const eventId = req.params.eventId

  // Check if event exists
  const event = await Event.findById(eventId)
  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${eventId}`, 404))
  }

  // Add user and event to req.body
  req.body.user = req.user.id
  req.body.event = eventId

  const comment = await Comment.create(req.body)

  res.status(201).json({
    success: true,
    data: comment,
  })
})

// @desc    Get comments for an event
// @route   GET /api/events/:eventId/comments
// @access  Public
export const getEventComments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const eventId = req.params.eventId

  // Check if event exists
  const event = await Event.findById(eventId)
  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${eventId}`, 404))
  }

  // Get only public comments and root comments (not replies)
  const comments = await Comment.find({
    event: eventId,
    isPublic: true,
    parentComment: null,
  })
    .populate({
      path: "user",
      select: "name profileImage",
    })
    .populate({
      path: "replies",
      match: { isPublic: true },
      populate: {
        path: "user",
        select: "name profileImage",
      },
    })
    .sort("-createdAt")

  res.status(200).json({
    success: true,
    count: comments.length,
    data: comments,
  })
})

// @desc    Get single comment
// @route   GET /api/comments/:id
// @access  Public
export const getComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const comment = await Comment.findById(req.params.id)
    .populate({
      path: "user",
      select: "name profileImage",
    })
    .populate({
      path: "replies",
      match: { isPublic: true },
      populate: {
        path: "user",
        select: "name profileImage",
      },
    })

  if (!comment) {
    return next(new ErrorResponse(`Comment not found with id of ${req.params.id}`, 404))
  }

  // If comment is not public and user is not the author or admin
  if (!comment.isPublic && comment.user._id.toString() !== req.user?.id && req.user?.role !== "admin") {
    return next(new ErrorResponse(`Not authorized to access this comment`, 401))
  }

  res.status(200).json({
    success: true,
    data: comment,
  })
})

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let comment = await Comment.findById(req.params.id)

  if (!comment) {
    return next(new ErrorResponse(`Comment not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is comment owner or admin
  if (comment.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this comment`, 401))
  }

  // Only allow updating content, rating, and isPublic
  const { content, rating, isPublic } = req.body
  const updateData: any = {}

  if (content !== undefined) updateData.content = content
  if (rating !== undefined) updateData.rating = rating
  if (isPublic !== undefined) updateData.isPublic = isPublic

  comment = await Comment.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: comment,
  })
})

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const comment = await Comment.findById(req.params.id)

  if (!comment) {
    return next(new ErrorResponse(`Comment not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is comment owner or admin
  if (comment.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this comment`, 401))
  }

  await comment.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Reply to a comment
// @route   POST /api/comments/:id/reply
// @access  Private
export const replyToComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const parentComment = await Comment.findById(req.params.id)

  if (!parentComment) {
    return next(new ErrorResponse(`Comment not found with id of ${req.params.id}`, 404))
  }

  // Add user, event, and parentComment to req.body
  req.body.user = req.user.id
  req.body.event = parentComment.event
  req.body.parentComment = parentComment._id

  const reply = await Comment.create(req.body)

  res.status(201).json({
    success: true,
    data: reply,
  })
})

// @desc    Get event ratings statistics
// @route   GET /api/events/:eventId/ratings
// @access  Public
export const getEventRatings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const eventId = req.params.eventId

  // Check if event exists
  const event = await Event.findById(eventId)
  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${eventId}`, 404))
  }

  // Get ratings statistics
  const ratings = await Comment.aggregate([
    { $match: { event: mongoose.Types.ObjectId(eventId), rating: { $exists: true } } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
        fiveStars: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
      },
    },
  ])

  const ratingStats =
    ratings.length > 0
      ? ratings[0]
      : {
          averageRating: 0,
          totalRatings: 0,
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
          twoStars: 0,
          oneStar: 0,
        }

  // Remove _id field
  delete ratingStats._id

  res.status(200).json({
    success: true,
    data: ratingStats,
  })
})
