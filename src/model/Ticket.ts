import mongoose, { Schema, type Document } from "mongoose"
import type { Ticket } from "../types"

export interface TicketDocument extends Ticket, Document {}

const TicketSchema: Schema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "refunded"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model<TicketDocument>("Ticket", TicketSchema)
