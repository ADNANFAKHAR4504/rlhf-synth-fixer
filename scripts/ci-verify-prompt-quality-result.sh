#!/bin/bash

# Verify Prompt Quality Validation Result
# Runs the validation script and exits with appropriate status

set -e

echo "Verifying prompt quality validation result..."

# Run the validation script directly to check if it passes
if bash .claude/scripts/claude-validate-prompt-quality.sh; then
  echo "✅ Prompt quality validation PASSED"
  exit 0
else
  echo "❌ Prompt quality validation FAILED"
  echo "::error::Prompt quality validation failed. Check the Claude review comment for details."
  exit 1
fi
