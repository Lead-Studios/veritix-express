import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Ticket } from "./entities/ticket.entity"
import type { QrCodeService } from "./qr-code.service"
import type { CreateTicketDto } from "./dto/create-ticket.dto"
import type { EventsService } from "../events/events.service"
import type { UsersService } from "../users/users.service"

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    private qrCodeService: QrCodeService,
    private eventsService: EventsService,
    private usersService: UsersService,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const event = await this.eventsService.findOne(createTicketDto.eventId)
    if (!event) {
      throw new NotFoundException("Event not found")
    }

    const user = await this.usersService.findOne(createTicketDto.userId)
    if (!user) {
      throw new NotFoundException("User not found")
    }

    // Create a new ticket
    const ticket = this.ticketsRepository.create({
      user,
      event,
      isUsed: false,
    })

    // Save the ticket to get an ID
    const savedTicket = await this.ticketsRepository.save(ticket)

    // Generate QR code
    const { qrCodeData } = await this.qrCodeService.generateQrCode(savedTicket.id, event.id, user.id)

    // Update ticket with QR code data
    savedTicket.qrCode = qrCodeData
    return this.ticketsRepository.save(savedTicket)
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      relations: ["user", "event"],
    })
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ["user", "event", "checkIns"],
    })

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`)
    }

    return ticket
  }

  async findByQrCode(qrCode: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { qrCode },
      relations: ["user", "event", "checkIns"],
    })

    if (!ticket) {
      throw new NotFoundException("Invalid QR code")
    }

    return ticket
  }

  async validateTicket(qrCodeData: string): Promise<{ ticket: Ticket; isValid: boolean; message?: string }> {
    // Verify QR code integrity
    const verification = this.qrCodeService.verifyQrCode(qrCodeData)
    if (!verification.isValid) {
      return { ticket: null, isValid: false, message: "Invalid QR code" }
    }

    try {
      // Find the ticket by QR code
      const ticket = await this.findByQrCode(qrCodeData)

      // Check if ticket is already used
      if (ticket.isUsed) {
        return {
          ticket,
          isValid: false,
          message: "Ticket has already been used",
        }
      }

      return { ticket, isValid: true }
    } catch (error) {
      return { ticket: null, isValid: false, message: "Ticket not found" }
    }
  }

  async markAsUsed(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id)

    if (ticket.isUsed) {
      throw new BadRequestException("Ticket has already been used")
    }

    ticket.isUsed = true
    return this.ticketsRepository.save(ticket)
  }

  async getTicketsByEvent(eventId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { event: { id: eventId } },
      relations: ["user", "checkIns"],
    })
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { user: { id: userId } },
      relations: ["event"],
    })
  }
}

