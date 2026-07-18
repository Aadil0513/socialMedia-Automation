import jwt from "jsonwebtoken";
import { SessionModel } from "../models/session.model.js";
import { UserModel } from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // 1. Header se token nikalna
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized! Token missing or invalid format", status: false });
    }
    const token = authHeader.split(" ")[1];

    // 2. JWT Verify karna
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // 3. 🚨 Session Check (Kya yeh device logged out toh nahi hai?)
    const activeSession = await SessionModel.findOne({ token: token });
    if (!activeSession) {
      return res.status(401).json({ message: "Session expired! Please login again.", status: false });
    }

    // 4. User data nikal kar request object mein attach karna
    const user = await UserModel.findById(decoded.id).select("-password"); // password ke bagair
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    // Pura data request mein daal diya taaki controller direct use kar sake
    req.user = user;
    req.token = token; 

    next(); // Everything is perfect, agle controller par jao!
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token", status: false });
  }
};