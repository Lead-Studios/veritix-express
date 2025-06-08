import mongoose, { Schema, type Document } from "mongoose"
import type { DisputeNotification } from "../types/dispute"

export interface DisputeNotificationDocument extends DisputeNotification, Document {}

const DisputeNotificationSchema: Schema = new Schema(
  {
    disputeId: {
      type: Schema.Types.ObjectId,
      ref: "TicketDispute",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "dispute_created",
        "dispute_updated",
        "status_changed",
        "admin_response",
        "escalation",
        "resolution",
        "refund_processed",
        "reminder",
        "deadline_approaching",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    channels: [
      {
        type: String,
        enum: ["email", "sms", "push", "in_app", "webhook"],
      },
    ],
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    scheduledAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
DisputeNotificationSchema.index({ userId: 1, status: 1 })
DisputeNotificationSchema.index({ disputeId: 1, type: 1 })
DisputeNotificationSchema.index({ scheduledAt: 1, status: 1 })
DisputeNotificationSchema.index({ createdAt: -1 })

export default mongoose.model<DisputeNotificationDocument>("DisputeNotification", DisputeNotificationSchema)
