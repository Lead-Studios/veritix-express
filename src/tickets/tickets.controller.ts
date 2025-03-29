import { Controller, Get, Post, Body, Param, UseGuards, Request } from "@nestjs/common"
import type { TicketsService } from "./tickets.service"
import type { CreateTicketDto } from "./dto/create-ticket.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import type { QrCodeService } from "./qr-code.service"

@Controller("tickets")
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createTicketDto: CreateTicketDto) {
    const ticket = await this.ticketsService.create(createTicketDto);
    
    // Generate QR code URL for the response
    const { qrCodeUrl } = await this.qrCodeService.generateQrCode(
      ticket.id,
      ticket.event.id,
      ticket.user.id,
    );
    
    return {
      ...ticket,
      qrCodeUrl,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "organizer")
  findAll() {
    return this.ticketsService.findAll()
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get("user/:userId")
  @UseGuards(JwtAuthGuard)
  getTicketsByUser(@Param('userId') userId: string, @Request() req) {
    // Check if user is requesting their own tickets or is an admin
    if (req.user.id !== userId && req.user.role !== "admin") {
      return { error: "Unauthorized" }
    }

    return this.ticketsService.getTicketsByUser(userId)
  }

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizer')
  getTicketsByEvent(@Param('eventId') eventId: string) {
    return this.ticketsService.getTicketsByEvent(eventId);
  }
}

