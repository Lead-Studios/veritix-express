import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access Denied. No token provided' });
    return; // Ensure function execution stops
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
};
