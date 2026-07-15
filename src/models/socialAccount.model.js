// src/models/socialAccount.model.js
import mongoose, { model } from "mongoose";

const socialAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['youtube', 'instagram', 'facebook', 'tiktok', 'twitter', 'linkedin'], // QRYZON supported platforms
    required: true
  },
  platformAccountId: {
    type: String, // Jaise YouTube channel ID ya Facebook Page ID
    required: true
  },
  accountName: {
    type: String, // Page/Channel ka display name
    required: true
  },
  profilePicture: {
    type: String // Channel/Page ki profile image (optional)
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String // OAuth refresh token offline access ke liye (Very Important)
  },
  expiresAt: {
    type: Date // Token ki expiry time tracking ke liye
  }
}, { timestamps: true });

// Ek user ek hi platform account ko do bar connect na kar sake
socialAccountSchema.index({ user: 1, platform: 1, platformAccountId: 1 }, { unique: true });

// module.exports = mongoose.model('SocialAccount', socialAccountSchema);
// export const UserModel = model("User", userSchema);

export const SocialAccount = model("SocialAccount", socialAccountSchema)