export interface User {
  _id: string
  email: string
  role: "super_admin" | "admin" | "user"
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  _id: string
  title: string
  description: string
  date: Date
  venue: string
  totalTickets: number
  availableTickets: number
  ticketPrice: number
  createdAt: Date
  updatedAt: Date
}

export interface Ticket {
  _id: string
  eventId: string
  userId: string
  purchaseDate: Date
  price: number
  quantity: number
  status: "active" | "cancelled" | "refunded"
  createdAt: Date
  updatedAt: Date
}

export interface EventSalesSummary {
  eventId: string
  eventTitle: string
  totalTicketsSold: number
  totalRevenue: number
  averageTicketPrice: number
  salesCount: number
}

export interface SalesReport {
  timeframe: "weekly" | "monthly" | "yearly"
  startDate: Date
  endDate: Date
  totalRevenue: number
  totalTicketsSold: number
  totalEvents: number
  events: EventSalesSummary[]
}

export interface AuthRequest extends Request {
  user?: User
}

export interface QueryParams {
  timeframe?: "weekly" | "monthly" | "yearly"
  sort?: "top-selling" | "recent" | "revenue"
  page?: string
  limit?: string
}
