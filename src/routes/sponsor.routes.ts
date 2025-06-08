import { Router } from "express"
import { sponsorController } from "../controllers/sponsor.controller"
import { authenticateToken, authorize } from "../middleware/auth.middleware"
import { validateRequest, validateQuery } from "../middleware/validation.middleware"
import { upload } from "../middleware/upload.middleware"
import {
  createSponsorSchema,
  updateSponsorSchema,
  sponsorQuerySchema,
  paymentUpdateSchema,
} from "../validation/sponsor.validation"

const router = Router()

// Public routes (with authentication)
router.get("/", authenticateToken, validateQuery(sponsorQuerySchema), sponsorController.getSponsors)

router.get("/stats", authenticateToken, authorize("admin", "manager"), sponsorController.getSponsorStats)

router.get(
  "/expiring-contracts",
  authenticateToken,
  authorize("admin", "manager"),
  sponsorController.getExpiringContracts,
)

router.get("/overdue-payments", authenticateToken, authorize("admin", "manager"), sponsorController.getOverduePayments)

router.get("/event/:eventId", authenticateToken, sponsorController.getSponsorsByEvent)

router.get("/:id", authenticateToken, sponsorController.getSponsor)

// Protected routes (admin/manager only)
router.post(
  "/",
  authenticateToken,
  authorize("admin", "manager"),
  validateRequest(createSponsorSchema),
  sponsorController.createSponsor,
)

router.put(
  "/:id",
  authenticateToken,
  authorize("admin", "manager"),
  validateRequest(updateSponsorSchema),
  sponsorController.updateSponsor,
)

router.delete("/:id", authenticateToken, authorize("admin"), sponsorController.deleteSponsor)

router.post(
  "/:id/logo",
  authenticateToken,
  authorize("admin", "manager"),
  upload.single("logo"),
  sponsorController.uploadLogo,
)

router.patch(
  "/:id/payment",
  authenticateToken,
  authorize("admin", "manager"),
  validateRequest(paymentUpdateSchema),
  sponsorController.updatePaymentStatus,
)

export { router as sponsorRoutes }
