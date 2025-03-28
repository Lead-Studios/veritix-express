import type { Request, Response, NextFunction } from "express"
import { AuthService } from "../services/auth.service"
import { AdminService } from "../services/admin.service"
import type {
  CreateAdminDto,
  LoginAdminDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from "../dtos/admin.dto"

export class AdminController {
  private authService = new AuthService()
  private adminService = new AdminService()

  // Create admin user
  createAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminData: CreateAdminDto = req.body
      const admin = await this.authService.createAdmin(adminData)

      // Remove password from response
      const { password, ...adminWithoutPassword } = admin

      res.status(201).json({
        status: "success",
        data: adminWithoutPassword,
      })
    } catch (error) {
      next(error)
    }
  }

  // Admin login
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loginData: LoginAdminDto = req.body
      const result = await this.authService.login(loginData)

      res.status(200).json({
        status: "success",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  // Forgot password
  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email }: ForgotPasswordDto = req.body
      await this.authService.forgotPassword(email)

      // Always return success even if email doesn't exist (security best practice)
      res.status(200).json({
        status: "success",
        message: "If the email exists, a password reset link has been sent",
      })
    } catch (error) {
      next(error)
    }
  }

  // Reset password
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password }: ResetPasswordDto = req.body
      await this.authService.resetPassword(token, password)

      res.status(200).json({
        status: "success",
        message: "Password has been reset successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  // Refresh token
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken }: RefreshTokenDto = req.body
      const tokens = await this.authService.refreshToken(refreshToken)

      res.status(200).json({
        status: "success",
        data: tokens,
      })
    } catch (error) {
      next(error)
    }
  }

  // Get admin profile
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        })
      }

      const profile = await this.adminService.getProfile(req.admin.id)

      res.status(200).json({
        status: "success",
        data: profile,
      })
    } catch (error) {
      next(error)
    }
  }

  // Upload profile image
  uploadProfileImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        })
      }

      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "No file uploaded",
        })
      }

      const updatedAdmin = await this.adminService.uploadProfileImage(req.admin.id, req.file.filename)

      res.status(200).json({
        status: "success",
        data: updatedAdmin,
      })
    } catch (error) {
      next(error)
    }
  }
}

