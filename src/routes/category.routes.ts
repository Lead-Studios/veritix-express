import express from "express"
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller"
import { protect, authorize } from "../middleware/auth.middleware"
import { validateCategory } from "../middleware/validation.middleware"

const router = express.Router()

// Public routes
router.get("/", getCategories)
router.get("/:id", getCategory)

// Protected routes (Admin only)
router.use(protect)
router.use(authorize("admin"))

router.post("/", validateCategory, createCategory)
router.put("/:id", updateCategory)
router.delete("/:id", deleteCategory)

export default router
