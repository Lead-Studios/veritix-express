import { AppDataSource } from "../config/database";
import { User } from "../entities/user.entity";
import bcrypt from "bcrypt";

export class UserService {
    private userRepository = AppDataSource.getRepository(User);

    async getUserDetails(userId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    async updateUserProfile(userId: string, updateData: Partial<User>): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) return null;

        Object.assign(user, updateData);
        return this.userRepository.save(user);
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) return false;

        user.password = await bcrypt.hash(newPassword, 10);
        await this.userRepository.save(user);
        return true;
    }

    async updateProfileImage(userId: string, filename: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) return null;

        user.profileImage = filename;
        return this.userRepository.save(user);
    }
}