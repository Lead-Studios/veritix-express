import express from "express"
import { checkInAttendee, getUserEvents, verifyTicket } from "../controllers/attendee.controller"
import { protect } from "../middleware/auth.middleware"

const router = express.Router()

// Protected routes
router.use(protect)

router.get("/my-events", getUserEvents)
router.put("/:id/check-in", checkInAttendee)
router.get("/verify/:ticketNumber", verifyTicket)

export default router
