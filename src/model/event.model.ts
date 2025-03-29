import mongoose, { Schema, Document } from "mongoose";

interface IEvent extends Document {
  name: string;
  description: string;
}

const eventSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

const Event = mongoose.model<IEvent>("Event", eventSchema);

export default Event;
