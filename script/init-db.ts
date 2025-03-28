import "reflect-metadata"
import { AppDataSource } from "../src/config/database"
import { Role } from "../src/entities/role.entity"
import { User } from "../src/entities/user.entity";

async function initializeDatabase() {
  try {
    // Initialize the database connection
    await AppDataSource.initialize()
    console.log("Database connection established")

    const roleRepository = AppDataSource.getRepository(Role)

    // Check if roles already exist
    const existingRoles = await roleRepository.find()
    if (existingRoles.length > 0) {
      console.log("Roles already exist in the database")
      return
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
    })

    // Create moderator role
    const moderatorRole = roleRepository.create({
      name: "moderator",
      permissions: ["user:read", "user:update"],
    })

    // Create event manager role
    const eventManagerRole = roleRepository.create({
      name: "event_manager",
      permissions: [
        "event:create",
        "event:read",
        "event:update",
        "event:delete",
        "poster:create",
        "poster:read",
        "poster:update",
        "poster:delete"
      ],
    })

    // Save roles to database
    await roleRepository.save([adminRole, moderatorRole, eventManagerRole])
    console.log("Roles created successfully")

    // Create a super admin user
    // const userRepository = AppDataSource.getRepository(User);
    
    // // Check if super admin already exists
    // const superAdminExists = await userRepository.findOne({ where: { email: "admin@veritix.com" } });
    
    // if (!superAdminExists) {
    //   // Create super admin user
    //   const superAdmin = userRepository.create({
    //     email: "admin@veritix.com",
    //     firstName: "super",
    //     lastName: "admin",
    //     isActive: true
    //   });
      
    //   await userRepository.save(superAdmin);
    //   console.log("Super admin user created successfully");
    // } else {
    //   console.log("Super admin user already exists");
    // }
    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
  } finally {
    // Close the connection
    await AppDataSource.destroy()
  }
}

// Run the initialization
initializeDatabase()

