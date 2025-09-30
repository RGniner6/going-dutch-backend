import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage } from "langchain/schema"
import {
  ReceiptAnalysisResult,
  ReceiptAnalysisResultSchema,
} from "../types/receipt"

export class ReceiptProcessor {
  private model: ChatGoogleGenerativeAI

  constructor(apiKey: string) {
    this.model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.5-flash",
      apiKey: apiKey,
      temperature: 0.1,
    })
  }

  async processReceiptImage(
    imageBuffer: Buffer,
  ): Promise<ReceiptAnalysisResult> {
    try {
      // Convert image buffer to base64
      const base64Image = imageBuffer.toString("base64")

      const systemTemplate = `
        You are an assistant specialized in analyzing receipt images and extracting structured data.
        Your task is to analyze the provided receipt image and extract itemized information.
        
        ### Instructions:
        1. Extract each item with its name, quantity, and individual price
        2. Read the total price from the receipt as well
        3. Identify the currency used and its symbol
        4. If this is NOT a receipt or cannot be processed, provide a brief errorText describing why
        5. If it's not a receipt, set errorText and return empty items array, totalPrice as 0, currency as 'AUD', and currencySymbol as '$'
        6. Be precise with numbers and currency detection
        7. Ensure all numbers are valid (no NaN, Infinity, or negative values for prices/quantities)
        8. Item names should be descriptive and meaningful
        9. Currency should be a standard 3-letter code (USD, EUR, GBP, etc.)
        
        ### Error Examples:
        - "not a receipt" - if the image is not a receipt at all
        - "too blurry" - if the image is too blurry to read
        - "incomplete receipt" - if only part of the receipt is visible
        - "poor image quality" - if the image quality is too low
        - "receipt text not readable" - if text is too small or unclear
        - "no items found" - if no items can be identified on the receipt
        `

      const systemMessage = new SystemMessage({
        content: systemTemplate,
      })

      const humanMessage = new HumanMessage({
        content: [
          {
            type: "text",
            text: "Please analyze this receipt image and extract the itemized data:",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      })

      // Use withStructuredOutput for automatic parsing and validation
      const structuredModel = this!.model!.withStructuredOutput(
        ReceiptAnalysisResultSchema,
      )
      const result = await structuredModel.invoke([systemMessage, humanMessage])

      // Additional business logic validation
      this.validateBusinessLogic(result)

      return result
    } catch (error) {
      console.error("Error processing receipt:", error)

      // If structured output parsing fails, return a safe default
      if (
        error instanceof Error &&
        (error.message.includes("parsing") ||
          error.message.includes("validation") ||
          error.message.includes("schema"))
      ) {
        console.warn("Failed to parse receipt data, returning safe default")
        return {
          items: [],
          totalPrice: 0,
          currency: "USD",
          currencySymbol: "$",
          errorText: "processing error",
        }
      }

      throw new Error(
        `Failed to process receipt: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  private validateBusinessLogic(result: ReceiptAnalysisResult): void {
    // Validate that total price matches sum of items (with small tolerance for rounding)
    if (!result.errorText && result.items.length > 0) {
      const calculatedTotal = result.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      )
      const tolerance = 0.01 // 1 cent tolerance

      if (Math.abs(calculatedTotal - result.totalPrice) > tolerance) {
        console.warn(
          `Total price mismatch: calculated ${calculatedTotal}, reported ${result.totalPrice}`,
        )
        // Don't throw error, just warn - sometimes receipts have taxes, tips, etc.
      }
    }

    // Validate currency format (should be 3-letter code)
    if (result.currency && result.currency.length !== 3) {
      throw new Error(
        `Invalid currency format: ${result.currency}. Expected 3-letter code (e.g., USD, EUR)`,
      )
    }

    // Validate that if there's an error, items should be empty
    if (result.errorText && result.items.length > 0) {
      throw new Error("Images with errors should have empty items array")
    }

    // Validate that if there's no error, it should have items
    if (!result.errorText && result.items.length === 0) {
      console.warn("Receipt processed successfully but no items found")
    }
  }
}
