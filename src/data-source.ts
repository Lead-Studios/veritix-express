import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "express_db",
  synchronize: true, // ⚠️ Automatically syncs schema (use cautiously in production)
  logging: true,
  entities: ["src/entities/*.ts"], // Entities folder
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
});
