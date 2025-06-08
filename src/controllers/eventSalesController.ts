import type { Response, NextFunction } from "express"
import { EventSalesService } from "../services/eventSalesService"
import type { AuthRequest, QueryParams } from "../types"

export class EventSalesController {
  private eventSalesService: EventSalesService

  constructor() {
    this.eventSalesService = new EventSalesService()
  }

  getAllEventSales = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 10

      const result = await this.eventSalesService.getAllEventSales(page, limit)

      res.status(200).json({
        success: true,
        message: "Event sales retrieved successfully",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  getEventSales = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { eventId } = req.params
      const sales = await this.eventSalesService.getEventSales(eventId)

      if (!sales) {
        return res.status(404).json({
          success: false,
          message: "Event not found or no sales data available",
        })
      }

      res.status(200).json({
        success: true,
        message: "Event sales retrieved successfully",
        data: sales,
      })
    } catch (error) {
      next(error)
    }
  }

  generateSalesReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const params: QueryParams = {
        timeframe: req.query.timeframe as "weekly" | "monthly" | "yearly",
        sort: req.query.sort as "top-selling" | "recent" | "revenue",
      }

      const report = await this.eventSalesService.generateSalesReport(params)

      res.status(200).json({
        success: true,
        message: "Sales report generated successfully",
        data: report,
      })
    } catch (error) {
      next(error)
    }
  }
}
