import { Router } from "express"
import { DisputeController } from "../controllers/disputeController"
import { authenticate, authorize } from "../middleware/auth"
import { adminReportsLimiter, createRateLimiter } from "../middleware/rateLimiter"
import { validateQuery, validateParams, validateBody } from "../middleware/validation"
import { uploadMiddleware, handleUploadErrors } from "../middleware/upload"
import {
  createDisputeSchema,
  updateDisputeSchema,
  adminUpdateDisputeSchema,
  disputeQuerySchema,
  addCommunicationSchema,
  eventIdSchema,
} from "../dto/dispute.dto"

const router = Router()
const disputeController = new DisputeController()

// Rate limiters
const disputeCreationLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 disputes per hour
  "Too many dispute creation attempts. Please try again later.",
)

const fileUploadLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 file uploads per 15 minutes
  "Too many file upload attempts. Please try again later.",
)

// Apply authentication to all routes
router.use(authenticate)

// User routes
router.post(
  "/",
  disputeCreationLimiter,
  uploadMiddleware.array("evidence", 5),
  handleUploadErrors,
  validateBody(createDisputeSchema),
  disputeController.createDispute,
)

router.get("/", validateQuery(disputeQuerySchema), disputeController.getUserDisputes)

router.get("/notifications", disputeController.getNotifications)

router.patch("/notifications/mark-all-read", disputeController.markAllNotificationsAsRead)

router.patch("/notifications/:notificationId/read", disputeController.markNotificationAsRead)

router.get("/:id", validateParams(eventIdSchema), disputeController.getDisputeById)

router.patch("/:id", validateParams(eventIdSchema), validateBody(updateDisputeSchema), disputeController.updateDispute)

router.delete("/:id", validateParams(eventIdSchema), disputeController.deleteDispute)

router.post(
  "/:id/communication",
  validateParams(eventIdSchema),
  validateBody(addCommunicationSchema),
  disputeController.addCommunication,
)

router.post(
  "/:id/evidence",
  validateParams(eventIdSchema),
  fileUploadLimiter,
  uploadMiddleware.array("files", 5),
  handleUploadErrors,
  disputeController.uploadEvidence,
)

router.post("/:id/escalate", validateParams(eventIdSchema), disputeController.escalateDispute)

// Admin routes
router.get(
  "/admin/all",
  authorize(["admin", "super_admin"]),
  adminReportsLimiter,
  validateQuery(disputeQuerySchema),
  disputeController.getAllDisputes,
)

router.get(
  "/admin/analytics",
  authorize(["admin", "super_admin"]),
  adminReportsLimiter,
  disputeController.getDisputeAnalytics,
)

router.patch(
  "/admin/:id",
  authorize(["admin", "super_admin"]),
  validateParams(eventIdSchema),
  validateBody(adminUpdateDisputeSchema),
  disputeController.adminUpdateDispute,
)

router.post(
  "/admin/:id/assign",
  authorize(["super_admin"]),
  validateParams(eventIdSchema),
  disputeController.assignDispute,
)

router.patch("/admin/bulk-update", authorize(["super_admin"]), disputeController.bulkUpdateDisputes)

export default router
