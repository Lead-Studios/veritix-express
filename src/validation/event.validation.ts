import { body, param, query } from "express-validator";

export const validateCreateEvent = [
  body("name").isString().notEmpty().withMessage("Event name is required"),
  body("date").isISO8601().withMessage("Valid event date is required"),
  body("location").isString().optional(),
  // Add more fields as necessary
];

export const validateGetEventById = [
  param("id").isInt().withMessage("Event ID must be an integer"),
];

export const validateArchiveEvent = [
  param("id").isInt().withMessage("Event ID must be an integer"),
];

export const validateGenerateReports = [
  query("period")
    .isIn(["weekly", "monthly", "yearly"])
    .withMessage("Period must be one of: weekly, monthly, yearly"),
];

export const validateDeleteEvent = [
  param("id").isInt().withMessage("Event ID must be an integer"),
];
