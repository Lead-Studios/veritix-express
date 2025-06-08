import type { Request, Response, NextFunction } from "express"
import { sponsorService } from "../services/sponsor.service"
import type { AuthenticatedRequest } from "../middleware/auth.middleware"
import type { CreateSponsorRequest, UpdateSponsorRequest, SponsorQueryParams } from "../types/sponsor.types"
import { AppError } from "../utils/AppError"

export class SponsorController {
  async createSponsor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sponsorData: CreateSponsorRequest = req.body
      const userId = req.user!.id

      const sponsor = await sponsorService.createSponsor(sponsorData, userId)

      res.status(201).json({
        success: true,
        message: "Sponsor created successfully",
        data: sponsor,
      })
    } catch (error) {
      next(error)
    }
  }

  async getSponsor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const sponsor = await sponsorService.getSponsorById(id)

      res.json({
        success: true,
        data: sponsor,
      })
    } catch (error) {
      next(error)
    }
  }

  async getSponsors(req: Request, res: Response, next: NextFunction) {
    try {
      const queryParams: SponsorQueryParams = {
        page: Number.parseInt(req.query.page as string) || 1,
        limit: Number.parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        tier: req.query.tier as any,
        status: req.query.status as any,
        industry: req.query.industry as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as "asc" | "desc",
        eventId: req.query.eventId as string,
      }

      const result = await sponsorService.getSponsors(queryParams)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  async updateSponsor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const updateData: UpdateSponsorRequest = req.body
      const userId = req.user!.id

      const sponsor = await sponsorService.updateSponsor(id, updateData, userId)

      res.json({
        success: true,
        message: "Sponsor updated successfully",
        data: sponsor,
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteSponsor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await sponsorService.deleteSponsor(id)

      res.json({
        success: true,
        message: "Sponsor deleted successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  async uploadLogo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const file = req.file

      if (!file) {
        throw new AppError("No file uploaded", 400)
      }

      const logoPath = `/uploads/${file.filename}`
      const userId = req.user!.id

      const sponsor = await sponsorService.updateSponsor(id, { logo: logoPath } as any, userId)

      res.json({
        success: true,
        message: "Logo uploaded successfully",
        data: { logoPath },
      })
    } catch (error) {
      next(error)
    }
  }

  async updatePaymentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { paymentScheduleId, status, paidDate, transactionId } = req.body

      const sponsor = await sponsorService.updatePaymentStatus(
        id,
        paymentScheduleId,
        status,
        paidDate ? new Date(paidDate) : undefined,
        transactionId,
      )

      res.json({
        success: true,
        message: "Payment status updated successfully",
        data: sponsor,
      })
    } catch (error) {
      next(error)
    }
  }

  async getSponsorsByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params
      const sponsors = await sponsorService.getSponsorsByEvent(eventId)

      res.json({
        success: true,
        data: sponsors,
      })
    } catch (error) {
      next(error)
    }
  }

  async getExpiringContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const days = Number.parseInt(req.query.days as string) || 30
      const sponsors = await sponsorService.getExpiringContracts(days)

      res.json({
        success: true,
        data: sponsors,
        message: `Found ${sponsors.length} contracts expiring in ${days} days`,
      })
    } catch (error) {
      next(error)
    }
  }

  async getOverduePayments(req: Request, res: Response, next: NextFunction) {
    try {
      const sponsors = await sponsorService.getOverduePayments()

      res.json({
        success: true,
        data: sponsors,
        message: `Found ${sponsors.length} sponsors with overdue payments`,
      })
    } catch (error) {
      next(error)
    }
  }

  async getSponsorStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.calculateSponsorStats()

      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      next(error)
    }
  }

  private async calculateSponsorStats() {
    // This would typically involve multiple database queries
    // For brevity, returning mock stats structure
    return {
      totalSponsors: 0,
      activeSponsors: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      expiringContracts: 0,
      sponsorsByTier: {
        PLATINUM: 0,
        GOLD: 0,
        SILVER: 0,
        BRONZE: 0,
        PARTNER: 0,
        MEDIA: 0,
      },
      revenueByMonth: [],
      topIndustries: [],
    }
  }
}

export const sponsorController = new SponsorController()
