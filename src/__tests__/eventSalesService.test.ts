import mongoose from "mongoose"
import { EventSalesService } from "../services/eventSalesService"
import Event from "../models/Event"
import Ticket from "../models/Ticket"
import User from "../models/User"

describe("EventSalesService", () => {
  let eventSalesService: EventSalesService
  let testEvent: any
  let testUser: any

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/event-sales-test")
    eventSalesService = new EventSalesService()
  })

  beforeEach(async () => {
    await User.deleteMany({})
    await Event.deleteMany({})
    await Ticket.deleteMany({})

    testUser = await User.create({
      email: "test@test.com",
      password: "password123",
      role: "user",
    })

    testEvent = await Event.create({
      title: "Test Event",
      description: "Test Description",
      date: new Date("2024-12-31"),
      venue: "Test Venue",
      totalTickets: 100,
      availableTickets: 50,
      ticketPrice: 25.0,
    })

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
        price: 30.0,
        quantity: 1,
        status: "active",
      },
    ])
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe("getAllEventSales", () => {
    it("should return paginated event sales", async () => {
      const result = await eventSalesService.getAllEventSales(1, 10)

      expect(result.sales).toHaveLength(1)
      expect(result.page).toBe(1)
      expect(result.total).toBe(1)
      expect(result.sales[0].eventTitle).toBe("Test Event")
      expect(result.sales[0].totalTicketsSold).toBe(3)
      expect(result.sales[0].totalRevenue).toBe(80) // (25*2) + (30*1)
    })
  })

  describe("getEventSales", () => {
    it("should return sales for specific event", async () => {
      const result = await eventSalesService.getEventSales(testEvent._id.toString())

      expect(result).toBeTruthy()
      expect(result!.eventTitle).toBe("Test Event")
      expect(result!.totalTicketsSold).toBe(3)
      expect(result!.totalRevenue).toBe(80)
      expect(result!.salesCount).toBe(2)
    })

    it("should return null for non-existent event", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const result = await eventSalesService.getEventSales(fakeId)

      expect(result).toBeNull()
    })
  })

  describe("generateSalesReport", () => {
    it("should generate monthly sales report", async () => {
      const result = await eventSalesService.generateSalesReport({ timeframe: "monthly" })

      expect(result.timeframe).toBe("monthly")
      expect(result.totalRevenue).toBe(80)
      expect(result.totalTicketsSold).toBe(3)
      expect(result.totalEvents).toBe(1)
      expect(result.events).toHaveLength(1)
    })

    it("should generate weekly sales report", async () => {
      const result = await eventSalesService.generateSalesReport({ timeframe: "weekly" })

      expect(result.timeframe).toBe("weekly")
      expect(result.startDate).toBeInstanceOf(Date)
      expect(result.endDate).toBeInstanceOf(Date)
    })

    it("should sort by top-selling events", async () => {
      const result = await eventSalesService.generateSalesReport({
        timeframe: "monthly",
        sort: "top-selling",
      })

      expect(result.events[0].totalTicketsSold).toBe(3)
    })
  })
})
