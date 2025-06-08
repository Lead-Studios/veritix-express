import type { Request, Response, NextFunction } from "express"
import User from "../models/user.model"
import { asyncHandler } from "../middleware/async.middleware"
import { ErrorResponse } from "../utils/errorResponse"
import crypto from "crypto"
import { sendEmail } from "../utils/email"

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    verificationToken: crypto.randomBytes(20).toString("hex"),
  })

  // Send verification email
  const verificationUrl = `${req.protocol}://${req.get("host")}/api/users/verify-email/${user.verificationToken}`

  const message = `
    <h1>Email Verification</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}" target="_blank">Verify Email</a>
  `

  try {
    await sendEmail({
      email: user.email,
      subject: "Email Verification",
      message,
    })

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
    })
  } catch (err) {
    user.verificationToken = undefined
    await user.save()

    return next(new ErrorResponse("Email could not be sent", 500))
  }
})

// @desc    Verify email
// @route   GET /api/users/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findOne({ verificationToken: req.params.token })

  if (!user) {
    return next(new ErrorResponse("Invalid verification token", 400))
  }

  user.isEmailVerified = true
  user.verificationToken = undefined
  await user.save()

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  })
})

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400))
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password")

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401))
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password)

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401))
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    return next(new ErrorResponse("Please verify your email before logging in", 401))
  }

  sendTokenResponse(user, 200, res)
})

// @desc    Log user out / clear cookie
// @route   GET /api/users/logout
// @access  Private
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Update user details
// @route   PUT /api/users/update-details
// @access  Private
export const updateDetails = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const fieldsToUpdate = {
    name: req.body.name,
    bio: req.body.bio,
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Update password
// @route   PUT /api/users/update-password
// @access  Private
export const updatePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user.id).select("+password")

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Password is incorrect", 401))
  }

  user.password = req.body.newPassword
  await user.save()

  sendTokenResponse(user, 200, res)
})

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorResponse("There is no user with that email", 404))
  }

  // Get reset token
  const resetToken = crypto.randomBytes(20).toString("hex")

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")

  // Set expire
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await user.save()

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get("host")}/api/users/reset-password/${resetToken}`

  const message = `
    <h1>Password Reset Request</h1>
    <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetUrl}" target="_blank">Reset Password</a>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    })

    res.status(200).json({ success: true, data: "Email sent" })
  } catch (err) {
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    return next(new ErrorResponse("Email could not be sent", 500))
  }
})

// @desc    Reset password
// @route   PUT /api/users/reset-password/:resettoken
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Get hashed token
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex")

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })

  if (!user) {
    return next(new ErrorResponse("Invalid token", 400))
  }

  // Set new password
  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save()

  sendTokenResponse(user, 200, res)
})

// Get token from model, create cookie and send response
const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  // Create token
  const token = user.getSignedJwtToken()

  const options = {
    expires: new Date(Date.now() + Number.parseInt(process.env.JWT_COOKIE_EXPIRE || "30", 10) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    data: user,
  })
}
