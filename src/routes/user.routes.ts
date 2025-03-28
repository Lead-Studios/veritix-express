import { Router } from "express";
import passport from "passport";
import { register, login, forgotPassword, resetPassword, refreshToken, verifyEmail } from "../controllers/authControllers";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { uploadProfileImage } from "../middlewares/upload.middleware";

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management API
 */

// Existing routes
router.post("/user/create", register);
router.post("/user/login", login);
router.get("/user/google-auth", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/user/google-auth/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("/dashboard");
});
router.post("/user/forgot-password", forgotPassword);
router.post("/user/reset-password", resetPassword);
router.post("/user/refresh-token", refreshToken);
router.post("/user/verify-email", verifyEmail);

// New profile management routes
router.get("/user/details", authenticate, userController.getUserDetails);
/**
 * @swagger
 * /user/details:
 *   get:
 *     summary: Get user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized
 */

router.put("/user/update-profile", authenticate, userController.updateUserProfile);
/**
 * @swagger
 * /user/update-profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *             required:
 *               - name
 *               - email
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

router.put("/user/change-password", authenticate, userController.changePassword);
/**
 * @swagger
 * /user/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *             required:
 *               - currentPassword
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 *       401:
 *         description: Unauthorized
 */

router.post("/user/upload/profile-image", authenticate, uploadProfileImage, userController.updateProfileImage);
/**
 * @swagger
 * /user/upload/profile-image:
 *   post:
 *     summary: Upload or update user profile image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */

export default router;