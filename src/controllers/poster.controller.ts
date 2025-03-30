import type { Request, Response, NextFunction } from "express"
import { PosterService } from "../services/poster.service"
import { CreatePosterDto, UpdatePosterDto } from "../dtos/poster.dto"
import { plainToInstance } from "class-transformer"

export class PosterController {
  private posterService = new PosterService()

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

      const savedPoster = await this.posterService.createPoster(req.file, posterData)

      res.status(201).json({
        status: "success",
        data: savedPoster,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "Event not found") {
        return res.status(404).json({
          status: "error",
          message: "Event not found",
        })
      }
      next(error)
    }
  }

  // Get all posters
  getAllPosters = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const posters = await this.posterService.getAllPosters()

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
      const poster = await this.posterService.getPosterById(id)

      res.status(200).json({
        status: "success",
        data: poster,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "Poster not found") {
        return res.status(404).json({
          status: "error",
          message: "Poster not found",
        })
      }
      next(error)
    }
  }

  // Get all posters for a specific event
  getPostersByEventId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params  // Now using 'id' instead of 'eventId'
      const posters = await this.posterService.getPostersByEventId(Number(id))

      res.status(200).json({
        status: "success",
        data: posters,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "Event not found") {
        return res.status(404).json({
          status: "error",
          message: "Event not found",
        })
      }
      next(error)
    }
  }

  // Update poster
  updatePoster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      console.log("Request body:", req.body);
      console.log("Content-Type:", req.headers['content-type']);
      
      let updateData: UpdatePosterDto;
      
      // Handle different content types
      if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        // For form data, do manual conversions
        if (req.body.isActive !== undefined) {
          if (req.body.isActive === 'true' || req.body.isActive === true) {
            req.body.isActive = true;
          } else if (req.body.isActive === 'false' || req.body.isActive === false) {
            req.body.isActive = false;
          }
        }
        
        if (req.body.eventId !== undefined) {
          req.body.eventId = Number(req.body.eventId);
        }
      }
      
      // Transform to DTO class for both JSON and form data
      updateData = plainToInstance(UpdatePosterDto, req.body);
      console.log("Transformed updateData:", updateData);

      const updatedPoster = await this.posterService.updatePoster(id, updateData)

      res.status(200).json({
        status: "success",
        data: updatedPoster,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Poster not found") {
          return res.status(404).json({
            status: "error",
            message: "Poster not found",
          })
        } else if (error.message === "Event not found") {
          return res.status(404).json({
            status: "error",
            message: "Event not found",
          })
        }
      }
      console.error("Error updating poster:", error);
      next(error)
    }
  }

  // Delete poster
  deletePoster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      await this.posterService.deletePoster(id)

      res.status(200).json({
        status: "success",
        message: "Poster deleted successfully",
      })
    } catch (error) {
      if (error instanceof Error && error.message === "Poster not found") {
        return res.status(404).json({
          status: "error",
          message: "Poster not found",
        })
      }
      next(error)
    }
  }
}
