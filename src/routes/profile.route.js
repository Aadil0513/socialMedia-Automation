import express from "express";
import fs from "fs";
import { protectRoute } from "../middlewares/auth.middleware.js"; // Existing common auth middleware
import { upload } from "../middlewares/multerMiddleware.js"; // Aapka multer configuration middleware
import { cloudinaryUploader } from "../config/cloudinary.js"; // Cloudinary config uploader
import { UserModel } from "../models/user.model.js";

export const profileRoute = express.Router();

// ==========================================
// 1. GET Current Logged-in User 👤
// ==========================================
profileRoute.get("/me", protectRoute, async (req, res) => {
  try {
    // protectRoute aapko user ki id 'req.user.id' ya 'req.userId' mein deta hai (apne middleware ke hisab se use karein)
    const userId = req.userId || req.user?.id; 
    
    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching profile:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 2. UPDATE User Name, Phone & Bio 📝
// ==========================================
profileRoute.put("/update", protectRoute, async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { name, phoneNumber, bio } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (phoneNumber) fieldsToUpdate.phoneNumber = phoneNumber;
    if (bio !== undefined) fieldsToUpdate.bio = bio;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

// ==========================================
// 3. UPLOAD Profile Image to Cloudinary 📸
// ==========================================
profileRoute.post(
  "/upload",
  protectRoute,
  upload.single("profileImage"),
  async (req, res) => {
    const userId = req.userId || req.user?.id;
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Please select an image to upload." });
      }

      console.log("File received at path:", req.file.path);

      // Cloudinary configuration push
      const imageRes = await cloudinaryUploader.upload(req.file.path, {
        folder: "social_media_profiles", // Cloudinary cloud directory name
      });

      console.log("Cloudinary URL generated:", imageRes.secure_url);

      // Save secure_url to user's database document
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { imageUrl: imageRes.secure_url },
        { new: true }
      ).select("-password");

      res.status(200).json({
        success: true,
        message: "Image uploaded and database updated!",
        url: imageRes.secure_url,
        data: updatedUser
      });

    } catch (error) {
      console.error("Error uploading image:", error.message);
      res.status(500).json({ success: false, message: "Image upload failed. Server Error." });
    } finally {
      // Safe local file cleanup (Vercel/Local storage cleaning)
      if (req.file && req.file.path) {
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log("Temporary file cleared safely.");
          }
        } catch (unlinkError) {
          console.error("Failed to clear local file:", unlinkError.message);
        }
      }
    }
  }
);