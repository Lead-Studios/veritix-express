import { v4 as uuidv4 } from "uuid"
import type { SpecialGuest, CreateGuestRequest, UpdateGuestRequest, GuestQueryParams } from "../types/guest"
import { AppError } from "../middleware/errorHandler"
import { logger } from "../utils/logger"

// In-memory database simulation (replace with actual database in production)
class GuestDatabase {
  private guests: Map<string, SpecialGuest> = new Map()

  constructor() {
    // Initialize with some sample data
    this.seedData()
  }

  private seedData() {
    const sampleGuests: SpecialGuest[] = [
      {
        id: uuidv4(),
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        company: "Tech Corp",
        title: "CEO",
        vipLevel: "PLATINUM",
        accessLevel: "ALL_ACCESS",
        invitationStatus: "CONFIRMED",
        eventIds: ["event-1", "event-2"],
        specialRequests: ["Private entrance", "Dedicated security"],
        dietaryRestrictions: ["Vegetarian"],
        emergencyContact: {
          name: "Jane Doe",
          phone: "+1234567891",
          relationship: "Spouse",
        },
        preferences: {
          seatingPreference: "Front row",
          transportationNeeded: true,
          accommodationNeeded: true,
          securityLevel: "MAXIMUM",
        },
        notes: "High-profile guest, requires special attention",
        tags: ["VIP", "Tech Industry", "Keynote Speaker"],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        lastModifiedBy: "admin",
        isActive: true,
      },
    ]

    sampleGuests.forEach((guest) => {
      this.guests.set(guest.id, guest)
    })
  }

  getAll(): SpecialGuest[] {
    return Array.from(this.guests.values())
  }

  getById(id: string): SpecialGuest | undefined {
    return this.guests.get(id)
  }

  create(guest: SpecialGuest): SpecialGuest {
    this.guests.set(guest.id, guest)
    return guest
  }

  update(id: string, guest: SpecialGuest): SpecialGuest {
    this.guests.set(id, guest)
    return guest
  }

  delete(id: string): boolean {
    return this.guests.delete(id)
  }

  findByEmail(email: string): SpecialGuest | undefined {
    return Array.from(this.guests.values()).find((guest) => guest.email === email)
  }
}

const db = new GuestDatabase()

export class GuestService {
  async createGuest(guestData: CreateGuestRequest, userId: string): Promise<SpecialGuest> {
    logger.info(`Creating new guest: ${guestData.email}`)

    // Check if guest with email already exists
    const existingGuest = db.findByEmail(guestData.email)
    if (existingGuest) {
      throw new AppError("Guest with this email already exists", 409)
    }

    const newGuest: SpecialGuest = {
      id: uuidv4(),
      ...guestData,
      invitationStatus: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      lastModifiedBy: userId,
      isActive: true,
    }

    const createdGuest = db.create(newGuest)
    logger.info(`Guest created successfully: ${createdGuest.id}`)

    return createdGuest
  }

