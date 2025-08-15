#!/bin/bash
set -e

echo "🧹 Run terraform lint..."

# Lint the project
echo "Linting project..."
npm run tf:fmt

echo "✅ Format/Lint completed successfully"