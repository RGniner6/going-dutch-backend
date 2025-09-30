import { z } from "zod"

// Zod schemas for validation
export const ReceiptItemSchema = z.object({
  name: z.string().min(1, "Item name cannot be empty"),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().nonnegative("Price cannot be negative"),
})

export const AdditionalCostSchema = z.object({
  name: z.string().min(1, "Additional cost name cannot be empty"),
  amount: z.number().nonnegative("Additional cost amount cannot be negative"),
  additionalCost: z
    .boolean()
    .describe(
      "Whether this cost is already included in the subtotal (sum of cost of each item) or if it is an additional cost",
    ),
})

export const ReceiptAnalysisResultSchema = z.object({
  items: z.array(ReceiptItemSchema),
  additionalCosts: z
    .array(AdditionalCostSchema)
    .optional()
    .describe("Additional costs like taxes, surcharges, tips, etc."),
  totalPrice: z.number().nonnegative("Total price cannot be negative"),
  currency: z.string().min(1, "Currency cannot be empty"),
  currencySymbol: z.string().optional(),
  errorText: z
    .string()
    .optional()
    .describe(
      'Brief description of why this image could not be processed as a receipt (e.g., "not a receipt", "too blurry", "incomplete receipt", "multiple receipts")',
    ),
})

export const ReceiptProcessingErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
})

export const ReceiptProcessingResponseSchema = z.object({
  success: z.boolean(),
  data: ReceiptAnalysisResultSchema.optional(),
  error: ReceiptProcessingErrorSchema.optional(),
})

// TypeScript types inferred from Zod schemas
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>
export type AdditionalCost = z.infer<typeof AdditionalCostSchema>
export type ReceiptAnalysisResult = z.infer<typeof ReceiptAnalysisResultSchema>
export type ReceiptProcessingError = z.infer<
  typeof ReceiptProcessingErrorSchema
>
export type ReceiptProcessingResponse = z.infer<
  typeof ReceiptProcessingResponseSchema
>

// Validation helper functions
export const validateReceiptItem = (data: unknown): ReceiptItem => {
  return ReceiptItemSchema.parse(data)
}

export const validateReceiptAnalysisResult = (
  data: unknown,
): ReceiptAnalysisResult => {
  return ReceiptAnalysisResultSchema.parse(data)
}

export const validateReceiptProcessingResponse = (
  data: unknown,
): ReceiptProcessingResponse => {
  return ReceiptProcessingResponseSchema.parse(data)
}
