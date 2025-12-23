#!/bin/bash
set -e

echo "🔍 Validating stack naming conventions..."
if [ -f "scripts/validate-stack-naming.sh" ]; then
  ./scripts/validate-stack-naming.sh || echo "⚠️ Stack naming validation found issues (non-blocking)"
else
  echo "⚠️ validate-stack-naming.sh not found, skipping"
fi
