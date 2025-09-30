import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenAI } from "@langchain/openai"
import { StructuredOutputParser } from "langchain/output_parsers"
import {
  ReceiptAnalysisResult,
  ReceiptAnalysisResultSchema,
} from "../types/receipt"
import { LLMConfig } from "../config"

export class ReceiptProcessor {
  private model: ChatGoogleGenerativeAI | ChatOpenAI
  private parser: StructuredOutputParser<typeof ReceiptAnalysisResultSchema>

  constructor(config: LLMConfig) {
    this.model =
      config.provider === "google"
        ? new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: config.geminiApiKey,
            temperature: 0.01,
          })
        : new ChatOpenAI({
            model: "gpt-4o-mini",
            openAIApiKey: config.openAiApiKey,
            temperature: 0.01,
          })

    // Initialize the structured output parser
    this.parser = StructuredOutputParser.fromZodSchema(
      ReceiptAnalysisResultSchema,
    )
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
        4. Extract additional costs like taxes, surcharges, tips, service charges, etc.
        5. For each additional cost, indicate whether it's already included in the price of each item or if it's additional
        6. If this is NOT a receipt or cannot be processed, provide a brief errorText describing why
        7. If it's not a receipt, set errorText and return empty items array, totalPrice as 0, currency as 'USD', and currencySymbol as '$'
        8. Be precise with numbers and currency detection
        9. Ensure all numbers are valid (no NaN, Infinity, or negative values for prices/quantities)
        10. Item names should be descriptive and as on the receipt
        11. Currency should be a standard 3-letter code (USD, EUR, GBP, etc.)
        
        ### Additional Costs Examples:
        - Tax (VAT, GST, Sales Tax) - usually included in subtotal
        - Service Charge - may or may not be included
        - Tip/Gratuity - usually not included in subtotal
        - Delivery Fee - usually not included in subtotal
        - Processing Fee - usually included in subtotal
        - Surcharge - usually included in subtotal
        
        ### Error Examples:
        - "not a receipt" - if the image is not a receipt at all
        - "too blurry" - if the image is too blurry to read
        - "incomplete receipt" - if only part of the receipt is visible
        - "poor image quality" - if the image quality is too low
        - "receipt text not readable" - if text is too small or unclear
        - "no items found" - if no items can be identified on the receipt
        
        ### Output Format:
        ${this.parser.getFormatInstructions()}
        
        ### Important Notes:
        - Do not return explanations or text outside the JSON format
        - Return valid JSON without any markdown code blocks or quotations
        - Ensure the JSON is properly formatted and valid
      `

      console.time("🕐 LLM API Request")
      const response = await this.model.invoke([
        ["system", systemTemplate],
        [
          "user",
          [
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
        ],
      ])
      console.timeEnd("🕐 LLM API Request")

      // Use StructuredOutputParser to parse the response
      try {
        const result = await this.parser.parse(String(response.content))

        // Additional business logic validation
        this.validateBusinessLogic(result)

        return result
      } catch (validationError) {
        console.warn(
          "Failed to parse receipt data, returning safe default:",
          validationError,
        )
        return {
          items: [],
          totalPrice: 0,
          currency: "USD",
          currencySymbol: "$",
          additionalCosts: [],
          errorText: "parsing error",
        }
      }
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
          additionalCosts: [],
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
      const itemsTotal = result.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      )

      // Calculate additional costs that are excluded in the subtotal
      const includedAdditionalCosts = (result.additionalCosts || [])
        .filter((cost) => cost.additionalCost)
        .reduce((sum, cost) => sum + cost.amount, 0)

      const calculatedTotal = itemsTotal + includedAdditionalCosts
      const tolerance = 0.01 // 1 cent tolerance

      if (Math.abs(calculatedTotal - result.totalPrice) > tolerance) {
        console.warn(
          `Total price mismatch: calculated ${calculatedTotal}, reported ${result.totalPrice}`,
        )
        // Don't throw error, just warn - sometimes receipts have complex calculations
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

    // Validate additional costs
    if (result.additionalCosts) {
      for (const cost of result.additionalCosts) {
        if (cost.amount < 0) {
          throw new Error(
            `Additional cost amount cannot be negative: ${cost.name}`,
          )
        }
        if (!cost.name || cost.name.trim().length === 0) {
          throw new Error("Additional cost name cannot be empty")
        }
      }
    }
  }
}
