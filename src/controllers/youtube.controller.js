// src/controllers/youtube.controller.js

import {google} from "googleapis"
import {SocialAccount} from "../models/socialAccount.model.js"

// Setup Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_YOUTUBE_CALLBACK_URL // dynamic callback URL
);

console.log("url",process.env.GOOGLE_YOUTUBE_CALLBACK_URL)

/**
 * 1. Connect YouTube - Generates Consent Screen URL
 */
export const connectYouTube = async (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    // logged-in user ki ID state param ke zariye Google ko bhejenge
    const state = req.user.id; 

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Is se hume Refresh Token lazmi milega
      prompt: 'consent',     // Har bar consent pop-up show karega taake dynamic refresh token skip na ho
      scope: scopes,
      state: state
    });

    return res.status(200).json({ success: true, url });
  } catch (error) {
    console.error("Error generating YouTube Auth URL:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * 2. YouTube Callback - Save as a Social Account
 */
export const youtubeCallback = async (req, res) => {
  const { code, state: userId } = req.query;

  // Agar authorization code missing ho
  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Authorization code missing from Google redirect."
    });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get YouTube Channel Details
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelResponse = await youtube.channels.list({
      part: 'snippet',
      mine: true
    });

    // Safety Check: Agar channel list khali ho
    const channel = channelResponse.data.items?.[0];
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "No YouTube Channel found for this account."
      });
    }

    const channelId = channel.id;
    const channelName = channel.snippet.title;
    const profilePic = channel.snippet.thumbnails?.default?.url;

    // Token expiry calculate karein
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // Naye schema 'SocialAccount' mein data update ya create (upsert) karein
    const savedAccount = await SocialAccount.findOneAndUpdate(
      { user: userId, platform: 'youtube', platformAccountId: channelId },
      {
        accountName: channelName,
        profilePicture: profilePic,
        accessToken: tokens.access_token,
        ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }), // save refresh token if returned
        expiresAt: expiresAt
      },
      { upsert: true, new: true } // Agar pehle se account exist nahi karta to naya create karega
    );


     // Redirect user to frontend dashboard with success status when frontend url integrate
    // return res.redirect(`${process.env.FRONTEND_URL}/dashboard?youtube=connected`);

    // Redirect karne ke bajaye success JSON response bhejein
    return res.status(200).json({
      success: true,
      message: "YouTube Channel Connected Successfully!",
      data: {
        accountId: savedAccount._id,
        platform: savedAccount.platform,
        channelName: savedAccount.accountName,
        channelId: savedAccount.platformAccountId
      }
    });

  } catch (error) {
    console.error("Error in YouTube Callback:", error);
    // Error hone par bhi redirect ke bajaye JSON error response
    return res.status(500).json({
      success: false,
      message: "Internal Server Error during token exchange.",
      error: error.message
    });
  }
};