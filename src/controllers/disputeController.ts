import type { Response, NextFunction } from "express"
import { DisputeService } from "../services/disputeService"
import { FileUploadService } from "../services/fileUploadService"
import { NotificationService } from "../services/notificationService"
import type { AuthRequest } from "../types"
import type { CreateDisputeDto, UpdateDisputeDto, AdminUpdateDisputeDto, DisputeQueryDto } from "../dto/dispute.dto"

export class DisputeController {
  private disputeService: DisputeService
  private fileUploadService: FileUploadService
  private notificationService: NotificationService

  constructor() {
    this.disputeService = new DisputeService()
    this.fileUploadService = new FileUploadService()
    this.notificationService = new NotificationService()
  }

  createDispute = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id
      const disputeData: CreateDisputeDto = req.body

      // Process uploaded files if any
      let evidence = []
      if (req.files && Array.isArray(req.files)) {
        evidence = await this.fileUploadService.processEvidenceFiles(
          req.files as Express.Multer.File[],
          "temp", // Will be updated with actual dispute ID
        )
      }

      const dispute = await this.disputeService.createDispute(userId, disputeData)

      // Update evidence with actual dispute ID if files were uploaded
      if (evidence.length > 0) {
        const updatedDispute = await this.disputeService.addEvidence(dispute._id, evidence)
        return res.status(201).json({
          success: true,
          message: "Dispute created successfully with evidence",
          data: updatedDispute,
        })
      }

      res.status(201).json({
        success: true,
        message: "Dispute created successfully",
        data: dispute,
      })
    } catch (error) {
      next(error)
    }
  }

  getUserDisputes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id
      const query: DisputeQueryDto = {
        status: req.query.status as string,
        disputeType: req.query.disputeType as any,
        priority: req.query.priority as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? Number.parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? Number.parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as "asc" | "desc",
        search: req.query.search as string,
      }

      const result = await this.disputeService.getUserDisputes(userId, query)

      res.status(200).json({
        success: true,
        message: "Disputes retrieved successfully",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  getDisputeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const userId = req.user!._id
      const isAdmin = ["admin", "super_admin"].includes(req.user!.role)

      const dispute = await this.disputeService.getDisputeById(id, isAdmin ? undefined : userId)

      if (!dispute) {
        return res.status(404).json({
          success: false,
          message: "Dispute not found",
        })
      }

      res.status(200).json({
        success: true,
        message: "Dispute retrieved successfully",
        data: dispute,
      })
    } catch (error) {
      next(error)
    }
  }

  updateDispute = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const userId = req.user!._id
      const updateData: UpdateDisputeDto = req.body

      const dispute = await this.disputeService.updateDispute(id, userId, updateData)

      res.status(200).json({
        success: true,
        message: "Dispute updated successfully",
        data: dispute,
      })
    } catch (error) {
      next(error)
    }
  }

  deleteDispute = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const userId = req.user!._id

      await this.disputeService.deleteDispute(id, userId)

      res.status(200).json({
        success: true,
        message: "Dispute deleted successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  addCommunication = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const userId = req.user!._id
      const { message, isInternal = false, attachments } = req.body

      const dispute = await this.disputeService.addCommunication(id, userId, message, isInternal, attachments)

      res.status(200).json({
        success: true,
        message: "Communication added successfully",
        data: dispute,
      })
    } catch (error) {
      next(error)
    }
  }

  uploadEvidence = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const userId = req.user!._id

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        })
      }

      const evidence = await this.fileUploadService.processEvidenceFiles(req.files as Express.Multer.File[], id)

      const dispute = await this.disputeService.addEvidence(id, evidence)

      res.status(200).json({
        success: true,
        message: "Evidence uploaded successfully",
        data: {
          dispute,
          uploadedFiles: evidence.length,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  escalateDispute = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const userId = req.user!._id
      const { reason, escalatedTo } = req.body

      const dispute = await this.disputeService.escalateDispute(id, userId, reason, escalatedTo)

      res.status(200).json({
        success: true,
        message: "Dispute escalated successfully",
        data: dispute,
      })
    } catch (error) {
      next(error)
    }
  }

  getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id
      const options = {
        page: req.query.page ? Number.parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? Number.parseInt(req.query.limit as string) : 20,
        unreadOnly: req.query.unreadOnly === "true",
        type: req.query.type as any,
      }

      const result = await this.notificationService.getNotifications(userId, options)

      res.status(200).json({
        success: true,
        message: "Notifications retrieved successfully",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  markNotificationAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { notificationId } = req.params
      const userId = req.user!._id

      const success = await this.notificationService.markAsRead(notificationId, userId)

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        })
      }

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
      })
    } catch (error) {
      next(error)
    }
  }

  markAllNotificationsAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id

      const count = await this.notificationService.markAllAsRead(userId)

      res.status(200).json({
        success: true,
        message: `${count} notifications marked as read`,
      })
    } catch (error) {
      next(error)
    }
  }

  // Admin methods
  getAllDisputes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query: DisputeQueryDto & { adminId?: string } = {
        status: req.query.status as string,
        disputeType: req.query.disputeType as any,
        priority: req.query.priority as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? Number.parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? Number.parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as "asc" | "desc",
        search: req.query.search as string,
        adminId: req.query.adminId as string,
      }

      const result = await this.disputeService.getAllDisputes(query)

      res.status(200).json({
        success: true,
        message: "All disputes retrieved successfully",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  adminUpdateDispute = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const adminId = req.user!._id
      const updateData: AdminUpdateDisputeDto = req.body

      const dispute = await this.disputeService.adminUpdateDispute(id, adminId, updateData)

      res.status(200).json({
        success: true,
        message: "Dispute updated by admin successfully",
        data: dispute,
      })
    } catch (error) {
      next(error)
    }
  }

  getDisputeAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined

      const analytics = await this.disputeService.getDisputeAnalytics(startDate, endDate)

      res.status(200).json({
        success: true,
        message: "Dispute analytics retrieved successfully",
        data: analytics,
      })
    } catch (error) {
      next(error)
    }
  }

  assignDispute = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const { adminId } = req.body
      const assignedBy = req.user!._id

      const updateData: AdminUpdateDisputeDto = {
        status: "under_review",
      }

      const dispute = await this.disputeService.adminUpdateDispute(id, adminId, updateData)

      // Add communication about assignment
      await this.disputeService.addCommunication(id, assignedBy, `Dispute assigned to admin ${adminId}`, true)

      res.status(200).json({
        success: true,
        message: "Dispute assigned successfully",
        data: dispute,
      })
    } catch (error) {
      next(error)
    }
  }

  bulkUpdateDisputes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { disputeIds, updateData } = req.body
      const adminId = req.user!._id

      const results = []
      for (const disputeId of disputeIds) {
        try {
          const dispute = await this.disputeService.adminUpdateDispute(disputeId, adminId, updateData)
          results.push({ disputeId, success: true, dispute })
        } catch (error) {
          results.push({
            disputeId,
            success: false,
            error: (error as Error).message,
          })
        }
      }

      const successCount = results.filter((r) => r.success).length
      const failureCount = results.filter((r) => !r.success).length

      res.status(200).json({
        success: true,
        message: `Bulk update completed: ${successCount} successful, ${failureCount} failed`,
        data: {
          results,
          summary: { successCount, failureCount },
        },
      })
    } catch (error) {
      next(error)
    }
  }
}
