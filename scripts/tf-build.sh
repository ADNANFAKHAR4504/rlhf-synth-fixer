#!/bin/bash
set -e

echo "⚒️ Running Build..."

# Build the project
echo "Building project..."
npm run tf:init

echo "✅ Build completed successfully"