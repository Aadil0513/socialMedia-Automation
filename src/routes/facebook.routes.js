import express from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js'; // Aapka Existing Auth Middleware

import { getFacebookAuthUrl, facebookCallback , createFacebookPost} from "../controllers/facebook.controller.js"
import { upload } from '../middlewares/multerMiddleware.js'



const router = express.Router();

// Step 1: Endpoint to get OAuth Redirect Link
router.get('/facebook/connect', protectRoute, getFacebookAuthUrl);

// Step 2: Meta Callback Endpoint (No Auth Middleware needed here because Meta redirects here directly)
router.get('/facebook/callback', facebookCallback);


// B. Post Image or Video Route (Multer middleware ke sath)
// 'media' key field name hoga jo Postman/Frontend se file bhejte waqt use hoga
router.post('/post',protectRoute, upload.single('media'), createFacebookPost);

export default router;  

// https://social-media-automation-woad.vercel.app/api/v1/social/facebook/callback

// app.use('/api/v1/social', facebookRoutes);
