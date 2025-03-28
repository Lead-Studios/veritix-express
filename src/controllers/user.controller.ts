import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";

export class UserController {
    private userService = new UserService();

    getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await this.userService.getUserDetails(req.user.id);
            if (!user) return res.status(404).json({ message: "User not found" });

            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    };

    updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const updatedUser = await this.userService.updateUserProfile(req.user.id, req.body);
            if (!updatedUser) return res.status(404).json({ message: "User not found" });

            res.status(200).json(updatedUser);
        } catch (error) {
            next(error);
        }
    };

    changePassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const success = await this.userService.changePassword(req.user.id, currentPassword, newPassword);

            if (!success) return res.status(400).json({ message: "Invalid current password" });

            res.status(200).json({ message: "Password updated successfully" });
        } catch (error) {
            next(error);
        }
    };

    updateProfileImage = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) return res.status(400).json({ message: "No file uploaded" });

            const updatedUser = await this.userService.updateProfileImage(req.user.id, req.file.filename);
            if (!updatedUser) return res.status(404).json({ message: "User not found" });

            res.status(200).json(updatedUser);
        } catch (error) {
            next(error);
        }
    };
}