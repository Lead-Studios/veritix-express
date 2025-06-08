import Joi from "joi"
import { UserRole, TicketStatus, TicketPriority } from "../types"

// User schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  department: Joi.string().max(100).optional(),
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  username: Joi.string().min(3).max(30).optional(),
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  department: Joi.string().max(100).optional(),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
  isActive: Joi.boolean().optional(),
})

// Ticket schemas
export const createTicketSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(5000).required(),
  priority: Joi.string()
    .valid(...Object.values(TicketPriority))
    .required(),
  category: Joi.string().required(),
  assignedTo: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  dueDate: Joi.date().optional(),
  estimatedHours: Joi.number().min(0).optional(),
})

export const updateTicketSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(10).max(5000).optional(),
  status: Joi.string()
    .valid(...Object.values(TicketStatus))
    .optional(),
  priority: Joi.string()
    .valid(...Object.values(TicketPriority))
    .optional(),
  category: Joi.string().optional(),
  assignedTo: Joi.string().allow(null).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  dueDate: Joi.date().allow(null).optional(),
  estimatedHours: Joi.number().min(0).allow(null).optional(),
  actualHours: Joi.number().min(0).allow(null).optional(),
})

// Comment schemas
export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  isInternal: Joi.boolean().optional().default(false),
})

export const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
})

// Category schemas
export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .required(),
  isActive: Joi.boolean().optional().default(true),
})

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .optional(),
  isActive: Joi.boolean().optional(),
})

// Query schemas
export const ticketQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  sortBy: Joi.string().valid("createdAt", "updatedAt", "title", "priority", "status").optional().default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").optional().default("desc"),
  status: Joi.alternatives()
    .try(
      Joi.string().valid(...Object.values(TicketStatus)),
      Joi.array().items(Joi.string().valid(...Object.values(TicketStatus))),
    )
    .optional(),
  priority: Joi.alternatives()
    .try(
      Joi.string().valid(...Object.values(TicketPriority)),
      Joi.array().items(Joi.string().valid(...Object.values(TicketPriority))),
    )
    .optional(),
  category: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  assignedTo: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  createdBy: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  search: Joi.string().max(100).optional(),
  tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
})
