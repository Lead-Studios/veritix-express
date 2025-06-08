import express from "express"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validation"
import { createCategorySchema, updateCategorySchema } from "../validation/schemas"
import { db } from "../config/database"
import { UserRole } from "../types"
import { asyncHandler } from "../middleware/errorHandler"

const router = express.Router()

// Get all categories
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const categories = db.getCategories().filter((cat) => cat.isActive)

    res.json({
      success: true,
      data: categories,
    })
  }),
)

// Get category by ID
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const category = db.getCategoryById(req.params.id)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.json({
      success: true,
      data: category,
    })
  }),
)

// Create category
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createCategorySchema),
  asyncHandler(async (req, res) => {
    const category = db.createCategory(req.body)

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    })
  }),
)

// Update category
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateCategorySchema),
  asyncHandler(async (req, res) => {
    const category = db.getCategoryById(req.params.id)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    const updatedCategory = db.updateCategory(req.params.id, req.body)

    res.json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    })
  }),
)

// Delete category
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const category = db.getCategoryById(req.params.id)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    // Check if category is being used by tickets
    const tickets = db.getTickets().filter((ticket) => ticket.category === req.params.id)
    if (tickets.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category that is being used by tickets",
      })
    }

    db.deleteCategory(req.params.id)

    res.json({
      success: true,
      message: "Category deleted successfully",
    })
  }),
)

export default router
