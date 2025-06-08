import mongoose, { type Document, Schema } from "mongoose"

export interface ICategory extends Document {
  name: string
  description?: string
  color?: string
  icon?: string
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#3498db", // Default blue color
    },
    icon: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

const Category = mongoose.model<ICategory>("Category", categorySchema)

export default Category
