import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getRepository } from "typeorm";
import { User } from "../models/User";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "/user/google-auth/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const userRepo = getRepository(User);
      let user = await userRepo.findOne({ where: { googleId: profile.id } });

      if (!user) {
        user = userRepo.create({
          name: profile.displayName,
          email: profile.emails?.[0].value,
          googleId: profile.id,
          isVerified: true,
        });
        await userRepo.save(user);
      }
      return done(null, user);
    }
  )
);
