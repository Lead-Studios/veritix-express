import mongoose, { Schema, type Document } from "mongoose"
import type { TicketDispute, DisputeEvidence, EscalationHistory, CommunicationHistory } from "../types/dispute"

export interface TicketDisputeDocument extends TicketDispute, Document {}

const DisputeEvidenceSchema = new Schema({
  type: {
    type: String,
    enum: ["image", "document", "video", "audio", "other"],
    required: true,
  },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  description: { type: String, maxlength: 500 },
})

const EscalationHistorySchema = new Schema({
  level: { type: Number, required: true },
  escalatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  escalatedTo: { type: Schema.Types.ObjectId, ref: "User" },
  reason: { type: String, required: true, maxlength: 500 },
  escalatedAt: { type: Date, default: Date.now },
})

const CommunicationHistorySchema = new Schema({
  type: {
    type: String,
    enum: ["email", "sms", "internal_note", "system_message", "user_message", "admin_message"],
    required: true,
  },
  from: { type: Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: Schema.Types.ObjectId, ref: "User" },
  subject: { type: String, maxlength: 200 },
  message: { type: String, required: true, maxlength: 2000 },
  attachments: [{ type: String }],
  sentAt: { type: Date, default: Date.now },
  readAt: { type: Date },
  isInternal: { type: Boolean, default: false },
})

const TicketDisputeSchema: Schema = new Schema(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    disputeType: {
      type: String,
      enum: [
        "refund_request",
        "event_cancelled",
        "event_postponed",
        "venue_changed",
        "technical_issue",
        "fraudulent_charge",
        "duplicate_charge",
        "service_issue",
        "access_denied",
        "other",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "under_review",
        "investigating",
        "awaiting_response",
        "escalated",
        "resolved",
        "rejected",
        "approved",
        "cancelled",
        "closed",
      ],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent", "critical"],
      default: "medium",
      index: true,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
      index: "text",
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
      index: "text",
    },
    evidence: [DisputeEvidenceSchema],
    adminResponse: {
      type: String,
      maxlength: 2000,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolution: {
      type: String,
      maxlength: 2000,
    },
    resolutionDate: {
      type: Date,
    },
    escalationLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    escalationHistory: [EscalationHistorySchema],
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "processed", "failed"],
    },
    communicationHistory: [CommunicationHistorySchema],
    tags: [
      {
        type: String,
        maxlength: 50,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for performance
TicketDisputeSchema.index({ userId: 1, status: 1 })
TicketDisputeSchema.index({ createdAt: -1 })
TicketDisputeSchema.index({ lastActivityAt: -1 })
TicketDisputeSchema.index({ priority: 1, status: 1 })
TicketDisputeSchema.index({ disputeType: 1, status: 1 })

// Text search index
TicketDisputeSchema.index({
  subject: "text",
  description: "text",
  "communicationHistory.message": "text",
})

// Virtual for ticket details
TicketDisputeSchema.virtual("ticket", {
  ref: "Ticket",
  localField: "ticketId",
  foreignField: "_id",
  justOne: true,
})

// Virtual for user details
TicketDisputeSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
})

// Virtual for admin details
TicketDisputeSchema.virtual("admin", {
  ref: "User",
  localField: "adminId",
  foreignField: "_id",
  justOne: true,
})

// Pre-save middleware
TicketDisputeSchema.pre("save", function (next) {
  this.lastActivityAt = new Date()

  // Set resolution date when status changes to resolved
  if (this.isModified("status") && ["resolved", "approved", "rejected", "closed"].includes(this.status)) {
    this.resolvedAt = new Date()
  }

  next()
})

// Methods
TicketDisputeSchema.methods.addCommunication = function (communication: Partial<CommunicationHistory>) {
  this.communicationHistory.push(communication)
  this.lastActivityAt = new Date()
  return this.save()
}

TicketDisputeSchema.methods.escalate = function (escalationData: Partial<EscalationHistory>) {
  this.escalationLevel += 1
  this.escalationHistory.push({
    ...escalationData,
    level: this.escalationLevel,
  })
  this.status = "escalated"
  this.lastActivityAt = new Date()
  return this.save()
}

TicketDisputeSchema.methods.addEvidence = function (evidence: Partial<DisputeEvidence>) {
  this.evidence.push(evidence)
  this.lastActivityAt = new Date()
  return this.save()
}

export default mongoose.model<TicketDisputeDocument>("TicketDispute", TicketDisputeSchema)
