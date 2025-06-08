import { body, validationResult } from "express-validator"
import type { Request, Response, NextFunction } from "express"
import { ErrorResponse } from "../utils/errorResponse"

// Handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg)
    return next(new ErrorResponse(errorMessages.join(", "), 400))
  }
  next()
}

// Event validation
export const validateEvent = [
  body("title")
    .notEmpty()
    .withMessage("Event title is required")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),
  body("description").notEmpty().withMessage("Event description is required"),
  body("startDate").isISO8601().withMessage("Valid start date is required"),
  body("endDate").isISO8601().withMessage("Valid end date is required"),
  body("category").isMongoId().withMessage("Valid category ID is required"),
  body("capacity").optional().isInt({ min: 0 }).withMessage("Capacity must be a positive number"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("isVirtual").optional().isBoolean().withMessage("isVirtual must be a boolean"),
  body("virtualMeetingLink")
    .if(body("isVirtual").equals(true))
    .notEmpty()
    .withMessage("Virtual meeting link is required for virtual events"),
  handleValidationErrors,
]

// Category validation
export const validateCategory = [
  body("name").notEmpty().withMessage("Category name is required").trim(),
  body("description").optional().trim(),
  body("color").optional().isHexColor().withMessage("Color must be a valid hex color"),
  handleValidationErrors,
]

// Location validation
export const validateLocation = [
  body("name").notEmpty().withMessage("Location name is required").trim(),
  body("address").notEmpty().withMessage("Address is required").trim(),
  body("city").notEmpty().withMessage("City is required").trim(),
  body("country").notEmpty().withMessage("Country is required").trim(),
  body("coordinates.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
  body("coordinates.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
  handleValidationErrors,
]

// User validation
export const validateUser = [
  body("name").notEmpty().withMessage("Name is required").trim(),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
]

// Login validation
export const validateLogin = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
]
