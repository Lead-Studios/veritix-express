import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
	user?: { role?: string };
}

// Middleware to check if the user's role is one of the allowed roles
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

// Middleware to check if the user's role matches the required role
export function checkRole(role: string) {
	return (req: AuthRequest, res: Response, next: NextFunction) => {
		const userRole = req.user?.role;
		if (userRole !== role) {
			return res.status(403).json({
				message: "You do not have permission to perform this action",
			});
		}
		next();
	};
}

export default roleMiddleware;
