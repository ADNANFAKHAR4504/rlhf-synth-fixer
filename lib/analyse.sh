#!/usr/bin/env bash

# AWS Infrastructure Compliance Analysis Script
# This script runs the TypeScript compliance scanner

set -e

echo "=== AWS Infrastructure Compliance Analysis ==="
echo ""

# Check if required dependencies are installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if TypeScript/ts-node is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not installed"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Project root: $PROJECT_ROOT"
echo "Script directory: $SCRIPT_DIR"
echo ""

# Change to project root
cd "$PROJECT_ROOT"

# Check if node_modules exists, if not run npm install
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Run the TypeScript analysis script using ts-node
echo "🔍 Running compliance scanner..."
echo ""

# Execute the TypeScript analysis script
npx ts-node "$SCRIPT_DIR/analyse.ts"

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Analysis completed successfully"
else
    echo ""
    echo "❌ Analysis failed with exit code: $EXIT_CODE"
fi

exit $EXIT_CODE
