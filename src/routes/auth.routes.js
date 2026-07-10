import express from "express";
// Sahi path aur .js extension ke sath:
import { 
  loginController, 
  signupController, 
  otpController, 
//   resetController, 
  forgetPassController, 
  changePassController 
} from "../controllers/auth.controller.js"; 

export const authRoute = express.Router();

authRoute.post("/signup", signupController);
authRoute.post("/otp-verify", otpController);
// authRoute.post("/reset-otp", resetController);
authRoute.post("/login", loginController);
authRoute.post("/forget-password", forgetPassController);
authRoute.post("/change-password", changePassController);