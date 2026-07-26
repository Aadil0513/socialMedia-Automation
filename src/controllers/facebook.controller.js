import axios from 'axios';
// import { UserModel } from "../models/user.model.js";
import { uploadBufferToCloudinary } from '../config/cloudinary.js';
import { SocialAccount } from '../models/socialAccount.model.js'; // Named import

// 1️⃣ Step 1: Facebook OAuth Link Generate Karna
export const getFacebookAuthUrl = (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
  
const scope = [
  'public_profile',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts'
].join(',');

  // URL State Parameter Mein User ID Pass Kar Rahe Hain
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${req.user._id}`;

  return res.status(200).json({ 
    success: true, 
    url: authUrl 
  });
};

// 2️⃣ Step 2: Facebook OAuth Callback (Tokens Exchange & DB Save)
export const facebookCallback = async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code) {
      return res.status(400).send("Facebook authorization failed or denied.");
    }

    // A. Code ko Exchange karke Short-Lived Access Token haasil karein
    const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code
      }
    });

    const shortLivedToken = tokenRes.data.access_token;

    // B. Short-Lived Token ko Long-Lived Token (60 Days Validity) mein convert karein
    const longLivedRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: shortLivedToken
      }
    });

    const longLivedUserToken = longLivedRes.data.access_token;

    // C. User ke Managed Facebook Pages Fetch Karein
    const pagesRes = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedUserToken}`);
    
    const pages = pagesRes.data.data;
    if (!pages || pages.length === 0) {
      return res.status(404).send("No Facebook Pages found associated with this account.");
    }

    // D. Primary Page ka ID aur Page Access Token Select Karein
    const primaryPage = pages[0];

    // E. Database Update via Mongoose
    await User.findByIdAndUpdate(userId, {
      facebookPageId: primaryPage.id,
      facebookAccessToken: primaryPage.access_token,
      isFacebookConnected: true
    });

    // F. Success hone par Frontend par Redirect Karein
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/socials?status=success`);

  } catch (error) {
    console.error("Facebook Connect Error:", error.response?.data || error.message);
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/socials?status=error`);
  }
};



;




export const createFacebookPost = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { caption } = req.body;
    const file = req.file;

    // 1. File Validation
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: "Please select an image or video to post." 
      });
    }

    // 2. Fetch Facebook Account from SocialAccount Schema
    const fbAccount = await SocialAccount.findOne({ 
      user: userId, 
      platform: "facebook" 
    });

    if (!fbAccount || !fbAccount.accessToken || !fbAccount.platformAccountId) {
      return res.status(400).json({ 
        success: false, 
        message: "Facebook page is not connected. Please connect Facebook first." 
      });
    }

    // 3. Upload File Buffer to Cloudinary
    const cloudinaryResult = await uploadBufferToCloudinary(file.buffer, file.mimetype);
    const mediaUrl = cloudinaryResult.secure_url;

    const isVideo = file.mimetype.startsWith('video');
    let fbResponse;

    // 4. Hit Meta Graph API
    if (isVideo) {
      fbResponse = await axios.post(
        `https://graph.facebook.com/v19.0/${fbAccount.platformAccountId}/videos`,
        {
          file_url: mediaUrl,
          description: caption || '',
          access_token: fbAccount.accessToken
        }
      );
    } else {
      fbResponse = await axios.post(
        `https://graph.facebook.com/v19.0/${fbAccount.platformAccountId}/photos`,
        {
          url: mediaUrl,
          caption: caption || '',
          access_token: fbAccount.accessToken
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: `${isVideo ? 'Video' : 'Image'} posted successfully to Facebook Page!`,
      facebookPostId: fbResponse.data.id,
      mediaUrl: mediaUrl
    });

  } catch (error) {
    console.error("Facebook Post Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create Facebook post",
      error: error.response?.data || error.message
    });
  }
};