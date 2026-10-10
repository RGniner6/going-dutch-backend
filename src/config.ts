import dotenv from "dotenv"
import { z } from "zod"
import path from "path"

// NODE_ENV may be declared inside the local .env file, so load that file
// before checking its value when the shell has not set it yet.
if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  dotenv.config({ path: path.resolve(process.cwd(), "configuration", ".env") })
}

// Define the configuration schema with validation
const ConfigSchema = z.object({
  // Server Configuration
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),

  provider: z.enum(["google", "openai"]).default("google"),
  // Only the selected provider's key is required (validated below).
  geminiApiKey: z.string().default(""),
  openAiApiKey: z.string().default(""),

  // Logging Configuration
  logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Image Processing Configuration
  maxFileSize: z.coerce.number().default(5 * 1024 * 1024), // 5MB
  allowedImageTypes: z
    .string()
    .default(
      "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff",
    ),

  // CORS Configuration
  corsOrigins: z
    .string()
    .default(
      "http://localhost:3000,http://localhost:3001,http://localhost:5173,https://main.d11ijhe1sm8dp5.amplifyapp.com,https://*.amplifyapp.com,https://*.vercel.app,https://*.netlify.app",
    ),

  // Rate Limiting Configuration
  rateLimitWindowMs: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  rateLimitMaxRequests: z.coerce.number().default(10),

  // Receipt Processing Configuration
  receiptProcessingTimeout: z.coerce.number().default(30000), // 30 seconds
  receiptProcessingRetries: z.coerce.number().default(3),
}).superRefine((config, context) => {
  if (config.provider === "google" && !config.geminiApiKey) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["geminiApiKey"],
      message: "GEMINI_API_KEY is required when PROVIDER=google",
    })
  }

  if (config.provider === "openai" && !config.openAiApiKey) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["openAiApiKey"],
      message: "OPEN_AI_API_KEY is required when PROVIDER=openai",
    })
  }
})

// Parse and validate environment variables
export const config = (() => {
  try {
    return ConfigSchema.parse({
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      provider: process.env.PROVIDER,
      geminiApiKey: process.env.GEMINI_API_KEY,
      openAiApiKey: process.env.OPEN_AI_API_KEY,
      logLevel: process.env.LOG_LEVEL,
      maxFileSize: process.env.MAX_FILE_SIZE,
      allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES,
      corsOrigins: process.env.CORS_ORIGINS,
      rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
      receiptProcessingTimeout: process.env.RECEIPT_PROCESSING_TIMEOUT,
      receiptProcessingRetries: process.env.RECEIPT_PROCESSING_RETRIES,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Configuration validation failed:")
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`)
      })
      process.exit(1)
    }
    throw error
  }
})()

// Export individual configuration sections for convenience
export const serverConfig = {
  port: config.port,
  nodeEnv: config.nodeEnv,
  corsOrigins: config.corsOrigins.split(",").map((origin) => origin.trim()),
} as const

export const llmConfig = {
  provider: config.provider,
  geminiApiKey: config.geminiApiKey,
  openAiApiKey: config.openAiApiKey,
  timeout: config.receiptProcessingTimeout,
  retries: config.receiptProcessingRetries,
} as const

export const imageConfig = {
  maxFileSize: config.maxFileSize,
  allowedTypes: config.allowedImageTypes.split(","),
} as const

export const rateLimitConfig = {
  windowMs: config.rateLimitWindowMs,
  maxRequests: config.rateLimitMaxRequests,
} as const

export const loggingConfig = {
  level: config.logLevel,
} as const

// Helper functions
export const isDevelopment = () => config.nodeEnv === "development"
export const isProduction = () => config.nodeEnv === "production"
export const isTest = () => config.nodeEnv === "test"

// Type exports
export type Config = z.infer<typeof ConfigSchema>
export type ServerConfig = typeof serverConfig
export type LLMConfig = typeof llmConfig
export type ImageConfig = typeof imageConfig
export type RateLimitConfig = typeof rateLimitConfig
export type LoggingConfig = typeof loggingConfig
