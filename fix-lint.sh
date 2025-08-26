#!/bin/bash
# Fix Go formatting issues automatically
set -e

echo "🔧 Auto-fixing Go formatting issues..."

if command -v gofmt > /dev/null 2>&1; then
    echo "Running gofmt -w on all Go files..."
    gofmt -w lib/ tests/ 2>/dev/null || true
    echo "✅ Go files formatted"
else
    echo "❌ gofmt not available"
fi

echo "🔍 Re-running lint check..."
./scripts/lint.sh