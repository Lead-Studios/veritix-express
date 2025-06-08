import express from "express"
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  verifyEmail,
} from "../controllers/user.controller"
import { protect } from "../middleware/auth.middleware"
import { validateUser, validateLogin } from "../middleware/validation.middleware"

const router = express.Router()

// Public routes
router.post("/register", validateUser, register)
router.post("/login", validateLogin, login)
router.get("/logout", logout)
router.post("/forgot-password", forgotPassword)
router.put("/reset-password/:resettoken", resetPassword)
router.get("/verify-email/:token", verifyEmail)

// Protected routes
router.use(protect)

router.get("/me", getMe)
router.put("/update-details", updateDetails)
router.put("/update-password", updatePassword)

export default router
