import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Organizer } from "../entities/organizer.entity"; // Ensure correct path

export class OrganizerController {
	static async createOrganizer(req: Request, res: Response) {
		try {
			const { name, email } = req.body;

			const organizerRepo = AppDataSource.getRepository(Organizer);

			const newOrganizer = organizerRepo.create({ name, email });

			await organizerRepo.save(newOrganizer);

			res.status(201).json({
				message: "Organizer created successfully",
				organizer: newOrganizer,
			});
		} catch (err: any) {
			res.status(500).json({
				message: "Error creating organizer",
				error: err.message,
			});
		}
	}

	static async getAllOrganizers(req: Request, res: Response) {
		try {
			const organizerRepo = AppDataSource.getRepository(Organizer);

			const organizers = await organizerRepo.find();

			res.status(200).json(organizers);
		} catch (err: any) {
			res.status(500).json({
				message: "Error fetching organizers",
				error: err.message,
			});
		}
	}

	static async getOrganizerById(req: Request, res: Response) {
		try {
			const { id } = req.params;

			const organizerRepo = AppDataSource.getRepository(Organizer);

			const organizer = await organizerRepo.findOneBy({
				id: Number(id),
			});

			if (!organizer) {
				return res.status(404).json({
					message: "Organizer not found",
				});
			}

			res.status(200).json(organizer);
		} catch (err: any) {
			res.status(500).json({
				message: "Error fetching organizer",
				error: err.message,
			});
		}
	}

	static async updateOrganizer(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { name, email } = req.body;

			const organizerRepo = AppDataSource.getRepository(Organizer);

			const organizer = await organizerRepo.findOneBy({
				id: Number(id),
			});

			if (!organizer) {
				return res.status(404).json({
					message: "Organizer not found",
				});
			}

			organizer.name = name || organizer.name;
			organizer.email = email || organizer.email;

			await organizerRepo.save(organizer);

			res.status(200).json({
				message: "Organizer updated successfully",
				organizer,
			});
		} catch (err: any) {
			res.status(500).json({
				message: "Error updating organizer",
				error: err.message,
			});
		}
	}

	static async deleteOrganizer(req: Request, res: Response) {
		try {
			const { id } = req.params;

			const organizerRepo = AppDataSource.getRepository(Organizer);

			const organizer = await organizerRepo.findOneBy({
				id: Number(id),
			});

			if (!organizer) {
				return res.status(404).json({
					message: "Organizer not found",
				});
			}

			await organizerRepo.remove(organizer);

			res.status(204).json({
				message: "Organizer deleted successfully",
			});
		} catch (err: any) {
			res.status(500).json({
				message: "Error deleting organizer",
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
