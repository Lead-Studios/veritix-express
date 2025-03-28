import { AppDataSource } from "../config/database"
import fs from "fs"
import path from "path"
import { Admin } from "../entities/admin.entity"
import { UpdateProfileDto } from "../dtos/admin.dto"

export class AdminService {
  private adminRepository = AppDataSource.getRepository(Admin)

  async getProfile(adminId: number): Promise<Omit<Admin, "password">> {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId },
      relations: ["role"],
    })

    if (!admin) {
      throw new Error("Admin not found")
    }

    // Remove password from response
    const { password, ...adminWithoutPassword } = admin
    return adminWithoutPassword
  }

  async updateProfile(adminId: number, updateData: UpdateProfileDto): Promise<Omit<Admin, "password">> {
    const admin = await this.adminRepository.findOne({ where: { id: adminId } })

    if (!admin) {
      throw new Error("Admin not found")
    }

    // Update only provided fields
    if (updateData.firstName) admin.firstName = updateData.firstName
    if (updateData.lastName) admin.lastName = updateData.lastName

    const updatedAdmin = await this.adminRepository.save(admin)

    // Remove password from response
    const { password, ...adminWithoutPassword } = updatedAdmin
    return adminWithoutPassword
  }

  async uploadProfileImage(adminId: number, filename: string): Promise<Omit<Admin, "password">> {
    const admin = await this.adminRepository.findOne({ where: { id: adminId } })

    if (!admin) {
      throw new Error("Admin not found")
    }

    // Delete old profile image if exists
    if (admin.profileImage) {
      const oldImagePath = path.join(__dirname, "../../uploads", admin.profileImage)
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }
    }

    admin.profileImage = filename
    const updatedAdmin = await this.adminRepository.save(admin)

    // Remove password from response
    const { password, ...adminWithoutPassword } = updatedAdmin
    return adminWithoutPassword
  }
}

