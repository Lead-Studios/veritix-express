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
