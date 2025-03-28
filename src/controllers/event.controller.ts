import { AppDataSource } from '../data-source';
import { Request, Response } from 'express';
import { Event } from '../entities/event.entity';
import { Poster } from '../entities/poster.entity';

const eventRepository = AppDataSource.getRepository(Event);
const posterRepository = AppDataSource.getRepository(Poster);

export const createEvent = async (req: Request, res: Response) => {
  try {
    const event = eventRepository.create(req.body);
    await eventRepository.save(event);
    res.status(201).json({ status: 'success', message: 'Event created successfully', data: event });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error creating event', error });
  }
};

export const getAllEvents = async (_: Request, res: Response) => {
  try {
    const events = await eventRepository.find();
    res.status(200).json({ status: 'success', data: events });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error retrieving events', error });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventRepository.findOne({ 
      where: { id: Number(req.params.id) },
      relations: ['posters'] // Add relation to load posters
    });

    if (!event) {
      res.status(404).json({ status: 'error', message: 'Event not found' });
      return; // Ensure function execution stops
    }

    res.status(200).json({ status: 'success', data: event });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error retrieving event', error });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventRepository.findOne({ where: { id: Number(req.params.id) } });

    if (!event) {
      res.status(404).json({ status: 'error', message: 'Event not found' });
      return;
    }

    Object.assign(event, req.body);
    await eventRepository.save(event);

    res.status(200).json({ status: 'success', message: 'Event updated successfully', data: event });
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error });
  }
};
  
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventRepository.findOne({ where: { id: Number(req.params.id) } });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    await eventRepository.remove(event);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error });
  }
};
