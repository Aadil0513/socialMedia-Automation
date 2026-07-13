import express from "express";
// Sahi path aur .js extension ke sath:
import { 
  loginController, 
  signupController, 
  otpController, 
  resetOtpController, 
  forgetPassController, 
  changePassController ,
  logoutController
} from "../controllers/auth.controller.js"; 
import passport from "passport";

import { protectRoute } from "../middlewares/auth.middleware.js";
import { SessionModel } from "../models/session.model.js";
import "../config/passport.js";
import jwt from "jsonwebtoken";


export const authRoute = express.Router();

authRoute.post("/signup", signupController);
authRoute.post("/otp-verify", otpController);
authRoute.post("/reset-otp", resetOtpController);
authRoute.post("/login", loginController);
authRoute.post("/forget-password", forgetPassController);
authRoute.post("/change-password", changePassController);
authRoute.post("/logout" ,protectRoute,logoutController)




// 1. User ko Google login page par bhejne ke liye
authRoute.get(
  "/google",
  passport.authenticate("google", { 
    scope: ["profile", "email"], 
    session: false,
    prompt: "select_account" // Senior dev choice for testing multi-user workflows smoothly
  })
);

authRoute.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// 2. Google login ke baad is redirect URL par bhejega
authRoute.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      // 3. JWT Token generate karein
      const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "24h" });

      // 4. Multiple Device Session active karein (Database mein save karein)
      await SessionModel.create({
        userId: user._id,
        token: token,
        deviceInfo: req.headers["user-agent"] || "Google Login Device",
      });

      // 5. Frontend par token query parameter ke zariye bhej dein
      // Taaki frontend is token ko localStorage mein save kar sake
      // const FRONTEND_REDIRECT_URL = `${process.env.FRONTEND_URL || "http://localhost:5173/"}oauth-success?token=${token}`;
      
      // return res.redirect(FRONTEND_REDIRECT_URL);
        return res.status(200).json({
        message: "Google Login Successful (Backend Only Test)!",
        status: true,
        token: token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });

    } catch (error) {

      console.log("error", error.message,error)
      return res.status(500).json({ message: "Google Authentication Failed", status: false });
    }
  }
);