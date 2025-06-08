import mongoose, { type Document, Schema } from "mongoose"

export interface ILocation extends Document {
  name: string
  address: string
  city: string
  state?: string
  country: string
  postalCode?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  createdAt: Date
  updatedAt: Date
}

const locationSchema = new Schema<ILocation>(
  {
    name: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    coordinates: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Index for geospatial queries
locationSchema.index({
  "coordinates.latitude": 1,
  "coordinates.longitude": 1,
})

const Location = mongoose.model<ILocation>("Location", locationSchema)

export default Location
