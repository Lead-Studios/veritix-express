import mongoose, { type Document, Schema } from "mongoose"
import type { IUser } from "./user.model"
import type { ICategory } from "./category.model"
import type { ILocation } from "./location.model"

export interface IEvent extends Document {
  title: string
  description: string
  startDate: Date
  endDate: Date
  organizer: mongoose.Types.ObjectId | IUser
  category: mongoose.Types.ObjectId | ICategory
  location: mongoose.Types.ObjectId | ILocation
  capacity: number
  price: number
  isFree: boolean
  isVirtual: boolean
  virtualMeetingLink?: string
  bannerImage?: string
  tags: string[]
  status: "draft" | "published" | "cancelled"
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [100, "Event title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer is required"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
    },
    capacity: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    price: {
      type: Number,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    isVirtual: {
      type: Boolean,
      default: false,
    },
    virtualMeetingLink: {
      type: String,
      validate: {
        validator: function (v: string) {
          return this.isVirtual ? !!v : true
        },
        message: "Virtual meeting link is required for virtual events",
      },
    },
    bannerImage: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "cancelled"],
      default: "draft",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for attendees count
eventSchema.virtual("attendeesCount", {
  ref: "Attendee",
  localField: "_id",
  foreignField: "event",
  count: true,
})

// Virtual for comments
eventSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "event",
})

// Index for search
eventSchema.index({ title: "text", description: "text", tags: "text" })

// Middleware to check if endDate is after startDate
eventSchema.pre("validate", function (next) {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date must be after start date")
  }
  next()
})

const Event = mongoose.model<IEvent>("Event", eventSchema)

export default Event
