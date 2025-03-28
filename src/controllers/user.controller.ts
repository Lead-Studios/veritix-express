import type { Request, Response, NextFunction } from "express"
import { UserService } from "../services/user.service"
import type { GetUsersQueryDto, GetUserReportsQueryDto, UserParamDto } from "../dtos/user.dto"

export class UserController {
  private userService = new UserService()

  // Get all users
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: GetUsersQueryDto = req.query as any
      const result = await this.userService.getAllUsers(queryParams)

      res.status(200).json({
        status: "success",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  // Get user by ID
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as unknown as UserParamDto
      const user = await this.userService.getUserById(id)

      res.status(200).json({
        status: "success",
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  // Generate user reports
  generateUserReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: GetUserReportsQueryDto = req.query as any
      const reports = await this.userService.generateUserReports(queryParams)

      res.status(200).json({
        status: "success",
        data: reports,
      })
    } catch (error) {
      next(error)
    }
  }
}

