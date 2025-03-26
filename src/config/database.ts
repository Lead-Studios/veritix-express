import { DataSource } from "typeorm"
import { RefreshToken } from "../entities/refreshToken.entity"
import { Role } from "../entities/role.entity"
import { Admin } from "../entities/admin.entity"
import { Event } from "../entities/event.entity"
import { Ticket } from "../entities/ticket.entity"

export const AppDataSource = new DataSource({
  type: "postgres", // Change to your database type
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "admin_portal",
  synchronize: process.env.NODE_ENV !== "production", // Don't use in production
  logging: process.env.NODE_ENV !== "production",
  entities: [Admin, Role, RefreshToken, Event, Ticket],
  migrations: ["src/migrations/**/*.ts"],
  subscribers: [],
})

