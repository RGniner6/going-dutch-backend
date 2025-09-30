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

2. **Edit the .env file:**
   ```bash
   # Add your actual API keys and configuration values
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Environment Variables

### Required

- `GEMINI_API_KEY` - Your Google Gemini API key

### Optional (with defaults)

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (default: development)
- `LOG_LEVEL` - Logging level (default: info)
- `MAX_FILE_SIZE` - Max upload size in bytes (default: 5MB)
- `CORS_ORIGIN` - CORS origin (default: http://localhost:3000)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 10)

## Security

- The `.env` file is ignored by git to prevent accidental commits of secrets
- Never commit API keys or sensitive configuration to version control
- Use different `.env` files for different environments (development, staging,
  production)
