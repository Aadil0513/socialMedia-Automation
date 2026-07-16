import express from "express"
import { protectRoute } from "../middlewares/auth.middleware.js";
import {connectYouTube , youtubeCallback} from "../controllers/youtube.controller.js"
import {uploadVideo} from '../controllers/youtube.controller.js'
import multer from "multer";


export const socailMedia = express.Router()


// POST /api/v1/youtube/upload
// 'video' field name hoga jo Postman ya frontend se pass hoga

socailMedia.get("/connect" , protectRoute,connectYouTube)
socailMedia.get('/callback', youtubeCallback)

// upload video  on youtube
const upload = multer({ dest: 'uploads/' }); 
socailMedia.post('/upload', protectRoute, upload.single('video'), uploadVideo)




