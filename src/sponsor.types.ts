export interface Sponsor {
  id: string
  name: string
  email: string
  phone?: string
  website?: string
  logo?: string
  description?: string
  industry: string
  sponsorshipTier: SponsorshipTier
  contactPerson: ContactPerson
  address: Address
  socialMedia?: SocialMedia
  contractDetails: ContractDetails
  paymentInfo: PaymentInfo
  events: string[] // Event IDs
  status: SponsorStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy: string
}

export interface ContactPerson {
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department?: string
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface SocialMedia {
  facebook?: string
  twitter?: string
  linkedin?: string
  instagram?: string
}

export interface ContractDetails {
  contractId?: string
  startDate: Date
  endDate: Date
  sponsorshipAmount: number
  currency: string
  benefits: string[]
  contractDocument?: string
  signedDate?: Date
  renewalDate?: Date
}

export interface PaymentInfo {
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentSchedule: PaymentSchedule[]
  paymentMethod?: string
  invoiceNumber?: string
}

export interface PaymentSchedule {
  id: string
  dueDate: Date
  amount: number
  status: PaymentStatus
  paidDate?: Date
  transactionId?: string
}

export enum SponsorshipTier {
  PLATINUM = "PLATINUM",
  GOLD = "GOLD",
  SILVER = "SILVER",
  BRONZE = "BRONZE",
  PARTNER = "PARTNER",
  MEDIA = "MEDIA",
}

export enum SponsorStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export interface CreateSponsorRequest {
  name: string
  email: string
  phone?: string
  website?: string
  description?: string
  industry: string
  sponsorshipTier: SponsorshipTier
  contactPerson: ContactPerson
  address: Address
  socialMedia?: SocialMedia
  contractDetails: Omit<ContractDetails, "contractId">
  events?: string[]
  notes?: string
}

export interface UpdateSponsorRequest extends Partial<CreateSponsorRequest> {
  status?: SponsorStatus
}

export interface SponsorQueryParams {
  page?: number
  limit?: number
  search?: string
  tier?: SponsorshipTier
  status?: SponsorStatus
  industry?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
  eventId?: string
}

export interface SponsorResponse {
  sponsors: Sponsor[]
  total: number
  page: number
  limit: number
  totalPages: number
}
