#!/bin/bash
set -e

echo "🔍 Validating stack naming conventions before deployment..."
if [ -f "scripts/validate-stack-naming.sh" ]; then
  ./scripts/validate-stack-naming.sh || echo "⚠️ Stack naming validation found issues (non-blocking)"
fi

# Source and print stack configuration
if [ -f "scripts/stack-config.sh" ]; then
  source scripts/stack-config.sh
  bash scripts/stack-config.sh --print
fi
