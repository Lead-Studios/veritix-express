import { Router } from "express";
import passport from "passport";
import { register, login,forgotPassword, resetPassword, refreshToken, verifyEmail} from "../controllers/authControllers";



const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management API
 */

router.post("/user/create", register);
/**
 * @swagger
 * /user/create:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
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
 *               password:
 *                 type: string
 *             required:
 *               - name
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: User already exists
 *       500:
 *         description: Server error
 */


router.post("/user/login", login);
/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: JWT token generated
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */

router.get(
  "/user/google-auth",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/user/google-auth/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

router.post("/user/forgot-password", forgotPassword);

router.post("/user/reset-password", resetPassword);


router.post("/user/refresh-token", refreshToken);


router.post("/user/verify-email", verifyEmail);
export default router;
