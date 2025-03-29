import { Controller, Get, Post, Body, Param, UseGuards, Request } from "@nestjs/common"
import type { CheckInsService } from "./check-ins.service"
import type { CreateCheckInDto } from "./dto/create-check-in.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"

@Controller("check-ins")
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "organizer")
  create(@Body() createCheckInDto: CreateCheckInDto, @Request() req) {
    // Use the authenticated user as the scanner
    return this.checkInsService.create({
      ...createCheckInDto,
      scannedById: req.user.id,
    })
  }

  @Post("sync-offline")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "organizer")
  syncOfflineCheckIns(@Body() offlineCheckIns: CreateCheckInDto[], @Request() req) {
    // Set the authenticated user as the scanner for all offline check-ins
    const checkInsWithScanner = offlineCheckIns.map((checkIn) => ({
      ...checkIn,
      scannedById: req.user.id,
    }))

    return this.checkInsService.syncOfflineCheckIns(checkInsWithScanner)
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  findAll() {
    return this.checkInsService.findAll()
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizer')
  findOne(@Param('id') id: string) {
    return this.checkInsService.findOne(id);
  }

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizer')
  getCheckInsByEvent(@Param('eventId') eventId: string) {
    return this.checkInsService.getCheckInsByEvent(eventId);
  }

  @Get('event/:eventId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizer')
  getCheckInStats(@Param('eventId') eventId: string) {
    return this.checkInsService.getCheckInStats(eventId);
  }
}

