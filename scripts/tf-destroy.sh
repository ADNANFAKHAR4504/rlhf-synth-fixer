#!/bin/bash
set -e

echo "🧽 Running Destory..."

# Build the project
echo "Clean up project..."
npm run tf:destroy

echo "✅ Destroy completed successfully"