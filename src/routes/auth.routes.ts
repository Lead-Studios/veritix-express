import express from "express";
import passport from "passport";
import jwt from "jwt-simple";
import dotenv from "dotenv";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

dotenv.config();

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID! || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET! || "",
			callbackURL: "http://localhost:5000/auth/google/callback",
		},
		function (
			accessToken: string,
			refreshToken: string,
			profile: any,
			done: Function
		) {
			// Save user info (you can store it in a database)
			const user = { googleId: profile.id, name: profile.displayName };
			const payload = { user: user };
			const token = jwt.encode(payload, process.env.JWT_SECRET!);
			done(null, token);
		}
	)
);

passport.serializeUser(function (user: any, done: Function) {
	done(null, user);
});

passport.deserializeUser(function (user: any, done: Function) {
	done(null, user);
});

const router = express.Router();

// Redirect to Google for OAuth
router.get(
	"/google",
	passport.authenticate("google", {
		scope: ["profile", "email"],
	})
);

// Google callback route
router.get(
	"/google/callback",
	passport.authenticate("google", { failureRedirect: "/" }),
	(req, res) => {
		// Send JWT token to client after successful login
		res.json({ token: req.user });
	}
);

export default router;
