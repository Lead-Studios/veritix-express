import { Router } from "express"
import { UserController } from "../controllers/user.controller"
import { authenticate, authorize } from "../middleware/auth.middleware"
import { GetUsersQueryDto, GetUserReportsQueryDto, UserParamDto } from "../dtos/user.dto"
import { validateQueryDto } from "../middlewares/validateQuery.middleware"
import { validateParamDto } from "../middlewares/validateParam.middleware"

const router = Router()
const userController = new UserController()

// Get all users
router.get(
  "/users",
  authenticate,
  authorize(["user:read"]),
  validateQueryDto(GetUsersQueryDto),
  userController.getAllUsers,
)

// Get user by ID
router.get(
  "/users/:id",
  authenticate,
  authorize(["user:read"]),
  validateParamDto(UserParamDto),
  userController.getUserById,
)

// Generate user reports
router.get(
  "/user-reports",
  authenticate,
  authorize(["user:read", "report:generate"]),
  validateQueryDto(GetUserReportsQueryDto),
  userController.generateUserReports,
)

export default router

