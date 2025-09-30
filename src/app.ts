import express, { Request, Response, Application } from "express"
import { upload, processImage } from "./middleware/imageUpload"
import { ReceiptProcessor } from "./services/receiptProcessor"
import { ReceiptProcessingResponse } from "./types/receipt"
import { config, serverConfig, llmConfig, isDevelopment } from "./config"

const app: Application = express()
const port: number = serverConfig.port

// Middleware
app.use(express.json())

// Initialize receipt processor with Google Gemini API key
const receiptProcessor = new ReceiptProcessor(llmConfig)

// Routes
app.get("/ping", (req: Request, res: Response): void => {
  res.send("pong")
})

app.get("/hello", (req: Request, res: Response): void => {
  res.json({ message: "Hello World!" })
})

// POST endpoint for receipt processing
app.post(
  "/api/receipt/process",
  upload.single("image"),
  // @ts-ignore
  processImage,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        const errorResponse: ReceiptProcessingResponse = {
          success: false,
          error: {
            error: "MISSING_FILE",
            message:
              'No image file provided. Please upload an image using the "image" field.',
          },
        }
        res.status(400).json(errorResponse)
        return
      }

      // Process the receipt image
      const result = await receiptProcessor.processReceiptImage(req.file.buffer)

      const successResponse: ReceiptProcessingResponse = {
        success: true,
        data: result,
      }

      res.json(successResponse)
    } catch (error) {
      console.error("Receipt processing error:", error)

      const errorResponse: ReceiptProcessingResponse = {
        success: false,
        error: {
          error: "PROCESSING_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while processing the receipt",
        },
      }

      res.status(500).json(errorResponse)
    }
  },
)

// Error handling middleware
app.use((error: Error, req: Request, res: Response, _next: any): void => {
  console.error("Unhandled error:", error)

  const errorResponse: ReceiptProcessingResponse = {
    success: false,
    error: {
      error: "INTERNAL_ERROR",
      message: "An internal server error occurred",
    },
  }

  res.status(500).json(errorResponse)
})
// app.listen(port)
app.listen(port, (): void => {
  console.log(`🚀 API server running at http://localhost:${port}`)
  console.log(
    `📄 Receipt processing endpoint: POST http://localhost:${port}/api/receipt/process`,
  )
  console.log(`🌍 Environment: ${config.nodeEnv}`)
  if (isDevelopment()) {
    console.log(`🔧 Development mode enabled`)
  }
})
