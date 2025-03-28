
import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: { role?: string };
}

export const roleMiddleware = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Access Forbidden" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access Forbidden" });
    }

    next();
  };
};

export function checkRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (userRole !== role) {
      return res
        .status(403)
        .json({ message: "You do not have permission to perform this action" });
    }
    next();
  };
}

import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: { role?: string };
}

const roleMiddleware = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access Forbidden' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access Forbidden' });
    }

    next();
  };
};

export default roleMiddleware;

