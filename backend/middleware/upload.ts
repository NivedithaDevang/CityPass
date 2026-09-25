import multer from "multer";
import path from "path";
import fs from "fs";

// Create destination folder if it doesn't exist
//folder where uploaded profile images will be stored
const uploadDir = "uploads/avatars";

// Create the folder if it doesn't exist.
  // recursive: true also creates any missing parent folders.
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({

    // Decide the folder where the uploaded file should be saved.
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
    // Generate a unique filename for every uploaded image.
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname);
    const userId = req.user?.id || "guest";
    cb(null, `avatar-${userId}-${Date.now()}${ext}`);
    //ex: avatar-11-12092023.jpg
  },
});

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});