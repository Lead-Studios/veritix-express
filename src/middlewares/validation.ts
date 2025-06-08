import type { Request, Response, NextFunction } from "express"
import Joi from "joi"

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query)
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((detail) => detail.message),
      })
    }
    next()
  }
}

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params)
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((detail) => detail.message),
      })
    }
    next()
  }
}

// Validation schemas
export const eventIdSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required(),
})

export const reportsQuerySchema = Joi.object({
  timeframe: Joi.string().valid("weekly", "monthly", "yearly").optional(),
  sort: Joi.string().valid("top-selling", "recent", "revenue").optional(),
  page: Joi.string().pattern(/^\d+$/).optional(),
  limit: Joi.string().pattern(/^\d+$/).optional(),
})
