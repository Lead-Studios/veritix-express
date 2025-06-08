import Event from "../models/Event"
import Ticket from "../models/Ticket"
import type { EventSalesSummary, SalesReport, QueryParams } from "../types"

export class EventSalesService {
  async getAllEventSales(
    page = 1,
    limit = 10,
  ): Promise<{
    sales: EventSalesSummary[]
    total: number
    page: number
    totalPages: number
  }> {
    const skip = (page - 1) * limit

    const pipeline = [
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "eventId",
          as: "tickets",
        },
      },
      {
        $addFields: {
          activeTickets: {
            $filter: {
              input: "$tickets",
              cond: { $eq: ["$$this.status", "active"] },
            },
          },
        },
      },
      {
        $project: {
          eventId: "$_id",
          eventTitle: "$title",
          totalTicketsSold: {
            $sum: "$activeTickets.quantity",
          },
          totalRevenue: {
            $sum: {
              $map: {
                input: "$activeTickets",
                as: "ticket",
                in: { $multiply: ["$$ticket.price", "$$ticket.quantity"] },
              },
            },
          },
          averageTicketPrice: {
            $cond: {
              if: { $gt: [{ $size: "$activeTickets" }, 0] },
              then: { $avg: "$activeTickets.price" },
              else: 0,
            },
          },
          salesCount: { $size: "$activeTickets" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]

    const sales = await Event.aggregate(pipeline)
    const total = await Event.countDocuments()

    return {
      sales,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getEventSales(eventId: string): Promise<EventSalesSummary | null> {
    const pipeline = [
      { $match: { _id: eventId } },
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "eventId",
          as: "tickets",
        },
      },
      {
        $addFields: {
          activeTickets: {
            $filter: {
              input: "$tickets",
              cond: { $eq: ["$$this.status", "active"] },
            },
          },
        },
      },
      {
        $project: {
          eventId: "$_id",
          eventTitle: "$title",
          totalTicketsSold: {
            $sum: "$activeTickets.quantity",
          },
          totalRevenue: {
            $sum: {
              $map: {
                input: "$activeTickets",
                as: "ticket",
                in: { $multiply: ["$$ticket.price", "$$ticket.quantity"] },
              },
            },
          },
          averageTicketPrice: {
            $cond: {
              if: { $gt: [{ $size: "$activeTickets" }, 0] },
              then: { $avg: "$activeTickets.price" },
              else: 0,
            },
          },
          salesCount: { $size: "$activeTickets" },
        },
      },
    ]

    const result = await Event.aggregate(pipeline)
    return result.length > 0 ? result[0] : null
  }

  async generateSalesReport(params: QueryParams): Promise<SalesReport> {
    const { timeframe = "monthly", sort = "revenue" } = params
    const { startDate, endDate } = this.getDateRange(timeframe)

    const matchStage = {
      purchaseDate: { $gte: startDate, $lte: endDate },
      status: "active",
    }

    // Get overall statistics
    const overallStats = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ["$price", "$quantity"] },
          },
          totalTicketsSold: { $sum: "$quantity" },
          uniqueEvents: { $addToSet: "$eventId" },
        },
      },
    ])

    // Get event-specific statistics
    const eventStats = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$eventId",
          totalTicketsSold: { $sum: "$quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$price", "$quantity"] },
          },
          averageTicketPrice: { $avg: "$price" },
          salesCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "event",
        },
      },
      {
        $project: {
          eventId: "$_id",
          eventTitle: { $arrayElemAt: ["$event.title", 0] },
          totalTicketsSold: 1,
          totalRevenue: 1,
          averageTicketPrice: 1,
          salesCount: 1,
        },
      },
      this.getSortStage(sort),
    ])

    const stats = overallStats[0] || {
      totalRevenue: 0,
      totalTicketsSold: 0,
      uniqueEvents: [],
    }

    return {
      timeframe,
      startDate,
      endDate,
      totalRevenue: stats.totalRevenue,
      totalTicketsSold: stats.totalTicketsSold,
      totalEvents: stats.uniqueEvents.length,
      events: eventStats,
    }
  }

  private getDateRange(timeframe: string): { startDate: Date; endDate: Date } {
    const endDate = new Date()
    const startDate = new Date()

    switch (timeframe) {
      case "weekly":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "monthly":
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case "yearly":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setMonth(endDate.getMonth() - 1)
    }

    return { startDate, endDate }
  }

  private getSortStage(sort: string) {
    switch (sort) {
      case "top-selling":
        return { $sort: { totalTicketsSold: -1 } }
      case "revenue":
        return { $sort: { totalRevenue: -1 } }
      case "recent":
        return { $sort: { _id: -1 } }
      default:
        return { $sort: { totalRevenue: -1 } }
    }
  }
}
