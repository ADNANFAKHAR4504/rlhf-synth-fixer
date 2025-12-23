#!/bin/bash
# Verify that Claude updated metadata.json with training_quality
# Required: GITHUB_OUTPUT environment variable must be set
set -e

echo "🔍 Verifying Claude updated metadata.json with training_quality..."

if [ ! -f "metadata.json" ]; then
  echo "::error::metadata.json not found after Claude review"
  exit 1
fi

# Check if training_quality field exists and is a valid number
TRAINING_QUALITY=$(jq -r '.training_quality // empty' metadata.json 2>/dev/null || echo "")

if [ -z "$TRAINING_QUALITY" ]; then
  echo "⚠️ WARNING: Claude did not update metadata.json with training_quality"
  echo "⚠️ Will attempt to extract score from PR comment instead"
  echo "metadata_updated=false" >> "$GITHUB_OUTPUT"
elif [[ ! "$TRAINING_QUALITY" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "⚠️ WARNING: training_quality value '$TRAINING_QUALITY' is not a valid number"
  echo "metadata_updated=false" >> "$GITHUB_OUTPUT"
else
  echo "✅ metadata.json updated with training_quality: $TRAINING_QUALITY"
  echo "metadata_updated=true" >> "$GITHUB_OUTPUT"
  echo "training_quality=$TRAINING_QUALITY" >> "$GITHUB_OUTPUT"
fi

