import express from "express"
import {
  createLocation,
  getLocations,
  getLocation,
  updateLocation,
  deleteLocation,
  getNearbyLocations,
} from "../controllers/location.controller"
import { protect, authorize } from "../middleware/auth.middleware"
import { validateLocation } from "../middleware/validation.middleware"

const router = express.Router()

// Public routes
router.get("/", getLocations)
router.get("/near", getNearbyLocations)
router.get("/:id", getLocation)

// Protected routes
router.use(protect)

router.post("/", validateLocation, createLocation)
router.put("/:id", updateLocation)

// Admin only routes
router.delete("/:id", authorize("admin"), deleteLocation)

export default router
