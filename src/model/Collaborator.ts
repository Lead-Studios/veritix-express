import mongoose from "mongoose"

const collaboratorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    image: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v),
        message: "Please provide a valid image URL",
      },
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    role: {
      type: String,
      enum: ["coordinator", "assistant", "specialist", "volunteer"],
      default: "volunteer",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to ensure unique email per event
collaboratorSchema.index({ email: 1, event: 1 }, { unique: true })

// Index for better query performance
collaboratorSchema.index({ event: 1, status: 1 })

export default mongoose.model("Collaborator", collaboratorSchema)
