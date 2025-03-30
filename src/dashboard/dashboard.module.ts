import { Module } from "@nestjs/common"
import { DashboardGateway } from "./dashboard.gateway"
import { CheckInsModule } from "../check-ins/check-ins.module"
import { RedisModule } from "../redis/redis.module"
import { JwtModule } from "@nestjs/jwt"

@Module({
  imports: [
    CheckInsModule,
    RedisModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
      signOptions: { expiresIn: "1d" },
    }),
  ],
  providers: [DashboardGateway],
})
export class DashboardModule {}

