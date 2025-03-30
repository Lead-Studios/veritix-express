import { Request, Response, NextFunction } from "express";
import { EventService } from "../services/event.service";
import type { CreateEventDto, UpdateEventDto } from "../dtos/event.dto";
import { validationResult } from "express-validator";
import { AppDataSource } from "../data-source";
import { Event } from "../entities/event.entity";

const eventRepository = AppDataSource.getRepository(Event);

export class EventController {
  private eventService = new EventService();

  // Create a new event
  createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventData: CreateEventDto = req.body;
      const event = await this.eventService.createEvent(eventData);

      res.status(201).json({
        status: "success",
        message: "Event created successfully",
        data: event,
      });
    } catch (error) {
      console.error("Error creating event:", error);
      next(error);
    }
  };

  // Get all events
  getAllEvents = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await this.eventService.getAllEvents();

      res.status(200).json({
        status: "success",
        data: events,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get event by ID
  getEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const event = await this.eventService.getEventById(id);

      res.status(200).json({
        status: "success",
        data: event,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Event not found") {
        return res.status(404).json({
          status: "error",
          message: "Event not found",
        });
      }
      next(error);
    }
  };

  // Update event
  updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const updateData: UpdateEventDto = req.body;
      const updatedEvent = await this.eventService.updateEvent(id, updateData);

      res.status(200).json({
        status: "success",
        message: "Event updated successfully",
        data: updatedEvent,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Event not found") {
        return res.status(404).json({
          status: "error",
          message: "Event not found",
        });
      }
      next(error);
    }
  };

  // Delete event
  deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      await this.eventService.deleteEvent(id);

      res.status(200).json({
        status: "success",
        message: "Event deleted successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Event not found") {
        return res.status(404).json({
          status: "error",
          message: "Event not found",
        });
      }
      next(error);
    }
  };

  // Archive event
  archiveEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const event = await eventRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!event) {
        res.status(404).json({ message: "Event not found" });
        return;
      }

      event.archived = true;
      await eventRepository.save(event);

      res.status(200).json({ message: "Event archived successfully", event });
    } catch (error) {
      res.status(500).json({ message: "Error archiving event", error });
    }
  };

  // Generate reports
  generateReports = async (req: Request, res: Response): Promise<void> => {
    try {
      // Logic to generate reports based on query parameters (weeks, months, years)
      const { period } = req.query; // Example: 'weekly', 'monthly', 'yearly'

      // const reports = [];
      const reports: Array<{}> = [];

      res
        .status(200)
        .json({ message: "Reports generated successfully", reports });
    } catch (error) {
      res.status(500).json({ message: "Error generating reports", error });
    }
  };
}

// Export controller instance for router
const eventController = new EventController();
export const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  archiveEvent,
  generateReports,
} = eventController;
