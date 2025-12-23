#!/bin/bash
# Check for required documentation files
# This script validates that all required documentation files exist for Claude review
set -e

echo "🔍 Checking for required documentation files..."

if [ ! -f "lib/PROMPT.md" ]; then
  echo "❌ lib/PROMPT.md not found, exiting with failure"
  exit 1
fi

if [ ! -f "lib/MODEL_RESPONSE.md" ]; then
  echo "❌ lib/MODEL_RESPONSE.md not found, exiting with failure"
  exit 1
fi

if [ ! -f "lib/IDEAL_RESPONSE.md" ]; then
  echo "❌ lib/IDEAL_RESPONSE.md not found, exiting with failure"
  exit 1
fi

if [ ! -f "lib/MODEL_FAILURES.md" ]; then
  echo "❌ lib/MODEL_FAILURES.md not found, exiting with failure"
  exit 1
fi

echo "✅ All required documentation files found"

