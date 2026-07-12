import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "../models/user.model.js";


console.log("My Google ID is:", process.env.GOOGLE_CLIENT_ID);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check karein kya yeh user pehle se database mein hai?
        let user = await UserModel.findOne({ email: profile.emails[0].value });

        if (!user) {
          // 2. Agar user nahi hai, to naya user create karein
          user = await UserModel.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            isVerified: true, // Google accounts verified hote hain
            password: "GOOGLE_LOGIN_OAUTH_NO_PASSWORD", // Secure dummy text kyunki password nahi chahiye
            phoneNumber: "N/A"
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);