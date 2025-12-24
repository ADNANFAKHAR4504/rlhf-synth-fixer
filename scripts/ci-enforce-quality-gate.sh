#!/bin/bash
# Enforce quality threshold for Claude review
# Required env var: QUALITY_SCORE
set -e

echo "🔍 Evaluating Claude quality gate..."

# Validate required environment variable
if [ -z "$QUALITY_SCORE" ]; then
  echo "::error::Missing required environment variable QUALITY_SCORE"
  exit 1
fi

THRESHOLD=8

if (( QUALITY_SCORE < THRESHOLD )); then
  echo "❌ Quality score ($QUALITY_SCORE) below threshold ($THRESHOLD)."
  exit 1
else
  echo "✅ Quality score ($QUALITY_SCORE) meets or exceeds threshold ($THRESHOLD)."
fi

