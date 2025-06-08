import Collaborator from "../models/Collaborator.js"
import Event from "../models/Event.js"

export const createCollaborator = async (req, res) => {
  try {
    const { name, email, image, event, role } = req.body

    // Check if event exists
    const eventDoc = await Event.findById(event)
    if (!eventDoc) {
      return res.status(404).json({ error: "Event not found" })
    }

    // Check if user has permission to add collaborators to this event
    if (eventDoc.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        error: "You can only add collaborators to your own events",
      })
    }

    // Check collaborator limit
    const existingCollaborators = await Collaborator.countDocuments({
      event,
      status: { $ne: "declined" },
    })

    if (existingCollaborators >= 5) {
      return res.status(400).json({
        error: "Maximum number of collaborators (5) reached for this event",
      })
    }

    // Check if collaborator already exists for this event
    const existingCollaborator = await Collaborator.findOne({ email, event })
    if (existingCollaborator) {
      return res.status(400).json({
        error: "This email is already associated with this event",
      })
    }

    const collaborator = new Collaborator({
      name,
      email,
      image,
      event,
      role: role || "volunteer",
      invitedBy: req.user._id,
    })

    await collaborator.save()

    // Add collaborator to event
    await Event.findByIdAndUpdate(event, {
      $push: { collaborators: collaborator._id },
    })

    const populatedCollaborator = await Collaborator.findById(collaborator._id)
      .populate("event", "title date location")
      .populate("invitedBy", "name email")

    res.status(201).json({
      message: "Collaborator added successfully",
      collaborator: populatedCollaborator,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getAllCollaborators = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Build query based on user role
    const query = {}
    if (req.user.role !== "admin") {
      // Non-admin users can only see collaborators from their events
      const userEvents = await Event.find({ organizer: req.user._id }).select("_id")
      const eventIds = userEvents.map((event) => event._id)
      query.event = { $in: eventIds }
    }

    const collaborators = await Collaborator.find(query)
      .populate("event", "title date location")
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Collaborator.countDocuments(query)

    res.json({
      collaborators,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getCollaboratorById = async (req, res) => {
  try {
    const { id } = req.params

    const collaborator = await Collaborator.findById(id)
      .populate("event", "title date location organizer")
      .populate("invitedBy", "name email")

    if (!collaborator) {
      return res.status(404).json({ error: "Collaborator not found" })
    }

    // Check if user has permission to view this collaborator
    if (req.user.role !== "admin" && collaborator.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Access denied. You can only view collaborators from your own events.",
      })
    }

    res.json({ collaborator })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getCollaboratorsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    // Check if user has permission to view collaborators for this event
    if (req.user.role !== "admin" && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Access denied. You can only view collaborators from your own events.",
      })
    }

    const collaborators = await Collaborator.find({ event: eventId })
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 })

    res.json({
      collaborators,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        location: event.location,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateCollaborator = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const collaborator = await Collaborator.findById(id).populate("event")
    if (!collaborator) {
      return res.status(404).json({ error: "Collaborator not found" })
    }

    // Check if user has permission to update this collaborator
    if (req.user.role !== "admin" && collaborator.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Access denied. You can only update collaborators from your own events.",
      })
    }

    // If email is being updated, check for duplicates
    if (updates.email && updates.email !== collaborator.email) {
      const existingCollaborator = await Collaborator.findOne({
        email: updates.email,
        event: collaborator.event._id,
        _id: { $ne: id },
      })

      if (existingCollaborator) {
        return res.status(400).json({
          error: "This email is already associated with this event",
        })
      }
    }

    // Update responded date if status is being changed
    if (updates.status && updates.status !== collaborator.status) {
      updates.respondedAt = new Date()
    }

    const updatedCollaborator = await Collaborator.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate("event", "title date location")
      .populate("invitedBy", "name email")

    res.json({
      message: "Collaborator updated successfully",
      collaborator: updatedCollaborator,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteCollaborator = async (req, res) => {
  try {
    const { id } = req.params

    const collaborator = await Collaborator.findById(id).populate("event")
    if (!collaborator) {
      return res.status(404).json({ error: "Collaborator not found" })
    }

    // Check if user has permission to delete this collaborator
    if (req.user.role !== "admin" && collaborator.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Access denied. You can only delete collaborators from your own events.",
      })
    }

    // Remove collaborator from event
    await Event.findByIdAndUpdate(collaborator.event._id, {
      $pull: { collaborators: id },
    })

    await Collaborator.findByIdAndDelete(id)

    res.json({ message: "Collaborator removed successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
