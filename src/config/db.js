// import mongoose from "mongoose"

// export const mongoDB = () =>{

// const URI = process.env.MONGODB_URI
// mongoose.connect(URI)
// .then(()=>console.log("mongoDB connected"))
// .catch((error)=>console.log(" mongoDb not connected!", error.message))

// }

import mongoose from "mongoose";

// Connection state ko track karne ke liye variable (Vercel optimization)
let isConnected = false;

export const mongoDB = async () => {
  const URI = process.env.MONGODB_URI;

  if (!URI) {
    console.log("Error: MONGODB_URI is missing in environment variables!");
    return;
  }

  // ⭐ Optimization 1: Agar pehle se connected hai toh naya connection mat banao
  if (isConnected) {
    console.log("=> Using existing mongoDB connection");
    return;
  }

  try {
    // ⭐ Optimization 2: async/await use karein taake connection ka proper wait ho
    const db = await mongoose.connect(URI);
    
    // Connection state update karein (1 means connected)
    isConnected = db.connections[0].readyState;
    console.log("mongoDB connected successfully");
  } catch (error) {
    console.log("mongoDb not connected!", error.message);
    throw error; // Error throw karein taake function crash handle ho sake
  }
};