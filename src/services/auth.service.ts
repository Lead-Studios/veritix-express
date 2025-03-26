import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { AppDataSource } from "../config/database"
import { MoreThan } from "typeorm"
import { Admin } from "../entities/admin.entity"
import { Role } from "../entities/role.entity"
import { RefreshToken } from "../entities/refreshToken.entity"
import { CreateAdminDto, LoginAdminDto } from "../dtos/admin.dto"

export class AuthService {
  private adminRepository = AppDataSource.getRepository(Admin)
  private roleRepository = AppDataSource.getRepository(Role)
  private tokenRepository = AppDataSource.getRepository(RefreshToken)

  async createAdmin(adminData: CreateAdminDto): Promise<Admin> {
    const existingAdmin = await this.adminRepository.findOne({
      where: { email: adminData.email },
    })

    if (existingAdmin) {
      throw new Error("Admin with this email already exists")
    }

    const role = await this.roleRepository.findOne({
      where: { id: adminData.roleId },
    })

    if (!role) {
      throw new Error("Role not found")
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10)

    const admin = this.adminRepository.create({
      ...adminData,
      password: hashedPassword,
      role,
    })

    return this.adminRepository.save(admin)
  }

  async login(loginData: LoginAdminDto): Promise<{
    admin: Omit<Admin, "password">
    accessToken: string
    refreshToken: string
  }> {
    const admin = await this.adminRepository.findOne({
      where: { email: loginData.email },
      relations: ["role"],
    })

    if (!admin) {
      throw new Error("Invalid credentials")
    }

    const isPasswordValid = await bcrypt.compare(loginData.password, admin.password)

    if (!isPasswordValid) {
      throw new Error("Invalid credentials")
    }

    const accessToken = this.generateAccessToken(admin)
    const refreshToken = await this.generateRefreshToken(admin)

    // Remove password from response
    const { password, ...adminWithoutPassword } = admin

    return {
      admin: adminWithoutPassword,
      accessToken,
      refreshToken,
    }
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshTokenEntity = await this.tokenRepository.findOne({
      where: { token },
      relations: ["admin"],
    })

    if (!refreshTokenEntity || new Date() > refreshTokenEntity.expiresAt) {
      throw new Error("Invalid or expired refresh token")
    }

    // Delete the used refresh token
    await this.tokenRepository.remove(refreshTokenEntity)

    // Generate new tokens
    const accessToken = this.generateAccessToken(refreshTokenEntity.admin)
    const newRefreshToken = await this.generateRefreshToken(refreshTokenEntity.admin)

    return {
      accessToken,
      refreshToken: newRefreshToken,
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const admin = await this.adminRepository.findOne({ where: { email } })

    if (!admin) {
      // Don't reveal that the email doesn't exist for security reasons
      return
    }

    const resetToken = crypto.randomBytes(32).toString("hex")
    const passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    // const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    admin.passwordResetToken = passwordResetToken
    admin.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.adminRepository.save(admin)

    // In a real application, you would send an email with the reset token
    // For this implementation, we'll just return the token
    return
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    const admin = await this.adminRepository.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: MoreThan(new Date()),
      },
    })

    if (!admin) {
      throw new Error("Invalid or expired token")
    }

    admin.password = await bcrypt.hash(newPassword, 10)
    admin.passwordResetToken = ''
    admin.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.adminRepository.save(admin)
  }

  private generateAccessToken(admin: Admin): string {
    return jwt.sign({ id: admin.id, role: admin.role.name }, process.env.JWT_SECRET as string, { expiresIn: "1h" })
  }

  private async generateRefreshToken(admin: Admin): Promise<string> {
    const token = crypto.randomBytes(40).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const refreshToken = this.tokenRepository.create({
      token,
      expiresAt,
      admin,
    })

    await this.tokenRepository.save(refreshToken)
    return token
  }
}

