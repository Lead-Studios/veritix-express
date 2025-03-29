import Collaborator from "../model/collaborator.model";
import Event from "../model/event.model";
import {
  CreateCollaboratorDTO,
  UpdateCollaboratorDTO,
} from "../dtos/collaborator.dto";

class CollaboratorService {
  async createCollaborator(dto: CreateCollaboratorDTO) {
    const event = await Event.findById(dto.event);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if there are already 5 collaborators
    const collaboratorsCount = await Collaborator.countDocuments({
      event: dto.event,
    });
    if (collaboratorsCount >= 5) {
      throw new Error(
        "Event already has the maximum number of collaborators (5)"
      );
    }

    const collaborator = new Collaborator(dto);
    await collaborator.save();
    return collaborator;
  }

  // Get all collaborators
  async getAllCollaborators() {
    return Collaborator.find().populate("event");
  }

  // Get collaborator by ID
  async getCollaboratorById(id: string) {
    return Collaborator.findById(id).populate("event");
  }

  // Get all collaborators for a specific event
  async getCollaboratorsForEvent(eventId: string) {
    return Collaborator.find({ event: eventId }).populate("event");
  }

  // Update collaborator details
  async updateCollaborator(id: string, dto: UpdateCollaboratorDTO) {
    return Collaborator.findByIdAndUpdate(id, dto, { new: true });
  }

  // Remove collaborator
  async deleteCollaborator(id: string) {
    return Collaborator.findByIdAndDelete(id);
  }
}

export default new CollaboratorService();
