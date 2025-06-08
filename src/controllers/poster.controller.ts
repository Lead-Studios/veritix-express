import type { Response } from "express"
import { PosterService } from "../services/poster.service"
import type { AuthRequest, CreatePosterDTO, UpdatePosterDTO } from "../types/poster.types"

export class PosterController {
  private posterService: PosterService

  constructor() {
    this.posterService = new PosterService()
  }

  async createPoster(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Poster image is required" })
        return
      }

      const posterData: CreatePosterDTO = {
        description: req.body.description,
        eventId: req.body.eventId,
      }

      const imageUrl = `/uploads/posters/${req.file.filename}`
      const uploadedBy = req.user!.id

      const poster = await this.posterService.createPoster(posterData, imageUrl, uploadedBy)

      res.status(201).json({
        message: "Poster created successfully",
        poster,
      })
    } catch (error) {
      console.error("Error creating poster:", error)
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      })
    }
  }

  async getAllPosters(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 10

      const result = await this.posterService.getAllPosters(page, limit)

      res.json({
        message: "Posters retrieved successfully",
        ...result,
      })
    } catch (error) {
      console.error("Error retrieving posters:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }

  async getPosterById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const poster = await this.posterService.getPosterById(id)

      if (!poster) {
        res.status(404).json({ error: "Poster not found" })
        return
      }

      res.json({
        message: "Poster retrieved successfully",
        poster,
      })
    } catch (error) {
      console.error("Error retrieving poster:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }

  async getPostersByEventId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params
      const posters = await this.posterService.getPostersByEventId(eventId)

      res.json({
        message: "Event posters retrieved successfully",
        posters,
        count: posters.length,
      })
    } catch (error) {
      console.error("Error retrieving event posters:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }

  async updatePoster(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const updateData: UpdatePosterDTO = req.body
      const userId = req.user!.id

      const poster = await this.posterService.updatePoster(id, updateData, userId)

      if (!poster) {
        res.status(404).json({ error: "Poster not found" })
        return
      }

      res.json({
        message: "Poster updated successfully",
        poster,
      })
    } catch (error) {
      console.error("Error updating poster:", error)
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      })
    }
  }

  async deletePoster(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = req.user!.id

      const deleted = await this.posterService.deletePoster(id, userId)

      if (!deleted) {
        res.status(404).json({ error: "Poster not found" })
        return
      }

      res.json({ message: "Poster deleted successfully" })
    } catch (error) {
      console.error("Error deleting poster:", error)
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      })
    }
  }
}
