import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import type { CreateEventDto, UpdateEventDto } from '../dtos/event.dto';

export class EventController {
  private eventService = new EventService();

  // Create a new event
  createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventData: CreateEventDto = req.body;
      const event = await this.eventService.createEvent(eventData);
      
      res.status(201).json({ 
        status: 'success', 
        message: 'Event created successfully', 
        data: event 
      });
    } catch (error) {
      console.error('Error creating event:', error);
      next(error);
    }
  };

  // Get all events
  getAllEvents = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await this.eventService.getAllEvents();
      
      res.status(200).json({ 
        status: 'success', 
        data: events 
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
        status: 'success', 
        data: event 
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Event not found") {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Event not found' 
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
        status: 'success', 
        message: 'Event updated successfully', 
        data: updatedEvent 
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Event not found") {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Event not found' 
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
        status: 'success', 
        message: 'Event deleted successfully' 
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Event not found") {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Event not found' 
        });
      }
      next(error);
    }
  };
}

// Export controller instance for router
const eventController = new EventController();
export const { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent } = eventController;
