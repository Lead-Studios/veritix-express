import { Router } from "express"
import { authenticate, authorize } from "../middlewares/auth.middleware"
import { uploadPosterImage } from "../middlewares/upload.middleware"
import { validateDto } from "../middlewares/validate.middleware"
import { validateParamDto } from "../middlewares/validateParam.middleware"
import { CreatePosterDto, UpdatePosterDto, PosterParamDto, EventParamDto } from "../dtos/poster.dto"
import { PosterController } from "../controllers/poster.controller"

const router = Router()
const posterController = new PosterController()

// Upload a new poster
router.post(
  "/",
  authenticate,
  authorize(["admin", "event_manager"]),
  uploadPosterImage,
  validateDto(CreatePosterDto),
  posterController.uploadPoster
)

// Get all posters
router.get(
  "/",
  authenticate,
  posterController.getAllPosters
)

// Get poster by ID
router.get(
  "/:id",
  authenticate,
  validateParamDto(PosterParamDto),
  posterController.getPosterById
)

// Update poster
router.put(
  "/:id",
  authenticate,
  authorize(["admin", "event_manager"]),
  validateParamDto(PosterParamDto),
  validateDto(UpdatePosterDto),
  posterController.updatePoster
)

// Delete poster
router.delete(
  "/:id",
  authenticate,
  authorize(["admin", "event_manager"]),
  validateParamDto(PosterParamDto),
  posterController.deletePoster
)

export default router
