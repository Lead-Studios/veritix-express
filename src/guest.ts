export interface SpecialGuest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  title?: string
  vipLevel: "STANDARD" | "PREMIUM" | "PLATINUM" | "DIAMOND"
  specialRequests?: string[]
  dietaryRestrictions?: string[]
  accessLevel: "BASIC" | "VIP" | "BACKSTAGE" | "ALL_ACCESS"
  invitationStatus: "PENDING" | "SENT" | "CONFIRMED" | "DECLINED" | "ATTENDED"
  eventIds: string[]
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  preferences?: {
    seatingPreference?: string
    transportationNeeded?: boolean
    accommodationNeeded?: boolean
    securityLevel?: "STANDARD" | "HIGH" | "MAXIMUM"
  }
  notes?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy: string
  isActive: boolean
}

export interface CreateGuestRequest {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  title?: string
  vipLevel: "STANDARD" | "PREMIUM" | "PLATINUM" | "DIAMOND"
  specialRequests?: string[]
  dietaryRestrictions?: string[]
  accessLevel: "BASIC" | "VIP" | "BACKSTAGE" | "ALL_ACCESS"
  eventIds: string[]
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  preferences?: {
    seatingPreference?: string
    transportationNeeded?: boolean
    accommodationNeeded?: boolean
    securityLevel?: "STANDARD" | "HIGH" | "MAXIMUM"
  }
  notes?: string
  tags?: string[]
}

export interface UpdateGuestRequest extends Partial<CreateGuestRequest> {
  invitationStatus?: "PENDING" | "SENT" | "CONFIRMED" | "DECLINED" | "ATTENDED"
  isActive?: boolean
}

export interface GuestQueryParams {
  page?: number
  limit?: number
  search?: string
  vipLevel?: string
  accessLevel?: string
  invitationStatus?: string
  eventId?: string
  tags?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
