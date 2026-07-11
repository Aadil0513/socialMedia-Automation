import { Schema, model } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true, // Yahan hum Refresh Token ya Session Token save karenge
    },
    deviceInfo: {
      type: String, // Frontend se hum device ka naam ya User-Agent mangwa sakte hain
      default: "Unknown Device",
    },
  },
  { timestamps: true }
);

export const SessionModel = model("Session", sessionSchema);