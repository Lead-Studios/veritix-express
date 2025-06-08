import { Router } from "express"
import { GuestController } from "../controllers/guestController"
import { authenticateToken, requireRole } from "../middleware/auth"
import {
  validateCreateGuest,
  validateUpdateGuest,
  validateGuestId,
  validateQueryParams,
} from "../middleware/validation"

const router = Router()
const guestController = new GuestController()

// Public routes (with authentication)
router.use(authenticateToken)

// GET /api/guests - Get all guests with filtering and pagination
router.get("/", validateQueryParams, guestController.getGuests.bind(guestController))

// GET /api/guests/statistics - Get guest statistics
router.get("/statistics", requireRole(["admin", "manager"]), guestController.getGuestStatistics.bind(guestController))

// GET /api/guests/export - Export guests to CSV
router.get(
  "/export",
  requireRole(["admin", "manager"]),
  validateQueryParams,
  guestController.exportGuests.bind(guestController),
)

// GET /api/guests/event/:eventId - Get guests by event
router.get("/event/:eventId", guestController.getGuestsByEvent.bind(guestController))

// GET /api/guests/:id - Get guest by ID
router.get("/:id", validateGuestId, guestController.getGuestById.bind(guestController))

// POST /api/guests - Create new guest
router.post(
  "/",
  requireRole(["admin", "manager", "coordinator"]),
  validateCreateGuest,
  guestController.createGuest.bind(guestController),
)

// PUT /api/guests/:id - Update guest
router.put(
  "/:id",
  requireRole(["admin", "manager", "coordinator"]),
  validateGuestId,
  validateUpdateGuest,
  guestController.updateGuest.bind(guestController),
)

// DELETE /api/guests/:id - Hard delete guest
router.delete("/:id", requireRole(["admin"]), validateGuestId, guestController.deleteGuest.bind(guestController))

// PATCH /api/guests/:id/deactivate - Soft delete guest
router.patch(
  "/:id/deactivate",
  requireRole(["admin", "manager"]),
  validateGuestId,
  guestController.softDeleteGuest.bind(guestController),
)

// PATCH /api/guests/bulk/invitation-status - Bulk update invitation status
router.patch(
  "/bulk/invitation-status",
  requireRole(["admin", "manager", "coordinator"]),
  guestController.bulkUpdateInvitationStatus.bind(guestController),
)

export default router
