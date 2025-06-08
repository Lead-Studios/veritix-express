import type { Request, Response, NextFunction } from "express"
import { body, param, validationResult } from "express-validator"

export const validateCreatePoster = [
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  body("eventId").notEmpty().withMessage("Event ID is required").isUUID().withMessage("Event ID must be a valid UUID"),
]

export const validateUpdatePoster = [
  param("id").isUUID().withMessage("Poster ID must be a valid UUID"),
  body("description")
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  body("eventId").optional().isUUID().withMessage("Event ID must be a valid UUID"),
]

export const validatePosterParams = [param("id").isUUID().withMessage("Poster ID must be a valid UUID")]

export const validateEventParams = [param("eventId").isUUID().withMessage("Event ID must be a valid UUID")]

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    })
    return
  }
  next()
}
