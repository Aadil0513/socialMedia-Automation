import express from "express"
import { protectRoute } from "../middlewares/auth.middleware.js";
import {connectYouTube , youtubeCallback} from "../controllers/youtube.controller.js"


export const socailMedia = express.Router()


socailMedia.get("/connect" , protectRoute,connectYouTube)
socailMedia.get('/callback',protectRoute, youtubeCallback)





