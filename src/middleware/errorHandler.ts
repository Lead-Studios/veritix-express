export const errorHandler = (err, req, res, next) => {
  console.error(err.stack)

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({
      error: "Validation Error",
      details: errors,
    })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(400).json({
      error: `Duplicate ${field}. This ${field} already exists.`,
    })
  }

  // Mongoose cast error
  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid ID format",
    })
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
    })
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expired",
    })
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  })
}
