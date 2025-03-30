import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { TicketsService } from "./tickets.service"
import { TicketsController } from "./tickets.controller"
import { Ticket } from "./entities/ticket.entity"
import { QrCodeService } from "./qr-code.service"
import { EventsModule } from "../events/events.module"
import { UsersModule } from "../users/users.module"

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), EventsModule, UsersModule],
  controllers: [TicketsController],
  providers: [TicketsService, QrCodeService],
  exports: [TicketsService],
})
export class TicketsModule {}

