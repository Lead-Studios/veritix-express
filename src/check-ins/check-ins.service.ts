import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { CheckIn } from "./entities/check-in.entity"
import type { TicketsService } from "../tickets/tickets.service"
import type { UsersService } from "../users/users.service"
import type { RedisService } from "../redis/redis.service"
import type { CreateCheckInDto } from "./dto/create-check-in.dto"

@Injectable()
export class CheckInsService {
  constructor(
    @InjectRepository(CheckIn)
    private checkInsRepository: Repository<CheckIn>,
    private ticketsService: TicketsService,
    private usersService: UsersService,
    private redisService: RedisService,
  ) {}

  async create(createCheckInDto: CreateCheckInDto): Promise<CheckIn> {
    // Validate the ticket
    const { ticket, isValid, message } = await this.ticketsService.validateTicket(createCheckInDto.qrCodeData)

    if (!isValid) {
      throw new BadRequestException(message)
    }

    // Get the user who is scanning
    const scannedBy = await this.usersService.findOne(createCheckInDto.scannedById)
    if (!scannedBy) {
      throw new NotFoundException("Scanner user not found")
    }

    // Create check-in record
    const checkIn = this.checkInsRepository.create({
      ticket,
      scannedBy,
      location: createCheckInDto.location,
      isOffline: createCheckInDto.isOffline || false,
    })

    // Mark ticket as used
    await this.ticketsService.markAsUsed(ticket.id)

    // Save check-in
    const savedCheckIn = await this.checkInsRepository.save(checkIn)

    // Publish to Redis for real-time updates
    await this.publishCheckInEvent(savedCheckIn, ticket.event.id)

    return savedCheckIn
  }

  async findAll(): Promise<CheckIn[]> {
    return this.checkInsRepository.find({
      relations: ["ticket", "ticket.event", "ticket.user", "scannedBy"],
    })
  }

  async findOne(id: string): Promise<CheckIn> {
    const checkIn = await this.checkInsRepository.findOne({
      where: { id },
      relations: ["ticket", "ticket.event", "ticket.user", "scannedBy"],
    })

    if (!checkIn) {
      throw new NotFoundException(`Check-in with ID ${id} not found`)
    }

    return checkIn
  }

  async getCheckInsByEvent(eventId: string): Promise<CheckIn[]> {
    return this.checkInsRepository.find({
      where: { ticket: { event: { id: eventId } } },
      relations: ["ticket", "ticket.user", "scannedBy"],
    })
  }

  async getCheckInStats(eventId: string): Promise<any> {
    const tickets = await this.ticketsService.getTicketsByEvent(eventId)
    const checkIns = await this.getCheckInsByEvent(eventId)

    return {
      totalTickets: tickets.length,
      checkedIn: checkIns.length,
      percentageCheckedIn: tickets.length > 0 ? (checkIns.length / tickets.length) * 100 : 0,
    }
  }

  private async publishCheckInEvent(checkIn: CheckIn, eventId: string): Promise<void> {
    const checkInData = {
      id: checkIn.id,
      ticketId: checkIn.ticket.id,
      eventId,
      userId: checkIn.ticket.user.id,
      userName: checkIn.ticket.user.name,
      scannedBy: checkIn.scannedBy.name,
      timestamp: checkIn.createdAt,
    }

    await this.redisService.publish("check-in", JSON.stringify(checkInData))

    // Also update stats in Redis
    const stats = await this.getCheckInStats(eventId)
    await this.redisService.set(`event:${eventId}:stats`, JSON.stringify(stats))
  }

  async syncOfflineCheckIns(offlineCheckIns: CreateCheckInDto[]): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const checkInDto of offlineCheckIns) {
      try {
        await this.create({
          ...checkInDto,
          isOffline: true,
        })
        success++
      } catch (error) {
        failed++
      }
    }

    return { success, failed }
  }
}

