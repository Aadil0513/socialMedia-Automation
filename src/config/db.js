import mongoose from "mongoose"

export const mongoDB = () =>{

const URI = process.env.MONGODB_URI
mongoose.connect(URI)
.then(()=>console.log("mongoDB connected"))
.catch((error)=>console.log(" mongoDb not connected!", error.message))

}