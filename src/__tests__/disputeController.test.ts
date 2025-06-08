import request from "supertest"
import mongoose from "mongoose"
import app from "../server"
import User from "../models/User"
import Event from "../models/Event"
import Ticket from "../models/Ticket"
import TicketDispute from "../models/TicketDispute"
import jwt from "jsonwebtoken"
import path from "path"

describe("Dispute Controller", () => {
  let userToken: string
  let adminToken: string
  let testUser: any
  let testAdmin: any
  let testEvent: any
  let testTicket: any

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/dispute-test")
  })

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({})
    await Event.deleteMany({})
    await Ticket.deleteMany({})
    await TicketDispute.deleteMany({})

    // Create test user
    testUser = await User.create({
      email: "user@test.com",
      password: "password123",
      role: "user",
      firstName: "Test",
      lastName: "User",
    })

    // Create test admin
    testAdmin = await User.create({
      email: "admin@test.com",
      password: "password123",
      role: "admin",
      firstName: "Admin",
      lastName: "User",
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

    // Create test ticket
    testTicket = await Ticket.create({
      eventId: testEvent._id,
      userId: testUser._id,
      price: 25.0,
      quantity: 2,
      status: "active",
    })

    // Generate tokens
    userToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET!)
    adminToken = jwt.sign({ userId: testAdmin._id }, process.env.JWT_SECRET!)
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe("POST /user/ticket/dispute", () => {
    it("should create a dispute successfully", async () => {
      const disputeData = {
        ticketId: testTicket._id,
        disputeType: "refund_request",
        subject: "Request refund for cancelled event",
        description: "The event was cancelled and I need a refund",
        priority: "medium",
      }

      const response = await request(app)
        .post("/user/ticket/dispute")
        .set("Authorization", `Bearer ${userToken}`)
        .send(disputeData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.ticketId).toBe(testTicket._id.toString())
      expect(response.body.data.disputeType).toBe("refund_request")
      expect(response.body.data.status).toBe("pending")
    })

    it("should create dispute with file upload", async () => {
      const disputeData = {
        ticketId: testTicket._id,
        disputeType: "technical_issue",
        subject: "Technical issue with ticket",
        description: "Unable to access the event due to technical problems",
      }

      const testImagePath = path.join(__dirname, "fixtures", "test-image.jpg")

      const response = await request(app)
        .post("/user/ticket/dispute")
        .set("Authorization", `Bearer ${userToken}`)
        .field("ticketId", disputeData.ticketId.toString())
        .field("disputeType", disputeData.disputeType)
        .field("subject", disputeData.subject)
        .field("description", disputeData.description)
        .attach("evidence", testImagePath)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.evidence).toHaveLength(1)
    })

    it("should reject dispute for non-owned ticket", async () => {
      const otherUser = await User.create({
        email: "other@test.com",
        password: "password123",
        role: "user",
      })

      const otherTicket = await Ticket.create({
        eventId: testEvent._id,
        userId: otherUser._id,
        price: 25.0,
        quantity: 1,
        status: "active",
      })

      const disputeData = {
        ticketId: otherTicket._id,
        disputeType: "refund_request",
        subject: "Request refund",
        description: "Need refund",
      }

      await request(app)
        .post("/user/ticket/dispute")
        .set("Authorization", `Bearer ${userToken}`)
        .send(disputeData)
        .expect(400)
    })

    it("should reject duplicate disputes", async () => {
      // Create first dispute
      await TicketDispute.create({
        ticketId: testTicket._id,
        userId: testUser._id,
        disputeType: "refund_request",
        subject: "First dispute",
        description: "First dispute description",
        status: "pending",
      })

      const disputeData = {
        ticketId: testTicket._id,
        disputeType: "technical_issue",
        subject: "Second dispute",
        description: "Second dispute description",
      }

      await request(app)
        .post("/user/ticket/dispute")
        .set("Authorization", `Bearer ${userToken}`)
        .send(disputeData)
        .expect(400)
    })

    it("should validate required fields", async () => {
      const invalidData = {
        ticketId: testTicket._id,
        // Missing required fields
      }

      await request(app)
        .post("/user/ticket/dispute")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400)
    })
  })

  describe("GET /user/ticket/dispute", () => {
    beforeEach(async () => {
      // Create test disputes
      await TicketDispute.create([
        {
          ticketId: testTicket._id,
          userId: testUser._id,
          disputeType: "refund_request",
          subject: "Refund request 1",
          description: "Description 1",
          status: "pending",
          priority: "high",
        },
        {
          ticketId: testTicket._id,
          userId: testUser._id,
          disputeType: "technical_issue",
          subject: "Technical issue 1",
          description: "Description 2",
          status: "resolved",
          priority: "medium",
        },
      ])
    })

    it("should get user disputes with pagination", async () => {
      const response = await request(app)
        .get("/user/ticket/dispute?page=1&limit=10")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.disputes).toHaveLength(2)
      expect(response.body.data.total).toBe(2)
      expect(response.body.data.page).toBe(1)
    })

    it("should filter disputes by status", async () => {
      const response = await request(app)
        .get("/user/ticket/dispute?status=pending")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.data.disputes).toHaveLength(1)
      expect(response.body.data.disputes[0].status).toBe("pending")
    })

    it("should filter disputes by type", async () => {
      const response = await request(app)
        .get("/user/ticket/dispute?disputeType=refund_request")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.data.disputes).toHaveLength(1)
      expect(response.body.data.disputes[0].disputeType).toBe("refund_request")
    })

    it("should search disputes", async () => {
      const response = await request(app)
        .get("/user/ticket/dispute?search=technical")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.data.disputes).toHaveLength(1)
      expect(response.body.data.disputes[0].subject).toContain("Technical")
    })
  })

  describe("GET /user/ticket/dispute/:id", () => {
    let testDispute: any

    beforeEach(async () => {
      testDispute = await TicketDispute.create({
        ticketId: testTicket._id,
        userId: testUser._id,
        disputeType: "refund_request",
        subject: "Test dispute",
        description: "Test description",
        status: "pending",
      })
    })

    it("should get dispute by id", async () => {
      const response = await request(app)
        .get(`/user/ticket/dispute/${testDispute._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data._id).toBe(testDispute._id.toString())
      expect(response.body.data.subject).toBe("Test dispute")
    })

    it("should return 404 for non-existent dispute", async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app).get(`/user/ticket/dispute/${fakeId}`).set("Authorization", `Bearer ${userToken}`).expect(404)
    })

    it("should deny access to other user's dispute", async () => {
      const otherUser = await User.create({
        email: "other@test.com",
        password: "password123",
        role: "user",
      })

      const otherToken = jwt.sign({ userId: otherUser._id }, process.env.JWT_SECRET!)

      await request(app)
        .get(`/user/ticket/dispute/${testDispute._id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(404)
    })
  })

  describe("PATCH /user/ticket/dispute/:id", () => {
    let testDispute: any

    beforeEach(async () => {
      testDispute = await TicketDispute.create({
        ticketId: testTicket._id,
        userId: testUser._id,
        disputeType: "refund_request",
        subject: "Test dispute",
        description: "Test description",
        status: "pending",
      })
    })

    it("should update dispute successfully", async () => {
      const updateData = {
        subject: "Updated subject",
        description: "Updated description",
      }

      const response = await request(app)
        .patch(`/user/ticket/dispute/${testDispute._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.subject).toBe("Updated subject")
      expect(response.body.data.description).toBe("Updated description")
    })

    it("should not update resolved dispute", async () => {
      testDispute.status = "resolved"
      await testDispute.save()

      const updateData = {
        subject: "Updated subject",
      }

      await request(app)
        .patch(`/user/ticket/dispute/${testDispute._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect(400)
    })
  })

  describe("DELETE /user/ticket/dispute/:id", () => {
    let testDispute: any

    beforeEach(async () => {
      testDispute = await TicketDispute.create({
        ticketId: testTicket._id,
        userId: testUser._id,
        disputeType: "refund_request",
        subject: "Test dispute",
        description: "Test description",
        status: "pending",
      })
    })

    it("should delete pending dispute", async () => {
      const response = await request(app)
        .delete(`/user/ticket/dispute/${testDispute._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify dispute is cancelled
      const updatedDispute = await TicketDispute.findById(testDispute._id)
      expect(updatedDispute?.status).toBe("cancelled")
    })

    it("should not delete non-pending dispute", async () => {
      testDispute.status = "under_review"
      await testDispute.save()

      await request(app)
        .delete(`/user/ticket/dispute/${testDispute._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(400)
    })
  })

  describe("Admin endpoints", () => {
    let testDispute: any

    beforeEach(async () => {
      testDispute = await TicketDispute.create({
        ticketId: testTicket._id,
        userId: testUser._id,
        disputeType: "refund_request",
        subject: "Test dispute",
        description: "Test description",
        status: "pending",
      })
    })

    it("should allow admin to get all disputes", async () => {
      const response = await request(app)
        .get("/user/ticket/dispute/admin/all")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.disputes).toHaveLength(1)
    })

    it("should allow admin to update dispute", async () => {
      const updateData = {
        status: "under_review",
        adminResponse: "We are reviewing your dispute",
        priority: "high",
      }

      const response = await request(app)
        .patch(`/user/ticket/dispute/admin/${testDispute._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe("under_review")
      expect(response.body.data.adminResponse).toBe("We are reviewing your dispute")
    })

    it("should get dispute analytics", async () => {
      const response = await request(app)
        .get("/user/ticket/dispute/admin/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.totalDisputes).toBe(1)
      expect(response.body.data.byStatus).toHaveProperty("pending")
    })

    it("should deny regular user access to admin endpoints", async () => {
      await request(app).get("/user/ticket/dispute/admin/all").set("Authorization", `Bearer ${userToken}`).expect(403)
    })
  })
})
