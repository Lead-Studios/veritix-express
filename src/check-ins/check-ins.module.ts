import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CheckInsService } from "./check-ins.service"
import { CheckInsController } from "./check-ins.controller"
import { CheckIn } from "./entities/check-in.entity"
import { TicketsModule } from "../tickets/tickets.module"
import { UsersModule } from "../users/users.module"
import { RedisModule } from "../redis/redis.module"

@Module({
  imports: [TypeOrmModule.forFeature([CheckIn]), TicketsModule, UsersModule, RedisModule],
  controllers: [CheckInsController],
  providers: [CheckInsService],
  exports: [CheckInsService],
})
export class CheckInsModule {}

