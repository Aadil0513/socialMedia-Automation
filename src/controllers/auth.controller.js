import { UserModel } from "../models/user.model.js";
import { OtpModel } from "../models/otp.model.js";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

// Reusable Transporter Logic
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });
};

// ==========================================
// 1. SIGNUP CONTROLLER
// ==========================================
export const signupController = async (req, res) => {
  try {
    const { name, phoneNumber, email, password } = req.body;

    if (!name || !phoneNumber || !email || !password) {
      return res.status(400).json({ message: "Required fields are missing!", status: false });
    }

    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists", status: false });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const userData = { ...req.body, password: hashPassword, isVerified: false };

    // Numerical 6-digit OTP is cleaner, but if you want UUID substring:
    const otp = uuidv4().slice(0, 6).toUpperCase();

    // Send Verification Email
    const transporter = createTransporter();
    await transporter.sendMail({
      subject: "Verify your email",
      from: process.env.EMAIL,
      to: email,
      html: `
        <div style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 10px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); font-family: Arial, sans-serif;">
          <h2>Hello ${name}</h2>
          <p>Your OTP code for verifying your request at <b>@dz Solutions</b> is:</p>
          <div style="display: inline-block; margin: 20px 0; padding: 14px 26px; background: #4a6cf7; color: #ffffff; font-size: 22px; font-weight: bold; border-radius: 8px; letter-spacing: 4px;">${otp}</div>
          <p>This code is valid for 10 minutes.</p>
          <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">© ${new Date().getFullYear()} @dz Solutions</div>
        </div>
      `,
    });

    await OtpModel.create({ email, otp, isUsed: false });
    await UserModel.create(userData);

    return res.status(201).json({ message: "User signed up successfully. Verification OTP sent.", status: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Something went wrong!", status: false });
  }
};

// ==========================================
// 2. OTP VERIFICATION CONTROLLER
// ==========================================
export const otpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Required fields are missing!", status: false });
    }

    const latestOtpRecord = await OtpModel.findOne({ email, isUsed: false }).sort({ createdAt: -1 });

    if (!latestOtpRecord || latestOtpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP!", status: false });
    }

    // FIX: Using findByIdAndUpdate for proper ID matching
    await OtpModel.findByIdAndUpdate(latestOtpRecord._id, { isUsed: true });
    await UserModel.findOneAndUpdate({ email }, { isVerified: true });

    return res.status(200).json({ message: "OTP verified successfully", status: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Something went wrong!", status: false });
  }
};

// ==========================================
// 3. LOGIN CONTROLLER
// ==========================================
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Required fields are missing!", status: false });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password", status: false });
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      return res.status(401).json({ message: "Invalid email or password", status: false });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Your email is not verified. Please verify your email first.", status: false });
    }

    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "24h" });

    // FIX: Hashed password completely removed from response data object
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };

    return res.status(200).json({
      message: "User logged in successfully",
      status: true,
      data: userData,
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Something went wrong!", status: false });
  }
};

// ==========================================
// 4. FORGET PASSWORD CONTROLLER
// ==========================================
export const forgetPassController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required!", status: false });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid email address", status: false });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.SECRET_KEY, { expiresIn: "10m" });
    const FE_URL = `${process.env.FRONTEND_URL}changePassword?q=${token}`;

    const transporter = createTransporter();
    await transporter.sendMail({
      subject: "Reset Password Link",
      from: process.env.EMAIL,
      to: email,
      html: `
        <html>
          <body>
            <p>You requested a password reset. Click the button below to set a new password. This link is valid for 10 minutes.</p>
            <a href="${FE_URL}" target="_blank" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Change Password</a>
          </body>
        </html>
      `,
    });

    return res.status(200).json({ message: "Forget password link sent to your email", status: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Something went wrong!", status: false });
  }
};

// ==========================================
// 5. CHANGE PASSWORD CONTROLLER
// ==========================================
export const changePassController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Required fields are missing!", status: false });
    }

    // jwt.verify automatically throws error if token is expired or altered
    const verifyToken = jwt.verify(token, process.env.SECRET_KEY);

    if (!verifyToken.email || !verifyToken.id) {
      return res.status(400).json({ message: "Invalid token structure", status: false });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.findByIdAndUpdate(verifyToken.id, { password: hashPassword });

    return res.status(200).json({ message: "Password changed successfully!", status: true });
  } catch (error) {
    return res.status(401).json({ message: "Token expired or invalid link!", status: false });
  }
};