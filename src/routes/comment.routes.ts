import express from "express"
import { getComment, updateComment, deleteComment, replyToComment } from "../controllers/comment.controller"
import { protect } from "../middleware/auth.middleware"

const router = express.Router()

// Public routes
router.get("/:id", getComment)

// Protected routes
router.use(protect)

router.put("/:id", updateComment)
router.delete("/:id", deleteComment)
router.post("/:id/reply", replyToComment)

export default router