  async getGuests(queryParams: GuestQueryParams): Promise<{
    guests: SpecialGuest[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    logger.info("Fetching guests with filters", queryParams)

    let guests = db.getAll()

    // Apply filters
    if (queryParams.search) {
      const searchTerm = queryParams.search.toLowerCase()
      guests = guests.filter(
        (guest) =>
          guest.firstName.toLowerCase().includes(searchTerm) ||
          guest.lastName.toLowerCase().includes(searchTerm) ||
          guest.email.toLowerCase().includes(searchTerm) ||
          guest.company?.toLowerCase().includes(searchTerm),
      )
    }

    if (queryParams.vipLevel) {
      guests = guests.filter((guest) => guest.vipLevel === queryParams.vipLevel)
    }

    if (queryParams.accessLevel) {
      guests = guests.filter((guest) => guest.accessLevel === queryParams.accessLevel)
    }

    if (queryParams.invitationStatus) {
      guests = guests.filter((guest) => guest.invitationStatus === queryParams.invitationStatus)
    }

    if (queryParams.eventId) {
      guests = guests.filter((guest) => guest.eventIds.includes(queryParams.eventId))
    }

    if (queryParams.tags) {
      const tags = queryParams.tags.split(",")
      guests = guests.filter((guest) => guest.tags?.some((tag) => tags.includes(tag)))
    }

    if (queryParams.isActive !== undefined) {
      guests = guests.filter((guest) => guest.isActive === queryParams.isActive)
    }

    // Apply sorting
    if (queryParams.sortBy) {
      const sortOrder = queryParams.sortOrder === "desc" ? -1 : 1
      guests.sort((a, b) => {
        const aValue = (a as any)[queryParams.sortBy!]
        const bValue = (b as any)[queryParams.sortBy!]

        if (aValue < bValue) return -1 * sortOrder
        if (aValue > bValue) return 1 * sortOrder
        return 0
      })
    }

    // Apply pagination
    const page = queryParams.page || 1
    const limit = queryParams.limit || 10
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const total = guests.length
    const totalPages = Math.ceil(total / limit)

    const paginatedGuests = guests.slice(startIndex, endIndex)

    return {
      guests: paginatedGuests,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  }

  async getGuestById(id: string): Promise<SpecialGuest> {
    logger.info(`Fetching guest by ID: ${id}`)

    const guest = db.getById(id)
    if (!guest) {
      throw new AppError("Guest not found", 404)
    }

    return guest
  }

  async updateGuest(id: string, updateData: UpdateGuestRequest, userId: string): Promise<SpecialGuest> {
    logger.info(`Updating guest: ${id}`)

    const existingGuest = db.getById(id)
    if (!existingGuest) {
      throw new AppError("Guest not found", 404)
    }

    // Check if email is being updated and if it conflicts with another guest
    if (updateData.email && updateData.email !== existingGuest.email) {
      const guestWithEmail = db.findByEmail(updateData.email)
      if (guestWithEmail && guestWithEmail.id !== id) {
        throw new AppError("Another guest with this email already exists", 409)
      }
    }

    const updatedGuest: SpecialGuest = {
      ...existingGuest,
      ...updateData,
      updatedAt: new Date(),
      lastModifiedBy: userId,
    }

    const result = db.update(id, updatedGuest)
    logger.info(`Guest updated successfully: ${id}`)

    return result
  }

  async deleteGuest(id: string): Promise<void> {
    logger.info(`Deleting guest: ${id}`)

    const guest = db.getById(id)
    if (!guest) {
      throw new AppError("Guest not found", 404)
    }

    const deleted = db.delete(id)
    if (!deleted) {
      throw new AppError("Failed to delete guest", 500)
    }

    logger.info(`Guest deleted successfully: ${id}`)
  }

  async softDeleteGuest(id: string, userId: string): Promise<SpecialGuest> {
    logger.info(`Soft deleting guest: ${id}`)

    const guest = await this.getGuestById(id)
    return this.updateGuest(id, { isActive: false }, userId)
  }

  async bulkUpdateInvitationStatus(
    guestIds: string[],
    status: SpecialGuest["invitationStatus"],
    userId: string,
  ): Promise<SpecialGuest[]> {
    logger.info(`Bulk updating invitation status for ${guestIds.length} guests`)

    const updatedGuests: SpecialGuest[] = []

    for (const guestId of guestIds) {
      try {
        const updatedGuest = await this.updateGuest(guestId, { invitationStatus: status }, userId)
        updatedGuests.push(updatedGuest)
      } catch (error) {
        logger.error(`Failed to update guest ${guestId}:`, error)
      }
    }

    return updatedGuests
  }

  async getGuestsByEvent(eventId: string): Promise<SpecialGuest[]> {
    logger.info(`Fetching guests for event: ${eventId}`)

    const guests = db.getAll().filter((guest) => guest.eventIds.includes(eventId) && guest.isActive)

    return guests
  }

  async getGuestStatistics(): Promise<{
    total: number
    byVipLevel: Record<string, number>
    byAccessLevel: Record<string, number>
    byInvitationStatus: Record<string, number>
    activeGuests: number
    inactiveGuests: number
  }> {
    logger.info("Generating guest statistics")

    const guests = db.getAll()
    const total = guests.length
    const activeGuests = guests.filter((g) => g.isActive).length
    const inactiveGuests = total - activeGuests

    const byVipLevel: Record<string, number> = {}
    const byAccessLevel: Record<string, number> = {}
    const byInvitationStatus: Record<string, number> = {}

    guests.forEach((guest) => {
      byVipLevel[guest.vipLevel] = (byVipLevel[guest.vipLevel] || 0) + 1
      byAccessLevel[guest.accessLevel] = (byAccessLevel[guest.accessLevel] || 0) + 1
      byInvitationStatus[guest.invitationStatus] = (byInvitationStatus[guest.invitationStatus] || 0) + 1
    })

    return {
      total,
      byVipLevel,
      byAccessLevel,
      byInvitationStatus,
      activeGuests,
      inactiveGuests,
    }
  }
}
