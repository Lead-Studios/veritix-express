import type { Request, Response, NextFunction } from "express"
import fs from "fs"
import path from "path"
import { AppDataSource } from "../config/database"
import { Poster } from "../entities/poster.entity"
import { Event } from "../entities/event.entity"
import type { CreatePosterDto, UpdatePosterDto } from "../dtos/poster.dto"

export class PosterController {
  private posterRepository = AppDataSource.getRepository(Poster)
  private eventRepository = AppDataSource.getRepository(Event)

  // Upload a new poster
  uploadPoster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "No file uploaded",
        })
      }

      const posterData: CreatePosterDto = req.body

      // Check if event exists
      const event = await this.eventRepository.findOne({ 
        where: { id: posterData.eventId } 
      })

      if (!event) {
        // Delete uploaded file
        fs.unlinkSync(req.file.path)
        
        return res.status(404).json({
          status: "error",
          message: "Event not found",
        })
      }

      // Create poster record
      const poster = this.posterRepository.create({
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        path: req.file.path,
        size: req.file.size,
        description: posterData.description,
        eventId: posterData.eventId,
      })

      const savedPoster = await this.posterRepository.save(poster)

      res.status(201).json({
        status: "success",
        data: savedPoster,
      })
    } catch (error) {
      next(error)
    }
  }

  // Get all posters
  getAllPosters = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const posters = await this.posterRepository.find({
        relations: ["event"],
      })

      res.status(200).json({
        status: "success",
        data: posters,
      })
    } catch (error) {
      next(error)
    }
  }

  // Get poster by ID
  getPosterById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const poster = await this.posterRepository.findOne({
        where: { id },
        relations: ["event"],
      })

      if (!poster) {
        return res.status(404).json({
          status: "error",
          message: "Poster not found",
        })
      }

      res.status(200).json({
        status: "success",
        data: poster,
      })
    } catch (error) {
      next(error)
    }
  }

  // Get all posters for a specific event
  getPostersByEventId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { eventId } = req.params
      
      // Check if event exists
      const event = await this.eventRepository.findOne({
        where: { id: Number(eventId) },
      })

      if (!event) {
        return res.status(404).json({
          status: "error",
          message: "Event not found",
        })
      }

      const posters = await this.posterRepository.find({
        where: { eventId: Number(eventId) },
      })

      res.status(200).json({
        status: "success",
        data: posters,
      })
    } catch (error) {
      next(error)
    }
  }

  // Update poster
  updatePoster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const updateData: UpdatePosterDto = req.body

      const poster = await this.posterRepository.findOne({
        where: { id },
      })

      if (!poster) {
        return res.status(404).json({
          status: "error",
          message: "Poster not found",
        })
      }

      // If eventId is provided, check if event exists
      if (updateData.eventId) {
        const event = await this.eventRepository.findOne({
          where: { id: updateData.eventId },
        })

        if (!event) {
          return res.status(404).json({
            status: "error",
            message: "Event not found",
          })
        }
      }

      // Update poster
      Object.assign(poster, updateData)
      const updatedPoster = await this.posterRepository.save(poster)

      res.status(200).json({
        status: "success",
        data: updatedPoster,
      })
    } catch (error) {
      next(error)
    }
  }

  // Delete poster
  deletePoster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const poster = await this.posterRepository.findOne({
        where: { id },
      })

      if (!poster) {
        return res.status(404).json({
          status: "error",
          message: "Poster not found",
        })
      }

      // Delete file from filesystem
      const filePath = poster.path
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      // Delete from database
      await this.posterRepository.remove(poster)

      res.status(200).json({
        status: "success",
        message: "Poster deleted successfully",
      })
    } catch (error) {
      next(error)
    }
  }
}
