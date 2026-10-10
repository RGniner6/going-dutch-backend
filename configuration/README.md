# Configuration

This folder contains all configuration files for the application.

## Files

- **`env.template`** - Template for environment variables
- **`.env`** - Your actual environment variables (not committed to git)

## Setup

1. **Copy the template:**

   ```bash
   cp configuration/env.template configuration/.env
   ```

   Skip this step if `configuration/.env` already exists; copying the template
   over it would replace your local settings.

2. **Edit the .env file:**
   ```bash
   # Gemini is the default provider. Add your actual API key:
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Environment Variables

### Required for the default Gemini provider

- `GEMINI_API_KEY` - Your Google Gemini API key

### Optional

- `PROVIDER` - `google` (default) or `openai`
- `OPEN_AI_API_KEY` - Required only when `PROVIDER=openai`

### Optional (with defaults)

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (default: development)
- `LOG_LEVEL` - Logging level (default: info)
- `MAX_FILE_SIZE` - Max upload size in bytes (default: 5MB)
- `CORS_ORIGINS` - Comma-separated allowed origins (includes the local Vite app by default)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 10)

## Security

- The `.env` file is ignored by git to prevent accidental commits of secrets
- Never commit API keys or sensitive configuration to version control
- Use different `.env` files for different environments (development, staging,
  production)
