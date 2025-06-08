import mongoose, { Schema, type Document } from "mongoose"
import type { User } from "../types"

export interface UserDocument extends User, Document {}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "user"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model<UserDocument>("User", UserSchema)
