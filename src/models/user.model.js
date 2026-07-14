// import { Schema, model } from "mongoose";

// const userSchema = new Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       unique: true, // Ek email se do account nahi ban sakenge
//       lowercase: true, // Email hamesha small letters mein save hoga (prevents case mismatch)
//       trim: true, // Extra spaces ko remove kar dega
//     },
//     phoneNumber: {
//       type: String,
//       required: [true, "Phone number is required"],
//       trim: true,
//     },
//     password: {
//       type: String,
//       required: [true, "Password is required"],
//     },
//     isVerified: {
//       type: Boolean,
//       default: false, // Signup par account false hoga, OTP verify hone par true ho jayega
//     },
//     roles: {
//       type: [String],
//       default: ["USER"], // Future-proofing ke liye roles array (e.g., USER, ADMIN)
//     }
//   },
//   { 
//     timestamps: true // Isse createdAt aur updatedAt fields automatically ban jayengi
//   }
// );

// export const UserModel = model("User", userSchema);

import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    roles: {
      type: [String],
      default: ["USER"],
    },
    // 👤 Naye Profile Fields (Added)
    imageUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
    },
    bio: {
      type: String,
      maxLength: 160,
      default: "",
    },
    // 🔗 Connected Social Accounts (Future Use)
    connectedAccounts: {
      linkedin: { accessToken: String, accountId: String, profileName: String },
      facebook: { accessToken: String, pageId: String, pageName: String },
      instagram: { accessToken: String, accountId: String, username: String }
    }
  },
  { 
    timestamps: true 
  }
);

export const UserModel = model("User", userSchema);