// import multer from "multer";
// import path from "path";
// import fs from "fs";

// 1. Temporary "uploads" folder check aur create karna
// Taaki agar folder na ho toh auto-create ho jaye aur crash na ho
// const uploadDir = "./uploads";
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // 2. Storage Engine Configuration
// const storage = multer.memoryStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir); // Temporary files yahan save hongi
//   },
//   filename: function (req, file, cb) {
//     // File ka unique naam rakhne ke liye timestamp lagate hain
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
//   },
// });

// // 3. File Filter (Sirf Images allow karne ke liye)
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|webp|gif/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (extname && mimetype) {
//     return cb(null, true);
//   } else {
//     cb(new Error("Only image files (jpg, jpeg, png, webp, gif) are allowed!"), false);
//   }
// };

// // 4. Export Multer instance
// export const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB file limit
// });


import multer from 'multer';
import path from 'path';

// 1. Pure Memory Storage Configuration
// Isme koi destination ya filename function nahi hota, file seedha buffer (RAM) mein aati hai
const storage = multer.memoryStorage();

// 2. File Filter (Sirf Images allow karne ke liye)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, jpeg, png, webp, gif) are allowed!"), false);
  }
};

// 3. Export Multer instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB file limit
});