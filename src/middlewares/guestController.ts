import type { Request, Response, NextFunction } from "express"
import { GuestService } from "../services/guestService"
import type { CreateGuestRequest, UpdateGuestRequest, GuestQueryParams, ApiResponse } from "../types/guest"
import type { AuthenticatedRequest } from "../middleware/auth"

const guestService = new GuestService()

export class GuestController {
  async createGuest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const guestData: CreateGuestRequest = req.body
      const userId = req.user!.id

      const guest = await guestService.createGuest(guestData, userId)

      const response: ApiResponse<typeof guest> = {
        success: true,
        data: guest,
        message: "Guest created successfully",
      }

      res.status(201).json(response)
    } catch (error) {
      next(error)
    }
  }

  async getGuests(req: Request, res: Response, next: NextFunction) {
    try {
      const queryParams: GuestQueryParams = {
        page: Number.parseInt(req.query.page as string) || 1,
        limit: Number.parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        vipLevel: req.query.vipLevel as string,
        accessLevel: req.query.accessLevel as string,
        invitationStatus: req.query.invitationStatus as string,
        eventId: req.query.eventId as string,
        tags: req.query.tags as string,
        isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as "asc" | "desc",
      }

      const result = await guestService.getGuests(queryParams)

      const response: ApiResponse<typeof result.guests> = {
        success: true,
        data: result.guests,
        pagination: result.pagination,
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async getGuestById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const guest = await guestService.getGuestById(id)

      const response: ApiResponse<typeof guest> = {
        success: true,
        data: guest,
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async updateGuest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const updateData: UpdateGuestRequest = req.body
      const userId = req.user!.id

      const guest = await guestService.updateGuest(id, updateData, userId)

      const response: ApiResponse<typeof guest> = {
        success: true,
        data: guest,
        message: "Guest updated successfully",
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async deleteGuest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await guestService.deleteGuest(id)

      const response: ApiResponse<null> = {
        success: true,
        message: "Guest deleted successfully",
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async softDeleteGuest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user!.id

      const guest = await guestService.softDeleteGuest(id, userId)

      const response: ApiResponse<typeof guest> = {
        success: true,
        data: guest,
        message: "Guest deactivated successfully",
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async bulkUpdateInvitationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { guestIds, status } = req.body
      const userId = req.user!.id

      if (!Array.isArray(guestIds) || guestIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Guest IDs array is required",
        })
      }

      const updatedGuests = await guestService.bulkUpdateInvitationStatus(guestIds, status, userId)

      const response: ApiResponse<typeof updatedGuests> = {
        success: true,
        data: updatedGuests,
        message: `Updated invitation status for ${updatedGuests.length} guests`,
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async getGuestsByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params
      const guests = await guestService.getGuestsByEvent(eventId)

      const response: ApiResponse<typeof guests> = {
        success: true,
        data: guests,
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async getGuestStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const statistics = await guestService.getGuestStatistics()

      const response: ApiResponse<typeof statistics> = {
        success: true,
        data: statistics,
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async exportGuests(req: Request, res: Response, next: NextFunction) {
    try {
      const queryParams: GuestQueryParams = {
        search: req.query.search as string,
        vipLevel: req.query.vipLevel as string,
        accessLevel: req.query.accessLevel as string,
        invitationStatus: req.query.invitationStatus as string,
        eventId: req.query.eventId as string,
        tags: req.query.tags as string,
        isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
      }

      const result = await guestService.getGuests({ ...queryParams, limit: 10000 })
      const guests = result.guests

      // Convert to CSV format
      const csvHeaders = [
        "ID",
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Company",
        "Title",
        "VIP Level",
        "Access Level",
        "Invitation Status",
        "Event IDs",
        "Tags",
        "Created At",
        "Updated At",
        "Is Active",
      ]

      const csvRows = guests.map((guest) => [
        guest.id,
        guest.firstName,
        guest.lastName,
        guest.email,
        guest.phone || "",
        guest.company || "",
        guest.title || "",
        guest.vipLevel,
        guest.accessLevel,
        guest.invitationStatus,
        guest.eventIds.join(";"),
        guest.tags?.join(";") || "",
        guest.createdAt.toISOString(),
        guest.updatedAt.toISOString(),
        guest.isActive,
      ])

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", "attachment; filename=special-guests.csv")
      res.send(csvContent)
    } catch (error) {
      next(error)
    }
  }
}
