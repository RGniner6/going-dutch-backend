#!/bin/bash

# Configuration setup script for going-dutch project

echo "🔧 Setting up configuration for going-dutch..."

# Check if configuration directory exists
if [ ! -d "configuration" ]; then
    echo "❌ Configuration directory not found!"
    exit 1
fi

# Check if .env already exists
if [ -f "configuration/.env" ]; then
    echo "⚠️  configuration/.env already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ Keeping existing configuration"
        exit 0
    fi
fi

# Copy template to .env
cp configuration/env.template configuration/.env

echo "✅ Created configuration/.env from template"
echo ""
echo "📝 Next steps:"
echo "1. Edit configuration/.env with your actual API keys"
echo "2. Run 'npm run dev' to start the API for local development"
echo ""
echo "🔑 Required for the default Google provider: GEMINI_API_KEY"
echo "   OpenAI is optional (set PROVIDER=openai and OPEN_AI_API_KEY to use it)"
echo "   Get it from: https://makersuite.google.com/app/apikey"
