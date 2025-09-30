import multer from "multer"
import sharp from "sharp"
import { Request, Response, NextFunction } from "express"

// Configure multer for memory storage
const storage = multer.memoryStorage()

// File filter to accept only image files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed"))
  }
}

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// Middleware to process and optimize uploaded images
export const processImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          error: "MISSING_FILE",
          message: "No image file provided",
        },
      })
    }

    // Process image with sharp to optimize and convert to consistent format
    const processedBuffer = await sharp(req.file.buffer)
      .resize(2048, 2048, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    // Replace the original buffer with processed buffer
    req.file.buffer = processedBuffer
    req.file.mimetype = "image/jpeg"

    return next()
  } catch (error) {
    console.error("Error processing image:", error)
    return res.status(500).json({
      success: false,
      error: {
        error: "IMAGE_PROCESSING_ERROR",
        message: "Failed to process the uploaded image",
      },
    })
  }
}
