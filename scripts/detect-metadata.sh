#!/bin/bash

# Exit on any error
set -e

echo "🔍 Detecting project metadata..."

# Check if metadata.json exists
if [ ! -f "metadata.json" ]; then
  echo "❌ metadata.json not found, exiting with failure"
  exit 1
fi

# Read and validate metadata
PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
PO_ID=$(jq -r '.po_id // empty' metadata.json)
TEAM=$(jq -r '.team // "unknown"' metadata.json)
STARTED_AT=$(jq -r '.startedAt // "unknown"' metadata.json)
COMPLEXITY=$(jq -r '.complexity // "unknown"' metadata.json)
SUBTASK=$(jq -r '.subtask // empty' metadata.json)
SUBJECT_LABELS=$(jq -c '.subject_labels // empty' metadata.json)

echo "Detected metadata:"
echo "  Platform: $PLATFORM"
echo "  Language: $LANGUAGE"
echo "  PO ID: $PO_ID"
echo "  Team: $TEAM"
echo "  Started At: $STARTED_AT"
echo "  Complexity: $COMPLEXITY"
echo "  Subtask: $SUBTASK"
echo "  Subject Labels: $SUBJECT_LABELS"

# Validation checks
ERROR_COUNT=0

# If team or started_at is unknown, fail the job
if [ "$TEAM" == "unknown" ] || [ "$STARTED_AT" == "unknown" ]; then
  echo "❌ Missing required metadata: team or started_at"
  ((ERROR_COUNT++))
fi

# If PO_ID is empty, raise error
if [ -z "$PO_ID" ]; then
  echo "❌ PO_ID is required but not found in metadata.json"
  ((ERROR_COUNT++))
fi

# If complexity is unknown, raise error
if [ "$COMPLEXITY" == "unknown" ]; then
  echo "❌ Complexity is required but not found in metadata.json"
  ((ERROR_COUNT++))
fi

# If subtask is empty, raise error
if [ -z "$SUBTASK" ]; then
  echo "❌ Subtask is required but not found in metadata.json"
  ((ERROR_COUNT++))
fi

# If subject_labels is empty or not an array, raise error
if [ -z "$SUBJECT_LABELS" ] || [ "$SUBJECT_LABELS" == "null" ]; then
  echo "❌ subject_labels is required but not found in metadata.json"
  ((ERROR_COUNT++))
else
  # Check if subject_labels is a non-empty array
  SUBJECT_LABELS_LENGTH=$(jq -r '.subject_labels | length' metadata.json 2>/dev/null || echo "0")
  if [ "$SUBJECT_LABELS_LENGTH" == "0" ] || [ "$SUBJECT_LABELS_LENGTH" == "null" ]; then
    echo "❌ subject_labels must be a non-empty array in metadata.json"
    ((ERROR_COUNT++))
  fi
fi

# Synthetic task specific validations (only for team="synth")
if [ "$TEAM" == "synth" ]; then
  echo "🔍 Detected synthetic task, performing additional validations..."
  
  # Check for required documentation files
  echo "🔍 Checking for required documentation files..."
  
  if [ ! -f "lib/PROMPT.md" ]; then
    echo "❌ lib/PROMPT.md not found"
    ((ERROR_COUNT++))
  fi
  
  if [ ! -f "lib/MODEL_RESPONSE.md" ]; then
    echo "❌ lib/MODEL_RESPONSE.md not found"
    ((ERROR_COUNT++))
  fi
  
  # Additional documentation files that may be required by some workflows
  if [ -f "lib/IDEAL_RESPONSE.md" ]; then
    echo "✅ lib/IDEAL_RESPONSE.md found"
  else
    echo "ℹ️ lib/IDEAL_RESPONSE.md not found (may not be required for all workflows)"
  fi
  
  if [ -f "lib/MODEL_FAILURES.md" ]; then
    echo "✅ lib/MODEL_FAILURES.md found"
  else
    echo "ℹ️ lib/MODEL_FAILURES.md not found (may not be required for all workflows)"
  fi
else
  echo "ℹ️ Non-synthetic task detected (team=$TEAM), skipping background and documentation file checks"
fi

# Exit with error if any validation failed
if [ $ERROR_COUNT -gt 0 ]; then
  echo "❌ Metadata validation failed with $ERROR_COUNT errors"
  exit 1
fi

# Export variables for use in other scripts or GitHub Actions
export PLATFORM
export LANGUAGE
export PO_ID
export TEAM
export STARTED_AT
export COMPLEXITY
export SUBTASK
export SUBJECT_LABELS

# If in GitHub Actions, also set outputs
if [ -n "$GITHUB_OUTPUT" ]; then
  echo "platform=$PLATFORM" >> "$GITHUB_OUTPUT"
  echo "language=$LANGUAGE" >> "$GITHUB_OUTPUT"
  echo "po_id=$PO_ID" >> "$GITHUB_OUTPUT"
  echo "team=$TEAM" >> "$GITHUB_OUTPUT"
  echo "started_at=$STARTED_AT" >> "$GITHUB_OUTPUT"
  echo "complexity=$COMPLEXITY" >> "$GITHUB_OUTPUT"
  echo "subtask=$SUBTASK" >> "$GITHUB_OUTPUT"
  echo "subject_labels=$SUBJECT_LABELS" >> "$GITHUB_OUTPUT"
fi

echo "✅ Metadata detection and validation completed successfully"