#!/bin/bash
set -e

# Claude Prompt Quality Validation Script
# Validates prompt quality based on metadata.json training_quality field

echo "Starting prompt quality validation..."

# Check if metadata.json exists
if [ ! -f "metadata.json" ]; then
  echo "❌ Error: metadata.json not found"
  exit 1
fi

echo "✅ metadata.json found"

# Extract training_quality score from metadata.json
TRAINING_QUALITY=$(jq -r '.training_quality // empty' metadata.json 2>/dev/null || echo "")

if [ -z "$TRAINING_QUALITY" ]; then
  echo "❌ Error: training_quality field not found in metadata.json"
  echo "Claude review must update metadata.json with a training_quality score"
  exit 1
fi

echo "✅ Found training_quality: $TRAINING_QUALITY"

# Validate that training_quality is a number
if ! [[ "$TRAINING_QUALITY" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "❌ Error: training_quality value '$TRAINING_QUALITY' is not a valid number"
  exit 1
fi

echo "✅ training_quality is a valid number"

# Check if score meets threshold (8)
THRESHOLD=8
SCORE_INT=$(echo "$TRAINING_QUALITY" | awk '{print int($1)}')

if (( $(echo "$SCORE_INT < $THRESHOLD" | bc -l) )); then
  echo "❌ Prompt quality validation FAILED"
  echo "Training quality score ($TRAINING_QUALITY) is below threshold ($THRESHOLD)"
  exit 1
fi

echo "✅ Prompt quality validation PASSED"
echo "Training quality score ($TRAINING_QUALITY) meets or exceeds threshold ($THRESHOLD)"

exit 0
