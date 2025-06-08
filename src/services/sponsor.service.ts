import { v4 as uuidv4 } from "uuid"
import { database } from "../config/database"
import {
  type Sponsor,
  type CreateSponsorRequest,
  type UpdateSponsorRequest,
  type SponsorQueryParams,
  type SponsorResponse,
  PaymentStatus,
  SponsorStatus,
} from "../types/sponsor.types"
import { AppError } from "../utils/AppError"
import { logger } from "../utils/logger"
import { emailService } from "../utils/emailService"

export class SponsorService {
  async createSponsor(sponsorData: CreateSponsorRequest, userId: string): Promise<Sponsor> {
    const client = await database.getClient()

    try {
      await client.query("BEGIN")

      const sponsorId = uuidv4()
      const now = new Date()

      // Calculate payment info
      const totalAmount = sponsorData.contractDetails.sponsorshipAmount
      const paymentSchedule = this.generatePaymentSchedule(totalAmount, sponsorData.contractDetails.startDate)

      const insertQuery = `
        INSERT INTO sponsors (
          id, name, email, phone, website, logo, description, industry,
          sponsorship_tier, contact_person, address, social_media,
          contract_details, payment_info, events, status, notes,
          created_at, updated_at, created_by, last_modified_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *
      `

      const values = [
        sponsorId,
        sponsorData.name,
        sponsorData.email,
        sponsorData.phone || null,
        sponsorData.website || null,
        null, // logo will be updated separately
        sponsorData.description || null,
        sponsorData.industry,
        sponsorData.sponsorshipTier,
        JSON.stringify(sponsorData.contactPerson),
        JSON.stringify(sponsorData.address),
        JSON.stringify(sponsorData.socialMedia || {}),
        JSON.stringify({
          ...sponsorData.contractDetails,
          contractId: uuidv4(),
        }),
        JSON.stringify({
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          paymentSchedule,
          paymentMethod: null,
          invoiceNumber: null,
        }),
        JSON.stringify(sponsorData.events || []),
        SponsorStatus.PENDING,
        sponsorData.notes || null,
        now,
        now,
        userId,
        userId,
      ]

      const result = await client.query(insertQuery, values)
      await client.query("COMMIT")

      const sponsor = this.mapRowToSponsor(result.rows[0])

      // Send welcome email
      await emailService.sendSponsorWelcomeEmail(sponsor.email, sponsor.name)

      logger.info(`Sponsor created: ${sponsor.id}`)
      return sponsor
    } catch (error) {
      await client.query("ROLLBACK")
      logger.error("Error creating sponsor:", error)
      throw new AppError("Failed to create sponsor", 500)
    } finally {
      client.release()
    }
  }

  async getSponsorById(id: string): Promise<Sponsor> {
    const query = "SELECT * FROM sponsors WHERE id = $1"
    const result = await database.query(query, [id])

    if (result.rows.length === 0) {
      throw new AppError("Sponsor not found", 404)
    }

    return this.mapRowToSponsor(result.rows[0])
  }

