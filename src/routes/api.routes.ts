import express, { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import authenticateJWT from "../authenticateJWT";

const router = express.Router();

// Define the user route with JWT authentication
router.get("/user", authenticateJWT, (req: Request, res: Response) => {
	res.json({ message: "This is a protected API route!", user: req.user });
});

// Define the share route with content validation
router.post(
	"/share",
	[body("content").isLength({ min: 1 }).withMessage("Content is required")],
	(req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { content } = req.body;
		res.json({ message: "Content shared!", content });
	}
);

export default router;
