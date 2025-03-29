import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extending the Request interface to include 'user'
interface CustomRequest extends Request {
	user?: any; // Define 'user' as per your JWT payload
}

export const authenticateJWT = (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const token = req.header("x-auth-token");
	if (!token) return res.status(403).send("Access denied");

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!);
		req.user = decoded; // Store the decoded user information in the request
		next();
	} catch (err) {
		res.status(400).send("Invalid token");
	}
};

export default authenticateJWT;
