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



// upload video on youtube 

// import fs from 'fs';

// export const uploadVideo = async (req, res) => {
//   const userId = req.user._id; // JWT se logged-in user ki ID
//   const { title, description, tags, privacyStatus } = req.body;

//   // File Validation
//   if (!req.file) {
//     return res.status(400).json({ success: false, message: "Please upload a video file." });
//   }

//   const videoFilePath = req.file.path;

//   try {
//     // 1. Database se is user ka connected YouTube account dhoondein
//     const socialAccount = await SocialAccount.findOne({ user: userId, platform: 'youtube' });

//     if (!socialAccount) {
//       // Agar upload fail ho to temporary saved file ko delete karna zaroori hai
//       fs.unlinkSync(videoFilePath); 
//       return res.status(404).json({ 
//         success: false, 
//         message: "No connected YouTube account found. Please connect your channel first." 
//       });
//     }

//     // 2. Google OAuth Client ko user ke credentials se set karein
//     oauth2Client.setCredentials({
//       access_token: socialAccount.accessToken,
//       refresh_token: socialAccount.refreshToken
//     });

//     // 3. Initialize YouTube API Instance
//     const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

//     // 4. Video Upload Payload & Stream Setup
//     const response = await youtube.videos.insert({
//       part: 'snippet,status',
//       requestBody: {
//         snippet: {
//           title: title || "Uploaded via Automation App",
//           description: description || "Video uploaded automatically.",
//           tags: tags ? tags.split(',') : [], // Comma separated tags ko array banayein
//           categoryId: '22' // 22 is for "People & Blogs" (General)
//         },
//         status: {
//           privacyStatus: privacyStatus || 'private', // 'public', 'private', or 'unlisted'
//           selfDeclaredMadeForKids: false
//         }
//       },
//       media: {
//         mimeType: req.file.mimetype,
//         body: fs.createReadStream(videoFilePath) // Video file stream start karein
//       }
//     });

//     // 5. Temporary file ko upload hone ke baad server se delete kar dein
//     fs.unlinkSync(videoFilePath);

//     return res.status(200).json({
//       success: true,
//       message: "Video uploaded successfully to YouTube!",
//       data: {
//         videoId: response.data.id,
//         videoUrl: `https://www.youtube.com/watch?v=${response.data.id}`,
//         title: response.data.snippet.title
//       }
//     });

//   } catch (error) {
//     // Error ki surat mein temporary file delete karein
//     if (fs.existsSync(videoFilePath)) {
//       fs.unlinkSync(videoFilePath);
//     }

//     console.error("YouTube Upload Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to upload video to YouTube.",
//       error: error.message
//     });
//   }
// };


import { Readable } from 'stream'; // fs ko hata kar isey import karein

export const uploadVideo = async (req, res) => {
  const userId = req.user._id; 
  const { title, description, tags, privacyStatus } = req.body;

  // File Validation
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please upload a video file." });
  }

  try {
    // 1. Database se is user ka connected YouTube account dhoondein
    const socialAccount = await SocialAccount.findOne({ user: userId, platform: 'youtube' });

    if (!socialAccount) {
      return res.status(404).json({ 
        success: false, 
        message: "No connected YouTube account found. Please connect your channel first." 
      });
    }

    // 2. Google OAuth Client ko user ke credentials se set karein
    oauth2Client.setCredentials({
      access_token: socialAccount.accessToken,
      refresh_token: socialAccount.refreshToken
    });

    // 3. Initialize YouTube API Instance
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // ⭐ CRITICAL VERCEL FIX: Memory Buffer ko Readable Stream mein convert karein
    const videoStream = new Readable();
    videoStream.push(req.file.buffer);
    videoStream.push(null); // Stream finish signal

    // 4. Video Upload Payload & Stream Setup
    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title || "Uploaded via Automation App",
          description: description || "Video uploaded automatically.",
          tags: tags ? tags.split(',') : [], 
          categoryId: '22' 
        },
        status: {
          privacyStatus: privacyStatus || 'private', 
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        mimeType: req.file.mimetype,
        body: videoStream // fs.createReadStream ki jagah hamari memory stream jayegi!
      }
    });

    // Note: fs.unlinkSync yahan se hat chuka hai kyunki temporary file bani hi nahi thi

    return res.status(200).json({
      success: true,
      message: "Video uploaded successfully to YouTube!",
      data: {
        videoId: response.data.id,
        videoUrl: `https://www.youtube.com/watch?v=${response.data.id}`,
        title: response.data.snippet.title
      }
    });

  } catch (error) {
    console.error("YouTube Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload video to YouTube.",
      error: error.message
    });
  }
};