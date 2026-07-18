// src/app.js
import "dotenv/config";
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
// import dotenv from 'dotenv';
import { mongoDB } from './config/db.js';
import { authRoute } from "./routes/auth.routes.js";
import {profileRoute} from "./routes/profile.route.js"
import {socailMedia}  from "./routes/soicalMedia.routes.js"
// Load environment variables
// dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: true, credentials: true })); // Frontend integration ke liye lazmi hay
app.use(express.json()); // JSON bodies parse karne ke liye
app.use(cookieParser()); // Cookies read karne ke liye (Refresh Token ke liye)

mongoDB()
// Base Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Auth Server is running smoothly!' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});



app.use("/api/v1/auth", authRoute);
app.use("/api/v1/profile", profileRoute);
app.use("/api/v1/social",socailMedia)
app.use("/api/v1/youtube",socailMedia)


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;