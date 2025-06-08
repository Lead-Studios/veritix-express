import mongoose, { type Document, Schema } from "mongoose"
import type { IUser } from "./user.model"
import type { IEvent } from "./event.model"

export interface IComment extends Document {
  user: mongoose.Types.ObjectId | IUser
  event: mongoose.Types.ObjectId | IEvent
  content: string
  rating?: number
  isPublic: boolean
  parentComment?: mongoose.Types.ObjectId | IComment
  createdAt: Date
  updatedAt: Date
}

const commentSchema = new Schema<IComment>(
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
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for replies
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
})

const Comment = mongoose.model<IComment>("Comment", commentSchema)

export default Comment
