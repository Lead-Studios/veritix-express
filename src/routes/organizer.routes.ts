// src/routes/organizer.routes.ts
import { Router } from "express";
import { roleMiddleware } from "../middlewares/role.middleware";
import { authenticate } from "../middlewares/admin.middleware";
import { SpecialSpeakerController } from "../controllers/special-speaker.controller";

const router = Router();

// Route to create an organizer
router.post(
	"/organizer",
	authenticate,
	roleMiddleware(["organizer"]),
	SpecialSpeakerController.createOrganizer // ✅ use class name directly
);

// Route to view all organizers
router.get(
	"/organizers",
	authenticate,
	roleMiddleware(["organizer"]),
	SpecialSpeakerController.getAllOrganizers
);

router.get(
	"/restricted",
	authenticate,
	roleMiddleware(["organizer"]),
	SpecialSpeakerController.restrictedRoute
);

export default router;
