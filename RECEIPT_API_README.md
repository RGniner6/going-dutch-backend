# Receipt Processing API

A TypeScript Express API that processes receipt images using LangChain and
Google Gemini to extract itemized data.

## Features

- **POST `/api/receipt/process`** - Process receipt images and extract:
  - Itemized list (name, quantity, price)
  - Total price
  - Currency and currency symbol
  - Error description (if image cannot be processed as receipt)

- **Type-safe** - Full TypeScript support with Zod schema validation
- **Modern LangChain** - Uses `withStructuredOutput()` for automatic parsing and
  validation
- **Simplified parsing** - No manual JSON parsing - LangChain handles structured
  output automatically
- **Image processing** - Supports common image formats (JPEG, PNG, WebP, GIF,
  BMP, TIFF)
- **Error handling** - Comprehensive error responses with graceful fallbacks
- **Image optimization** - Automatic image resizing and optimization
- **Business logic validation** - Additional checks for receipt consistency

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:** Create a `.env` file in the root directory:

   ```bash
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

3. **Get Google Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

4. **Build and run:**
   ```bash
   npm run build
   npm start
   ```

## API Usage

### Process Receipt

**Endpoint:** `POST /api/receipt/process`

**Content-Type:** `multipart/form-data`

**Body:**

- `image` (file) - The receipt image file

**Example using curl:**

```bash
curl -X POST \
  http://localhost:3000/api/receipt/process \
  -F "image=@/path/to/receipt.jpg"
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "name": "Coffee",
        "quantity": 2,
        "price": 4.5
      },
      {
        "name": "Sandwich",
        "quantity": 1,
        "price": 8.99
      }
    ],
    "totalPrice": 13.49,
    "currency": "USD",
    "currencySymbol": "$"
  }
}
```

**Error Response (when image cannot be processed as receipt):**

```json
{
  "success": true,
  "data": {
    "items": [],
    "totalPrice": 0,
    "currency": "USD",
    "currencySymbol": "$",
    "errorText": "too blurry"
  }
}
```

**Processing Error Response:**

```json
{
  "success": false,
  "error": {
    "error": "PROCESSING_ERROR",
    "message": "Failed to process receipt: Invalid image format"
  }
}
```

## Supported Image Formats

- JPEG/JPG
- PNG
- WebP
- GIF
- BMP
- TIFF

## File Size Limit

Maximum file size: 10MB

## Development

```bash
# Watch mode for development
npm run watch

# Run tests
npm test
```
