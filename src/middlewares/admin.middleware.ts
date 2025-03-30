import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { AppDataSource } from "../config/database"
import { Admin } from "../entities/admin.entity"

declare global {
  namespace Express {
    interface Request {
      admin?: Admin
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number }

    const adminRepository = AppDataSource.getRepository(Admin)
    const admin = await adminRepository.findOne({
      where: { id: decoded.id },
      relations: ["role"],
    })

    if (!admin) {
      return res.status(401).json({
        status: "error",
        message: "Invalid authentication token",
      })
    }

    req.admin = admin
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: "error",
        message: "Token expired",
      })
    }

    return res.status(401).json({
      status: "error",
      message: "Authentication failed",
    })
  }
}

export const authorize = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin || !req.admin.role) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Missing role information",
      })
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      req.admin?.role.permissions.includes(permission),
    )

    if (!hasAllPermissions) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Insufficient permissions",
      })
    }

    next()
  }
}

