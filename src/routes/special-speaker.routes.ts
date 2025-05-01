import express from "express";
import { authorize } from "../middlewares/auth.middleware";
import roleMiddleware from "../middlewares/role.middleware";
import { validateDto } from "../middlewares/validate.middleware";
import { SpecialSpeakerController } from "../controllers/special-speaker.controller";
import { OrganizerController } from "../controllers/organizer.controller";
import {
	ConferenceParamDto,
	CreateSpecialSpeakerDto,
	SpecialSpeakerParamDto,
	UpdateSpecialSpeakerDto,
} from "../dtos/special-speaker.dto";
import { CreateOrganizerDto } from "../dtos/create-organizer.dto";

const router = express.Router();

// Special Speaker Routes
router.post(
	"/special-speaker",
	authorize,
	roleMiddleware(["organizer"]), // Pass an array of roles for 'organizer'
	validateDto(CreateSpecialSpeakerDto),
	SpecialSpeakerController.create
);

router.get("/special-speaker", authorize, SpecialSpeakerController.getAll);

router.get(
	"/special-speaker/:id",
	authorize,
	validateDto(SpecialSpeakerParamDto),
	SpecialSpeakerController.getById
);

router.get(
	"/conference/:conferenceId/special-speaker",
	authorize,
	validateDto(ConferenceParamDto),
	SpecialSpeakerController.getByConferenceId
);

router.put(
	"/special-speaker/:id",
	authorize,
	roleMiddleware(["organizer"]), // Pass an array of roles for 'organizer'
	validateDto(UpdateSpecialSpeakerDto),
	SpecialSpeakerController.update
);

router.delete(
	"/special-speaker/:id",
	authorize,
	validateDto(SpecialSpeakerParamDto),
	SpecialSpeakerController.delete
);

// Organizer Routes
router.post(
	"/organizer",
	authorize,
	roleMiddleware(["admin"]), // Pass an array of roles for 'admin'
	validateDto(CreateOrganizerDto),
	OrganizerController.createOrganizer
);

router.get(
	"/organizer",
	authorize,
	roleMiddleware(["admin"]), // Pass an array of roles for 'admin'
	OrganizerController.getAllOrganizers
);

export default router;
