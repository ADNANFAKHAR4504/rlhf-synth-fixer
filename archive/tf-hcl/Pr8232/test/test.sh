#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "📦 Installing dependencies..."
npm ci --silent

echo "🧪 Running Terraform integration/unit tests (Jest)..."
# If you have specific jest config, keep jest.config.js at repo root
npx jest test/terraform.*.test.ts --runInBand --verbose