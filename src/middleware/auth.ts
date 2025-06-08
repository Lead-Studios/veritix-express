import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    const user = await User.findById(decoded.id).select("-password")

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid token or user not found." })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: "Invalid token." })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
      })
    }
    next()
  }
}

export const checkEventOwnership = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const Event = (await import("../models/Event.js")).default

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    // Allow access if user is the organizer or an admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied. You can only manage collaborators for your own events.",
      })
    }

    req.event = event
    next()
  } catch (error) {
    res.status(500).json({ error: "Server error during authorization check" })
  }
}
