import Joi from "joi"
import { DisputeType, DisputePriority } from "../types/dispute"

export const createDisputeSchema = Joi.object({
  ticketId: Joi.string().hex().length(24).required(),
  disputeType: Joi.string()
    .valid(...Object.values(DisputeType))
    .required(),
  priority: Joi.string()
    .valid(...Object.values(DisputePriority))
    .optional()
    .default(DisputePriority.MEDIUM),
  subject: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  refundAmount: Joi.number().min(0).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  metadata: Joi.object().optional(),
})

export const updateDisputeSchema = Joi.object({
  subject: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(10).max(2000).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  metadata: Joi.object().optional(),
})

export const adminUpdateDisputeSchema = Joi.object({
  status: Joi.string()
    .valid(
      "pending",
      "under_review",
      "investigating",
      "awaiting_response",
      "escalated",
      "resolved",
      "rejected",
      "approved",
      "cancelled",
      "closed",
    )
    .optional(),
  priority: Joi.string()
    .valid(...Object.values(DisputePriority))
    .optional(),
  adminResponse: Joi.string().max(2000).optional(),
  resolution: Joi.string().max(2000).optional(),
  refundAmount: Joi.number().min(0).optional(),
  refundStatus: Joi.string().valid("pending", "approved", "rejected", "processed", "failed").optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  escalationLevel: Joi.number().min(0).max(5).optional(),
})

export const disputeQuerySchema = Joi.object({
  status: Joi.string()
    .valid(
      "pending",
      "under_review",
      "investigating",
      "awaiting_response",
      "escalated",
      "resolved",
      "rejected",
      "approved",
      "cancelled",
      "closed",
    )
    .optional(),
  disputeType: Joi.string()
    .valid(...Object.values(DisputeType))
    .optional(),
  priority: Joi.string()
    .valid(...Object.values(DisputePriority))
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.string().pattern(/^\d+$/).optional(),
  limit: Joi.string().pattern(/^\d+$/).optional(),
  sortBy: Joi.string().valid("createdAt", "updatedAt", "priority", "status").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional(),
  search: Joi.string().max(100).optional(),
})

export const addCommunicationSchema = Joi.object({
  message: Joi.string().min(1).max(2000).required(),
  isInternal: Joi.boolean().optional().default(false),
  attachments: Joi.array().items(Joi.string()).max(5).optional(),
})

export interface CreateDisputeDto {
  ticketId: string
  disputeType: DisputeType
  priority?: DisputePriority
  subject: string
  description: string
  refundAmount?: number
  tags?: string[]
  metadata?: Record<string, any>
}

export interface UpdateDisputeDto {
  subject?: string
  description?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface AdminUpdateDisputeDto {
  status?: string
  priority?: DisputePriority
  adminResponse?: string
  resolution?: string
  refundAmount?: number
  refundStatus?: string
  tags?: string[]
  escalationLevel?: number
}

export interface DisputeQueryDto {
  status?: string
  disputeType?: DisputeType
  priority?: DisputePriority
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
}