  async getSponsors(params: SponsorQueryParams): Promise<SponsorResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      tier,
      status,
      industry,
      sortBy = "created_at",
      sortOrder = "desc",
      eventId,
    } = params

    const offset = (page - 1) * limit
    const whereConditions: string[] = []
    const queryParams: any[] = []
    let paramIndex = 1

    // Build WHERE conditions
    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (tier) {
      whereConditions.push(`sponsorship_tier = $${paramIndex}`)
      queryParams.push(tier)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (industry) {
      whereConditions.push(`industry ILIKE $${paramIndex}`)
      queryParams.push(`%${industry}%`)
      paramIndex++
    }

    if (eventId) {
      whereConditions.push(`events::jsonb ? $${paramIndex}`)
      queryParams.push(eventId)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Count query
    const countQuery = `SELECT COUNT(*) FROM sponsors ${whereClause}`
    const countResult = await database.query(countQuery, queryParams)
    const total = Number.parseInt(countResult.rows[0].count)

    // Main query
    const query = `
      SELECT * FROM sponsors 
      ${whereClause}
      ORDER BY ${this.mapSortField(sortBy)} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)
    const result = await database.query(query, queryParams)

    const sponsors = result.rows.map((row) => this.mapRowToSponsor(row))

    return {
      sponsors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async updateSponsor(id: string, updateData: UpdateSponsorRequest, userId: string): Promise<Sponsor> {
    const existingSponsor = await this.getSponsorById(id)

    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = this.mapFieldToColumn(key)
        if (typeof value === "object" && value !== null) {
          updateFields.push(`${dbField} = $${paramIndex}`)
          values.push(JSON.stringify(value))
        } else {
          updateFields.push(`${dbField} = $${paramIndex}`)
          values.push(value)
        }
        paramIndex++
      }
    })

    if (updateFields.length === 0) {
      return existingSponsor
    }

    updateFields.push(`updated_at = $${paramIndex}`)
    values.push(new Date())
    paramIndex++

    updateFields.push(`last_modified_by = $${paramIndex}`)
    values.push(userId)
    paramIndex++

    values.push(id)

    const query = `
      UPDATE sponsors 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await database.query(query, values)

    if (result.rows.length === 0) {
      throw new AppError("Sponsor not found", 404)
    }

    logger.info(`Sponsor updated: ${id}`)
    return this.mapRowToSponsor(result.rows[0])
  }

  async deleteSponsor(id: string): Promise<void> {
    const query = "DELETE FROM sponsors WHERE id = $1"
    const result = await database.query(query, [id])

    if (result.rowCount === 0) {
      throw new AppError("Sponsor not found", 404)
    }

    logger.info(`Sponsor deleted: ${id}`)
  }

  async updatePaymentStatus(
    sponsorId: string,
    paymentScheduleId: string,
    status: PaymentStatus,
    paidDate?: Date,
    transactionId?: string,
  ): Promise<Sponsor> {
    const sponsor = await this.getSponsorById(sponsorId)
    const paymentInfo = sponsor.paymentInfo

    const scheduleIndex = paymentInfo.paymentSchedule.findIndex((p) => p.id === paymentScheduleId)
    if (scheduleIndex === -1) {
      throw new AppError("Payment schedule not found", 404)
    }

    const payment = paymentInfo.paymentSchedule[scheduleIndex]
    payment.status = status

    if (status === PaymentStatus.PAID) {
      payment.paidDate = paidDate || new Date()
      payment.transactionId = transactionId
      paymentInfo.paidAmount += payment.amount
      paymentInfo.remainingAmount -= payment.amount
    }

    const query = `
      UPDATE sponsors 
      SET payment_info = $1, updated_at = $2
      WHERE id = $3
      RETURNING *
    `

    const result = await database.query(query, [JSON.stringify(paymentInfo), new Date(), sponsorId])

    logger.info(`Payment status updated for sponsor: ${sponsorId}`)
    return this.mapRowToSponsor(result.rows[0])
  }

  async getSponsorsByEvent(eventId: string): Promise<Sponsor[]> {
    const query = "SELECT * FROM sponsors WHERE events::jsonb ? $1"
    const result = await database.query(query, [eventId])

    return result.rows.map((row) => this.mapRowToSponsor(row))
  }

  async getExpiringContracts(days = 30): Promise<Sponsor[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const query = `
      SELECT * FROM sponsors 
      WHERE (contract_details->>'endDate')::date <= $1 
      AND status = 'ACTIVE'
    `

    const result = await database.query(query, [futureDate.toISOString().split("T")[0]])

    return result.rows.map((row) => this.mapRowToSponsor(row))
  }

  async getOverduePayments(): Promise<Sponsor[]> {
    const today = new Date().toISOString().split("T")[0]

    const query = `
      SELECT * FROM sponsors 
      WHERE payment_info::jsonb @> '[{"status": "PENDING"}]'
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(payment_info->'paymentSchedule') AS payment
        WHERE payment->>'status' = 'PENDING' 
        AND (payment->>'dueDate')::date < $1
      )
    `

    const result = await database.query(query, [today])

    return result.rows.map((row) => this.mapRowToSponsor(row))
  }

  private generatePaymentSchedule(totalAmount: number, startDate: Date) {
    const schedule = []
    const quarterlyAmount = totalAmount / 4

    for (let i = 0; i < 4; i++) {
      const dueDate = new Date(startDate)
      dueDate.setMonth(dueDate.getMonth() + i * 3)

      schedule.push({
        id: uuidv4(),
        dueDate,
        amount: quarterlyAmount,
        status: PaymentStatus.PENDING,
        paidDate: null,
        transactionId: null,
      })
    }

    return schedule
  }

  private mapRowToSponsor(row: any): Sponsor {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      website: row.website,
      logo: row.logo,
      description: row.description,
      industry: row.industry,
      sponsorshipTier: row.sponsorship_tier,
      contactPerson: JSON.parse(row.contact_person),
      address: JSON.parse(row.address),
      socialMedia: JSON.parse(row.social_media),
      contractDetails: JSON.parse(row.contract_details),
      paymentInfo: JSON.parse(row.payment_info),
      events: JSON.parse(row.events),
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      lastModifiedBy: row.last_modified_by,
    }
  }

  private mapFieldToColumn(field: string): string {
    const fieldMap: { [key: string]: string } = {
      sponsorshipTier: "sponsorship_tier",
      contactPerson: "contact_person",
      socialMedia: "social_media",
      contractDetails: "contract_details",
      paymentInfo: "payment_info",
    }

    return fieldMap[field] || field.toLowerCase()
  }

  private mapSortField(field: string): string {
    const fieldMap: { [key: string]: string } = {
      sponsorshipAmount: "contract_details->>'sponsorshipAmount'",
      tier: "sponsorship_tier",
    }

    return fieldMap[field] || field
  }
}

export const sponsorService = new SponsorService()
