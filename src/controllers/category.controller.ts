import type { Request, Response, NextFunction } from "express"
import Category from "../models/category.model"
import { asyncHandler } from "../middleware/async.middleware"
import { ErrorResponse } from "../utils/errorResponse"

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin only)
export const createCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const category = await Category.create(req.body)

  res.status(201).json({
    success: true,
    data: category,
  })
})

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const categories = await Category.find().sort("name")

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  })
})

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const category = await Category.findById(req.params.id)

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: category,
  })
})

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
export const updateCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let category = await Category.findById(req.params.id)

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404))
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: category,
  })
})

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
export const deleteCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const category = await Category.findById(req.params.id)

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404))
  }

  await category.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})
