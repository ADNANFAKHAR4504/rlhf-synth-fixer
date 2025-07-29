#!/bin/bash
set -e

echo "🔨 Running Build..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the project
echo "Building project..."
npm run build

echo "✅ Build completed successfully"