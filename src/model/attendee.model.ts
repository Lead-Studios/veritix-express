import mongoose, { type Document, Schema } from "mongoose"
import type { IUser } from "./user.model"
import type { IEvent } from "./event.model"

export interface IAttendee extends Document {
  user: mongoose.Types.ObjectId | IUser
  event: mongoose.Types.ObjectId | IEvent
  status: "registered" | "attended" | "cancelled"
  ticketNumber: string
  checkInTime?: Date
  createdAt: Date
  updatedAt: Date
}

const attendeeSchema = new Schema<IAttendee>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
    },
    status: {
      type: String,
      enum: ["registered", "attended", "cancelled"],
      default: "registered",
    },
    ticketNumber: {
      type: String,
      required: [true, "Ticket number is required"],
      unique: true,
    },
    checkInTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to prevent duplicate registrations
attendeeSchema.index({ user: 1, event: 1 }, { unique: true })

// Generate ticket number
attendeeSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next()
  }

  // Generate a random ticket number if not provided
  if (!this.ticketNumber) {
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase()
    this.ticketNumber = `TKT-${randomStr}-${Date.now().toString().slice(-6)}`
  }

  next()
})

const Attendee = mongoose.model<IAttendee>("Attendee", attendeeSchema)

export default Attendee
