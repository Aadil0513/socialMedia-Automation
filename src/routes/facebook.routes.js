import express from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js'; // Aapka Existing Auth Middleware

import { getFacebookAuthUrl, facebookCallback} from "../controllers/facebook.controller.js"

import { protectRoute } from "../middlewares/auth.middleware.js"; // Existing common auth middleware


const router = express.Router();

// Step 1: Endpoint to get OAuth Redirect Link
router.get('/facebook/connect', protectRoute, getFacebookAuthUrl);

// Step 2: Meta Callback Endpoint (No Auth Middleware needed here because Meta redirects here directly)
router.get('/facebook/callback', facebookCallback);

export default router;  