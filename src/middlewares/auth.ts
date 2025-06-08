import type { Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import User from "../models/User"
import type { AuthRequest } from "../types"

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({ error: "Invalid token." })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: "Invalid token." })
  }
}

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Access denied. User not authenticated." })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." })
    }

    next()
  }
}
