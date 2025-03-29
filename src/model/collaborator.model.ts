import mongoose, { Schema, Document } from "mongoose";

interface ICollaborator extends Document {
  name: string;
  email: string;
  image: string;
  event: mongoose.Schema.Types.ObjectId;
}

const collaboratorSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
  },
  { timestamps: true }
);

const Collaborator = mongoose.model<ICollaborator>(
  "Collaborator",
  collaboratorSchema
);

export default Collaborator;
