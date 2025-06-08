import { Router } from "express"
import { EventSalesController } from "../controllers/eventSalesController"
import { authenticate, authorize } from "../middleware/auth"
import { adminReportsLimiter } from "../middleware/rateLimiter"
import { validateQuery, validateParams, eventIdSchema, reportsQuerySchema } from "../middleware/validation"

const router = Router()
const eventSalesController = new EventSalesController()

// Apply authentication and authorization to all routes
router.use(authenticate)
router.use(authorize(["super_admin", "admin"]))
router.use(adminReportsLimiter)

// GET /admin/event-sales - Retrieve all event sales
router.get("/", eventSalesController.getAllEventSales)

// GET /admin/event-sales/reports - Generate sales reports
router.get("/reports", validateQuery(reportsQuerySchema), eventSalesController.generateSalesReport)

// GET /admin/event-sales/:eventId - Retrieve sales for specific event
router.get("/:eventId", validateParams(eventIdSchema), eventSalesController.getEventSales)

export default router
