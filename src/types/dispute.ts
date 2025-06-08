export interface TicketDispute {
  _id: string
  ticketId: string
  userId: string
  disputeType: DisputeType
  status: DisputeStatus
  priority: DisputePriority
  subject: string
  description: string
  evidence: DisputeEvidence[]
  adminResponse?: string
  adminId?: string
  resolution?: string
  resolutionDate?: Date
  escalationLevel: number
  escalationHistory: EscalationHistory[]
  refundAmount?: number
  refundStatus?: RefundStatus
  communicationHistory: CommunicationHistory[]
  tags: string[]
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  lastActivityAt: Date
}

export enum DisputeType {
  REFUND_REQUEST = "refund_request",
  EVENT_CANCELLED = "event_cancelled",
  EVENT_POSTPONED = "event_postponed",
  VENUE_CHANGED = "venue_changed",
  TECHNICAL_ISSUE = "technical_issue",
  FRAUDULENT_CHARGE = "fraudulent_charge",
  DUPLICATE_CHARGE = "duplicate_charge",
  SERVICE_ISSUE = "service_issue",
  ACCESS_DENIED = "access_denied",
  OTHER = "other",
}

export enum DisputeStatus {
  PENDING = "pending",
  UNDER_REVIEW = "under_review",
  INVESTIGATING = "investigating",
  AWAITING_RESPONSE = "awaiting_response",
  ESCALATED = "escalated",
  RESOLVED = "resolved",
  REJECTED = "rejected",
  APPROVED = "approved",
  CANCELLED = "cancelled",
  CLOSED = "closed",
}

export enum DisputePriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
  CRITICAL = "critical",
}

export enum RefundStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  PROCESSED = "processed",
  FAILED = "failed",
}

export interface DisputeEvidence {
  _id: string
  type: EvidenceType
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: Date
  description?: string
}

export enum EvidenceType {
  IMAGE = "image",
  DOCUMENT = "document",
  VIDEO = "video",
  AUDIO = "audio",
  OTHER = "other",
}

export interface EscalationHistory {
  level: number
  escalatedBy: string
  escalatedTo: string
  reason: string
  escalatedAt: Date
}

export interface CommunicationHistory {
  _id: string
  type: CommunicationType
  from: string
  to: string
  subject?: string
  message: string
  attachments?: string[]
  sentAt: Date
  readAt?: Date
  isInternal: boolean
}

export enum CommunicationType {
  EMAIL = "email",
  SMS = "sms",
  INTERNAL_NOTE = "internal_note",
  SYSTEM_MESSAGE = "system_message",
  USER_MESSAGE = "user_message",
  ADMIN_MESSAGE = "admin_message",
}

export interface DisputeNotification {
  _id: string
  disputeId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, any>
  channels: NotificationChannel[]
  status: NotificationStatus
  scheduledAt?: Date
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  createdAt: Date
}

export enum NotificationType {
  DISPUTE_CREATED = "dispute_created",
  DISPUTE_UPDATED = "dispute_updated",
  STATUS_CHANGED = "status_changed",
  ADMIN_RESPONSE = "admin_response",
  ESCALATION = "escalation",
  RESOLUTION = "resolution",
  REFUND_PROCESSED = "refund_processed",
  REMINDER = "reminder",
  DEADLINE_APPROACHING = "deadline_approaching",
}

export enum NotificationChannel {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
  IN_APP = "in_app",
  WEBHOOK = "webhook",
}

export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  CANCELLED = "cancelled",
}
