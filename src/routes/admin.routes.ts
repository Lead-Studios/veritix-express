import { Router } from "express"
import { AdminController } from "../controllers/admin.controller"
import { CreateAdminDto, LoginAdminDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto } from "../dtos/admin.dto"
import { validateDto } from "../middlewares/validate.middleware"
import { authenticate } from "../middlewares/auth.middleware"
import { uploadProfileImage } from "../middlewares/upload.middleware"

const router = Router()
const adminController = new AdminController()

// Public routes
router.post("/create", validateDto(CreateAdminDto), adminController.createAdmin)

router.post("/login", validateDto(LoginAdminDto), adminController.login)

router.post("/forgot-password", validateDto(ForgotPasswordDto), adminController.forgotPassword)

router.post("/reset-password", validateDto(ResetPasswordDto), adminController.resetPassword)

router.post("/refresh-token", validateDto(RefreshTokenDto), adminController.refreshToken)

// Protected routes
router.get("/profile/details", authenticate, adminController.getProfile)

router.post("/upload/profile-image", authenticate, uploadProfileImage, adminController.uploadProfileImage)

export default router

