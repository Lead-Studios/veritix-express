import request from "supertest"
import mongoose from "mongoose"
import app from "../server"
import User from "../models/User"
import Event from "../models/Event"
import Ticket from "../models/Ticket"
import jwt from "jsonwebtoken"

describe("Event Sales Controller", () => {
  let adminToken: string
  let userToken: string
  let testEvent: any
  let testUser: any

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/event-sales-test")
  })

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({})
    await Event.deleteMany({})
    await Ticket.deleteMany({})

    // Create test admin user
    const adminUser = await User.create({
      email: "admin@test.com",
      password: "password123",
      role: "admin",
    })

    // Create test regular user
    testUser = await User.create({
      email: "user@test.com",
      password: "password123",
      role: "user",
    })

    // Create test event
    testEvent = await Event.create({
      title: "Test Event",
      description: "Test Description",
      date: new Date("2024-12-31"),
      venue: "Test Venue",
      totalTickets: 100,
      availableTickets: 50,
      ticketPrice: 25.0,
    })

    // Create test tickets
    await Ticket.create([
      {
        eventId: testEvent._id,
        userId: testUser._id,
        price: 25.0,
        quantity: 2,
        status: "active",
      },
      {
        eventId: testEvent._id,
        userId: testUser._id,
        price: 25.0,
        quantity: 1,
        status: "active",
      },
    ])

    // Generate tokens
    adminToken = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET!)
    userToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET!)
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe("GET /admin/event-sales", () => {
    it("should return all event sales for admin", async () => {
      const response = await request(app)
        .get("/admin/event-sales")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.sales).toHaveLength(1)
      expect(response.body.data.sales[0].eventTitle).toBe("Test Event")
      expect(response.body.data.sales[0].totalTicketsSold).toBe(3)
      expect(response.body.data.sales[0].totalRevenue).toBe(75)
    })

    it("should deny access to regular users", async () => {
      await request(app).get("/admin/event-sales").set("Authorization", `Bearer ${userToken}`).expect(403)
    })

    it("should deny access without token", async () => {
      await request(app).get("/admin/event-sales").expect(401)
    })
  })

  describe("GET /admin/event-sales/:eventId", () => {
    it("should return sales for specific event", async () => {
      const response = await request(app)
        .get(`/admin/event-sales/${testEvent._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.eventTitle).toBe("Test Event")
      expect(response.body.data.totalTicketsSold).toBe(3)
      expect(response.body.data.totalRevenue).toBe(75)
    })

    it("should return 404 for non-existent event", async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app).get(`/admin/event-sales/${fakeId}`).set("Authorization", `Bearer ${adminToken}`).expect(404)
    })

    it("should return 400 for invalid event ID", async () => {
      await request(app).get("/admin/event-sales/invalid-id").set("Authorization", `Bearer ${adminToken}`).expect(400)
    })
  })

  describe("GET /admin/event-sales/reports", () => {
    it("should generate monthly sales report", async () => {
      const response = await request(app)
        .get("/admin/event-sales/reports?timeframe=monthly")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.timeframe).toBe("monthly")
      expect(response.body.data.totalRevenue).toBe(75)
      expect(response.body.data.totalTicketsSold).toBe(3)
      expect(response.body.data.events).toHaveLength(1)
    })

    it("should generate weekly sales report", async () => {
      const response = await request(app)
        .get("/admin/event-sales/reports?timeframe=weekly")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.timeframe).toBe("weekly")
    })

    it("should sort by top-selling events", async () => {
      const response = await request(app)
        .get("/admin/event-sales/reports?sort=top-selling")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it("should validate query parameters", async () => {
      await request(app)
        .get("/admin/event-sales/reports?timeframe=invalid")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400)
    })
  })
})
