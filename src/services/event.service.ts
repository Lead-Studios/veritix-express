import { AppDataSource } from "../config/database"
import { Event } from "../entities/event.entity"
import { Poster } from "../entities/poster.entity" 
import type { CreateEventDto, UpdateEventDto } from "../dtos/event.dto"

export class EventService {
  private eventRepository = AppDataSource.getRepository(Event)
  private posterRepository = AppDataSource.getRepository(Poster)

  async createEvent(eventData: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create(eventData)
    return this.eventRepository.save(event)
  }

  async getAllEvents(): Promise<Event[]> {
    return this.eventRepository.find()
  }

  async getEventById(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['posters']
    })

    if (!event) {
      throw new Error("Event not found")
    }

    return event
  }

  async updateEvent(id: number, updateData: UpdateEventDto): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id }
    })

    if (!event) {
      throw new Error("Event not found")
    }

    Object.assign(event, updateData)
    return this.eventRepository.save(event)
  }

  async deleteEvent(id: number): Promise<void> {
    const event = await this.eventRepository.findOne({
      where: { id }
    })

    if (!event) {
      throw new Error("Event not found")
    }

    // Note: If using CASCADE delete in TypeORM, related posters will be deleted automatically
    // Otherwise, you might need to delete related posters manually
    
    await this.eventRepository.remove(event)
  }
}
