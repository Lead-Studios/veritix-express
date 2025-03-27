"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../src/config/database");
const role_entity_1 = require("../src/entities/role.entity");
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize the database connection
            yield database_1.AppDataSource.initialize();
            console.log("Database connection established");
            const roleRepository = database_1.AppDataSource.getRepository(role_entity_1.Role);
            // Check if roles already exist
            const existingRoles = yield roleRepository.find();
            if (existingRoles.length > 0) {
                console.log("Roles already exist in the database");
                return;
            }
            // Create admin role
            const adminRole = roleRepository.create({
                name: "admin",
                permissions: [
                    "admin:create",
                    "admin:read",
                    "admin:update",
                    "admin:delete",
                    "user:create",
                    "user:read",
                    "user:update",
                    "user:delete",
                ],
            });
            // Create moderator role
            const moderatorRole = roleRepository.create({
                name: "moderator",
                permissions: ["user:read", "user:update"],
            });
            // Save roles to database
            yield roleRepository.save([adminRole, moderatorRole]);
            console.log("Roles created successfully");
            // Create a super admin user
            console.log("Database initialized successfully");
        }
        catch (error) {
            console.error("Error initializing database:", error);
        }
        finally {
            // Close the connection
            yield database_1.AppDataSource.destroy();
        }
    });
}
// Run the initialization
initializeDatabase();
