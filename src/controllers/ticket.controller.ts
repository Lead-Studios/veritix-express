import { AppDataSource } from "../config/database";
import { Ticket } from "../entities/ticket.entity";
import { Request, Response } from 'express';
import { Event } from "../entities/event.entity";
import { Between, FindOptionsWhere, Like } from 'typeorm';

export class TicketController {
  private static ticketRepository = AppDataSource.getRepository(Ticket);
  private static eventRepository = AppDataSource.getRepository(Event);

  static async createTicket(req: Request, res: Response) {
    try {
        const { name, eventId, quantity, price, description, deadlineDate, isReserved } = req.body;
        
        // Verify event exists
        const event = await TicketController.eventRepository.findOneBy({ id: eventId });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const ticketData = {
            name,
            eventId,
            quantity,
            price,
            description,
            deadlineDate,
            isReserved
        };

        const ticket = TicketController.ticketRepository.create(ticketData);
        const savedTicket = await TicketController.ticketRepository.save(ticket);
        return res.status(201).json(savedTicket);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: errorMessage });
    }
  }

  static async getAllTickets(req: Request, res: Response) {
    try {
        const { eventId, search, minPrice, maxPrice } = req.query;
        const where: FindOptionsWhere<Ticket> = {};
  
        if (eventId) {
          where.eventId = Number(eventId);
        }
  
        if (search) {
          where.name = Like(`%${search}%`);
        }
  
        if (minPrice || maxPrice) {
          where.price = Between(
            minPrice ? Number(minPrice) : 0,
            maxPrice ? Number(maxPrice) : Number.MAX_SAFE_INTEGER
          );
        }
  
        const tickets = await TicketController.ticketRepository.find({
          where,
          relations: ['event'],
          order: { createdAt: 'DESC' }
        });
  
        return res.status(200).json(tickets);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: errorMessage });
      }
  }

  static async getTicketById(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const ticket = await TicketController.ticketRepository.findOne({
          where: { id },
          relations: ['event']
        });
  
        if (!ticket) {
          return res.status(404).json({ error: 'Ticket not found' });
        }
  
        return res.status(200).json(ticket);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: errorMessage });
      }
  }

  static async getTicketsByEvent(req: Request, res: Response) {
    try {
      const eventId = Number(req.params.eventId);
      const tickets = await TicketController.ticketRepository.find({
        where: { eventId },
        order: { price: 'ASC' }
      });

      return res.status(200).json(tickets);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: errorMessage });
    }
  }

  static async updateTicket(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const updateData = req.body;

      // Verify ticket exists
      const existingTicket = await TicketController.ticketRepository.findOne({
        where: { id },
      });

      if (!existingTicket) {
        return res.status(404).json({ error: 'Ticket not found or unauthorized' });
      }

      // Handle eventId change if provided
      if (updateData.eventId) {
        const event = await TicketController.eventRepository.findOneBy({ id: updateData.eventId });
        if (!event) {
          return res.status(404).json({ error: 'Event not found' });
        }
        existingTicket.event = event;
        existingTicket.eventId = event.id;
      }

      // Update other fields
      Object.assign(existingTicket, updateData);

      // Explicitly handle date fields
      if (updateData.deadlineDate) {
        existingTicket.deadlineDate = new Date(updateData.deadlineDate);
      }

      const result = await TicketController.ticketRepository.save(existingTicket);
      return res.status(200).json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: errorMessage });
    }
  }

  static async deleteTicket(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
  
        // Verify ticket exists
        const ticket = await TicketController.ticketRepository.findOne({
          where: { id },
        });
  
        if (!ticket) {
          return res.status(404).json({ error: 'Ticket not found or unauthorized' });
        }
  
        await TicketController.ticketRepository.remove(ticket);
        return res.status(204).json({ message: 'Ticket deleted successfully' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: errorMessage });
      }
  }
}
