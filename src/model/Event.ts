import mongoose, { Schema, type Document } from "mongoose"
import type { Event } from "../types"

export interface EventDocument extends Event, Document {}

const EventSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    totalTickets: {
      type: Number,
      required: true,
      min: 1,
    },
    availableTickets: {
      type: Number,
      required: true,
      min: 0,
    },
    ticketPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model<EventDocument>("Event", EventSchema)
