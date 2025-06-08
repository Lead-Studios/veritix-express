import { body, param, validationResult } from "express-validator"

export const validateCollaborator = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),

  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  body("image")
    .isURL()
    .matches(/\.(jpg|jpeg|png|gif|webp)$/i)
    .withMessage("Please provide a valid image URL (jpg, jpeg, png, gif, webp)"),

  body("event").isMongoId().withMessage("Please provide a valid event ID"),

  body("role")
    .optional()
    .isIn(["coordinator", "assistant", "specialist", "volunteer"])
    .withMessage("Role must be one of: coordinator, assistant, specialist, volunteer"),
]

export const validateCollaboratorUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email").optional().isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  body("image")
    .optional()
    .isURL()
    .matches(/\.(jpg|jpeg|png|gif|webp)$/i)
    .withMessage("Please provide a valid image URL"),

  body("role")
    .optional()
    .isIn(["coordinator", "assistant", "specialist", "volunteer"])
    .withMessage("Role must be one of: coordinator, assistant, specialist, volunteer"),

  body("status")
    .optional()
    .isIn(["pending", "accepted", "declined"])
    .withMessage("Status must be one of: pending, accepted, declined"),
]

export const validateMongoId = [param("id").isMongoId().withMessage("Please provide a valid ID")]

export const validateEventId = [param("eventId").isMongoId().withMessage("Please provide a valid event ID")]

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    })
  }
  next()
}
