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

import { protectRoute } from "../middlewares/auth.middleware.js";

export const authRoute = express.Router();

authRoute.post("/signup", signupController);
authRoute.post("/otp-verify", otpController);
authRoute.post("/reset-otp", resetOtpController);
authRoute.post("/login", loginController);
authRoute.post("/forget-password", forgetPassController);
authRoute.post("/change-password", changePassController);
authRoute.post("/logout" ,protectRoute,logoutController)