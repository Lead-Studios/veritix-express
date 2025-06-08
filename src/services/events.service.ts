import Event from "../models/event.model"
import Attendee from "../models/attendee.model"
import Comment from "../models/comment.model"

export class EventService {
  // Get event statistics
  static async getEventStatistics(eventId: string) {
    const event = await Event.findById(eventId)
    if (!event) {
      throw new Error("Event not found")
    }

    const totalAttendees = await Attendee.countDocuments({ event: eventId, status: { $ne: "cancelled" } })
    const checkedInAttendees = await Attendee.countDocuments({ event: eventId, status: "attended" })
    const totalComments = await Comment.countDocuments({ event: eventId, isPublic: true })

    // Get rating statistics
    const ratingStats = await Comment.aggregate([
      { $match: { event: eventId, rating: { $exists: true } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ])

    const averageRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0
    const totalRatings = ratingStats.length > 0 ? ratingStats[0].totalRatings : 0

    return {
      totalAttendees,
      checkedInAttendees,
      totalComments,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
      capacity: event.capacity,
      availableSpots: event.capacity > 0 ? event.capacity - totalAttendees : null,
    }
  }

  // Get trending events
  static async getTrendingEvents(limit = 10) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const trendingEvents = await Event.aggregate([
      {
        $match: {
          status: "published",
          startDate: { $gte: new Date() },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $lookup: {
          from: "attendees",
          localField: "_id",
          foreignField: "event",
          as: "attendees",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "event",
          as: "comments",
        },
      },
      {
        $addFields: {
          attendeesCount: { $size: "$attendees" },
          commentsCount: { $size: "$comments" },
          trendingScore: {
            $add: [{ $multiply: [{ $size: "$attendees" }, 2] }, { $size: "$comments" }],
          },
        },
      },
      { $sort: { trendingScore: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "organizer",
          foreignField: "_id",
          as: "organizer",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "location",
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          startDate: 1,
          endDate: 1,
          bannerImage: 1,
          price: 1,
          isFree: 1,
          attendeesCount: 1,
          commentsCount: 1,
          trendingScore: 1,
          "organizer.name": 1,
          "category.name": 1,
          "category.color": 1,
          "location.name": 1,
          "location.city": 1,
        },
      },
    ])

    return trendingEvents
  }

  // Get events by date range
  static async getEventsByDateRange(startDate: Date, endDate: Date) {
    return await Event.find({
      status: "published",
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
      ],
    })
      .populate([
        { path: "organizer", select: "name" },
        { path: "category", select: "name color" },
        { path: "location", select: "name city" },
      ])
      .sort("startDate")
  }

  // Check event conflicts for organizer
  static async checkEventConflicts(organizerId: string, startDate: Date, endDate: Date, excludeEventId?: string) {
    const query: any = {
      organizer: organizerId,
      status: { $ne: "cancelled" },
      $or: [
        { startDate: { $gte: startDate, $lt: endDate } },
        { endDate: { $gt: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
      ],
    }

    if (excludeEventId) {
      query._id = { $ne: excludeEventId }
    }

    const conflictingEvents = await Event.find(query).select("title startDate endDate")

    return conflictingEvents
  }
}
