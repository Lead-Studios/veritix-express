import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database"; // Adjust the path if needed
import { User } from "../models/User";
import nodemailer from 'nodemailer';
const generateToken = (user: any) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: "1h" });

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const userRepo = AppDataSource.getRepository(User); // ✅ Corrected

    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = userRepo.create({ name, email, password: hashedPassword });
    await userRepo.save(newUser);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const userRepo = AppDataSource.getRepository(User); // ✅ Corrected

    const user = await userRepo.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: decoded.id } });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Hash new password and save
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await userRepo.save(user);

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired reset token." });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(400).json({ message: "Refresh token is required." });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string);
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: (decoded as any).id } });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate a new JWT token
    const newToken = generateToken(user);

    res.status(200).json({ token: newToken });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired refresh token." });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: decoded.id } });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Mark the user as verified
    user.isVerified = true;
    await userRepo.save(user);

    res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired verification token." });
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASSWORD, // Your email password
  }
});

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email } });

  if (!user) return res.status(404).json({ message: "User not found" });

  // Generate a reset token
  const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  // Send email with reset link
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await transporter.sendMail({
    to: email,
    subject: 'Password Reset Request',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
  });

  res.status(200).json({ message: "Password reset email sent." });
};