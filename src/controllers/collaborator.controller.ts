import { Request, Response } from "express";
import collaboratorService from "../services/collaborator.service";
import {
  CreateCollaboratorDTO,
  UpdateCollaboratorDTO,
} from "../dtos/collaborator.dto";

class CollaboratorController {
  async createCollaborator(req: Request, res: Response) {
    try {
      const dto: CreateCollaboratorDTO = req.body;
      const collaborator = await collaboratorService.createCollaborator(dto);
      res.status(201).json(collaborator);
    } catch (error) {
      res
        .status(400)
        .json({
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
    }
  }

  async getAllCollaborators(req: Request, res: Response) {
    try {
      const collaborators = await collaboratorService.getAllCollaborators();
      res.json(collaborators);
    } catch (error) {
      res
        .status(400)
        .json({
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
    }
  }

  async getCollaboratorById(req: Request, res: Response) {
    try {
      const collaborator = await collaboratorService.getCollaboratorById(
        req.params.id
      );
      if (!collaborator) {
        return res.status(404).json({ message: "Collaborator not found" });
      }
      res.json(collaborator);
    } catch (error) {
      res
        .status(400)
        .json({
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
    }
  }

  async getCollaboratorsForEvent(req: Request, res: Response) {
    try {
      const collaborators = await collaboratorService.getCollaboratorsForEvent(
        req.params.eventId
      );
      res.json(collaborators);
    } catch (error) {
      res
        .status(400)
        .json({
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
    }
  }

  async updateCollaborator(req: Request, res: Response) {
    try {
      const dto: UpdateCollaboratorDTO = req.body;
      const collaborator = await collaboratorService.updateCollaborator(
        req.params.id,
        dto
      );
      if (!collaborator) {
        return res.status(404).json({ message: "Collaborator not found" });
      }
      res.json(collaborator);
    } catch (error) {
      res
        .status(400)
        .json({
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
    }
  }

  async deleteCollaborator(req: Request, res: Response) {
    try {
      const collaborator = await collaboratorService.deleteCollaborator(
        req.params.id
      );
      if (!collaborator) {
        return res.status(404).json({ message: "Collaborator not found" });
      }
      res.json({ message: "Collaborator removed successfully" });
    } catch (error) {
      res
        .status(400)
        .json({
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
    }
  }
}

export default new CollaboratorController();
