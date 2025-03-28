import fs from "fs"
import { AppDataSource } from "../config/database"
import { Poster } from "../entities/poster.entity"
import { Event } from "../entities/event.entity"
import type { CreatePosterDto, UpdatePosterDto } from "../dtos/poster.dto"

export class PosterService {
  private posterRepository = AppDataSource.getRepository(Poster)
  private eventRepository = AppDataSource.getRepository(Event)

  async createPoster(file: Express.Multer.File, posterData: CreatePosterDto): Promise<Poster> {
    // Check if event exists
    const event = await this.eventRepository.findOne({
      where: { id: posterData.eventId }
    })

    if (!event) {
      // Delete uploaded file
      fs.unlinkSync(file.path)
      throw new Error("Event not found")
    }

    // Create poster record
    const poster = this.posterRepository.create({
      posterImage: file.filename,
      mimetype: file.mimetype,
      path: file.path,
      size: file.size,
      description: posterData.description,
      eventId: posterData.eventId,
    })

    return this.posterRepository.save(poster)
  }

  async getAllPosters(): Promise<Poster[]> {
    return this.posterRepository.find({
      relations: ["event"],
    })
  }

  async getPosterById(id: string): Promise<Poster> {
    const poster = await this.posterRepository.findOne({
      where: { id },
      relations: ["event"],
    })

    if (!poster) {
      throw new Error("Poster not found")
    }

    return poster
  }

  async getPostersByEventId(eventId: number): Promise<Poster[]> {
    // Check if event exists
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    })

    if (!event) {
      throw new Error("Event not found")
    }

    return this.posterRepository.find({
      where: { eventId },
    })
  }

  async updatePoster(id: string, updateData: UpdatePosterDto): Promise<Poster> {
    console.log("Update data received:", updateData);
    
    const poster = await this.posterRepository.findOne({
      where: { id },
    })

    if (!poster) {
      throw new Error("Poster not found")
    }

    console.log("Original poster:", poster);

    // If eventId is provided, check if event exists
    if (updateData.eventId) {
      const event = await this.eventRepository.findOne({
        where: { id: updateData.eventId },
      })

      if (!event) {
        throw new Error("Event not found")
      }
    }

    // Update poster fields explicitly
    if (updateData.description !== undefined) {
      poster.description = updateData.description;
    }
    
    if (updateData.eventId !== undefined) {
      poster.eventId = updateData.eventId;
    }
    
    if (updateData.isActive !== undefined) {
      poster.isActive = updateData.isActive;
    }
    
    console.log("Updated poster before save:", poster);
    
    // Save the changes
    const updatedPoster = await this.posterRepository.save(poster);
    console.log("Poster after save:", updatedPoster);
    
    return updatedPoster;
  }

  async deletePoster(id: string): Promise<void> {
    const poster = await this.posterRepository.findOne({
      where: { id },
    })

    if (!poster) {
      throw new Error("Poster not found")
    }

    // Delete file from filesystem
    const filePath = poster.path
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Delete from database
    await this.posterRepository.remove(poster)
  }
}
