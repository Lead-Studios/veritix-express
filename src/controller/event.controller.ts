import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppDataSource } from "../data-source";
import { Event } from "../model/event.entity";

const eventRepository = AppDataSource.getRepository(Event);

export const createEvent = async (req: Request, res: Response) => {
  try {
    const event = eventRepository.create(req.body);
    await eventRepository.save(event);
    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Error creating event", error });
  }
};

export const getAllEvents = async (_: Request, res: Response) => {
  try {
    const events = await eventRepository.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving events", error });
  }
};

export const getEventById = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  // Validate the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const eventId = Number(req.params.id);

  try {
    // Retrieve the event by ID
    const event = await eventRepository.findOne({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Return the found event
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving event", error });
  }
};

export const updateEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const event = await eventRepository.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    Object.assign(event, req.body);
    await eventRepository.save(event);

    res.status(200).json({ message: "Event updated successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Error updating event", error });
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const event = await eventRepository.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    await eventRepository.remove(event);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting event", error });
  }
};

export const archiveEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const event = await eventRepository.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Logic to archive the event (e.g., setting an 'archived' flag)
    event.archived = true; // Assuming you have an 'archived' field in your Event entity
    await eventRepository.save(event);

    res.status(200).json({ message: "Event archived successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Error archiving event", error });
  }
};

export const generateReports = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Logic to generate reports based on query parameters (weeks, months, years)
    const { period } = req.query; // Example: 'weekly', 'monthly', 'yearly'

    // Implement your report generation logic here
    // const reports = [];
    const reports: Array<{}> = [];

    res
      .status(200)
      .json({ message: "Reports generated successfully", reports });
  } catch (error) {
    res.status(500).json({ message: "Error generating reports", error });
  }
};
