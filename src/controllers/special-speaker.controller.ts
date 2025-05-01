import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { SpecialSpeaker } from "../entities/special-speaker.entity";
import { Organizer } from "../entities/organizer.entity"; // Make sure Organizer is imported
import { Conference } from "../entities/conference.entity";

export class SpecialSpeakerController {
	static async create(req: Request, res: Response) {
		try {
			const { name, conferenceId, facebook, twitter, instagram } =
				req.body;

			// Get the repository for SpecialSpeaker and Conference
			const speakerRepo = AppDataSource.getRepository(SpecialSpeaker);
			const conferenceRepo = AppDataSource.getRepository(Conference);

			// Fetch the Conference entity using the conferenceId from the request body
			const conference = await conferenceRepo.findOne({
				where: { id: conferenceId },
			});

			if (!conference) {
				return res
					.status(404)
					.json({ message: "Conference not found" });
			}

			// Create the new speaker and associate the full Conference object
			const newSpeaker = speakerRepo.create({
				name,
				conference, // Use the full Conference object here
				facebook,
				twitter,
				instagram,
			});

			// Save the new speaker to the database
			await speakerRepo.save(newSpeaker);
			res.status(201).json(newSpeaker);
		} catch (err: any) {
			res.status(500).json({
				message: "Error creating special speaker",
				error: err.message,
			});
		}
	}

	static async getAll(req: Request, res: Response) {
		try {
			const speakerRepo = AppDataSource.getRepository(SpecialSpeaker);
			const speakers = await speakerRepo.find();
			res.status(200).json(speakers);
		} catch (err: any) {
			res.status(500).json({
				message: "Error fetching special speakers",
				error: err.message,
			});
		}
	}

	static async getById(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const speakerRepo = AppDataSource.getRepository(SpecialSpeaker);
			const speaker = await speakerRepo.findOneBy({ id: Number(id) });

			if (!speaker) {
				return res
					.status(404)
					.json({ message: "Special speaker not found" });
			}
			res.status(200).json(speaker);
		} catch (err: any) {
			res.status(500).json({
				message: "Error fetching special speaker",
				error: err.message,
			});
		}
	}

	static async getByConferenceId(req: Request, res: Response) {
		try {
			const { conferenceId } = req.params;
			const speakerRepo = AppDataSource.getRepository(SpecialSpeaker);
			const speakers = await speakerRepo.find({
				where: { conference: { id: Number(conferenceId) } }, // ✅ correct
			});

			res.status(200).json(speakers);
		} catch (err: any) {
			res.status(500).json({
				message: "Error fetching special speakers",
				error: err.message,
			});
		}
	}

	static async update(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { name, facebook, twitter, instagram } = req.body;
			const speakerRepo = AppDataSource.getRepository(SpecialSpeaker);

			const speaker = await speakerRepo.findOneBy({ id: Number(id) });
			if (!speaker) {
				return res
					.status(404)
					.json({ message: "Special speaker not found" });
			}

			speaker.name = name || speaker.name;
			speaker.facebook = facebook || speaker.facebook;
			speaker.twitter = twitter || speaker.twitter;
			speaker.instagram = instagram || speaker.instagram;

			await speakerRepo.save(speaker);
			res.status(200).json(speaker);
		} catch (err: any) {
			res.status(500).json({
				message: "Error updating special speaker",
				error: err.message,
			});
		}
	}

	static async delete(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const speakerRepo = AppDataSource.getRepository(SpecialSpeaker);

			const speaker = await speakerRepo.findOneBy({ id: Number(id) });
			if (!speaker) {
				return res
					.status(404)
					.json({ message: "Special speaker not found" });
			}

			await speakerRepo.remove(speaker);
			res.status(204).json({ message: "Special speaker deleted" });
		} catch (err: any) {
			res.status(500).json({
				message: "Error deleting special speaker",
				error: err.message,
			});
		}
	}

	// Add the Organizer methods here
	static async createOrganizer(req: Request, res: Response) {
		try {
			const { name, email } = req.body;
			const organizerRepo = AppDataSource.getRepository(Organizer); // Use the repository to create and save
			const newOrganizer = organizerRepo.create({ name, email });
			await organizerRepo.save(newOrganizer);
			res.status(201).json(newOrganizer);
		} catch (err: any) {
			res.status(500).json({
				message: "Error creating organizer",
				error: err.message,
			});
		}
	}

	static async getAllOrganizers(req: Request, res: Response) {
		try {
			const organizerRepo = AppDataSource.getRepository(Organizer); // Access through the repository
			const organizers = await organizerRepo.find();
			res.status(200).json(organizers);
		} catch (err: any) {
			res.status(500).json({
				message: "Error fetching organizers",
				error: err.message,
			});
		}
	}

	static async restrictedRoute(req: Request, res: Response) {
		res.status(200).json({
			message: "Welcome, organizer! You have access to this route.",
		});
	}
}
