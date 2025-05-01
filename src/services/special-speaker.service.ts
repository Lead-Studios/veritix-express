import fs from "fs";
import { AppDataSource } from "../config/database";
import { SpecialSpeaker } from "../entities/special-speaker.entity";
import { Conference } from "../entities/conference.entity";
import type {
	CreateSpecialSpeakerDto,
	UpdateSpecialSpeakerDto,
} from "../dtos/special-speaker.dto";

export class SpecialSpeakerService {
	private speakerRepository = AppDataSource.getRepository(SpecialSpeaker);
	private conferenceRepository = AppDataSource.getRepository(Conference);
	async createSpeaker(
		file: Express.Multer.File,
		speakerData: CreateSpecialSpeakerDto
	): Promise<SpecialSpeaker> {
		try {
			// Find the conference by ID from the request
			const conference = await this.conferenceRepository.findOne({
				where: { id: speakerData.conferenceId },
			});

			// If conference is not found, remove the uploaded file and throw an error
			if (!conference) {
				fs.unlinkSync(file.path);
				throw new Error("Conference not found");
			}

			// Create a new speaker with the conference object
			const speaker = this.speakerRepository.create({
				name: speakerData.name,
				image: file.filename, // Ensure that the file is correctly saved with the filename
				conference: conference, // Assign the whole conference object
				facebook: speakerData.facebook,
				twitter: speakerData.twitter,
				instagram: speakerData.instagram,
			});

			// Save and return the created speaker
			return await this.speakerRepository.save(speaker);
		} catch (error: any) {
			console.error(error);
			throw new Error(error.message);
		}
	}

	async getAllSpeakers(): Promise<SpecialSpeaker[]> {
		return this.speakerRepository.find({
			relations: ["conference"],
		});
	}

	async getSpeakerById(id: number): Promise<SpecialSpeaker> {
		const speaker = await this.speakerRepository.findOne({
			where: { id },
			relations: ["conference"],
		});

		if (!speaker) {
			throw new Error("Special Speaker not found");
		}

		return speaker;
	}

	async getSpeakersByConferenceId(
		conferenceId: number
	): Promise<SpecialSpeaker[]> {
		const conference = await this.conferenceRepository.findOne({
			where: { id: conferenceId },
		});

		if (!conference) {
			throw new Error("Conference not found");
		}

		return this.speakerRepository.find({
			where: { conference: conference },
		});
	}

	async updateSpeaker(
		id: number,
		updateData: UpdateSpecialSpeakerDto
	): Promise<SpecialSpeaker> {
		const speaker = await this.speakerRepository.findOne({
			where: { id },
		});

		if (!speaker) {
			throw new Error("Special Speaker not found");
		}

		if (updateData.conference) {
			const conference = await this.conferenceRepository.findOne({
				where: { id: updateData.conference },
			});

			if (!conference) {
				throw new Error("Conference not found");
			}
			speaker.conference = conference;
		}

		// Update fields if provided
		if (updateData.name !== undefined) speaker.name = updateData.name;
		if (updateData.facebook !== undefined)
			speaker.facebook = updateData.facebook;
		if (updateData.twitter !== undefined)
			speaker.twitter = updateData.twitter;
		if (updateData.instagram !== undefined)
			speaker.instagram = updateData.instagram;

		return this.speakerRepository.save(speaker);
	}

	async deleteSpeaker(id: number): Promise<void> {
		const speaker = await this.speakerRepository.findOne({
			where: { id }, // Use number for id
		});

		if (!speaker) {
			throw new Error("Special Speaker not found");
		}

		// Delete file from filesystem
		if (fs.existsSync(speaker.image)) {
			fs.unlinkSync(speaker.image);
		}

		await this.speakerRepository.remove(speaker);
	}
}
