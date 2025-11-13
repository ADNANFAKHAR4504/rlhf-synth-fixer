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
eval "$(jq -r '@sh "
  PLATFORM=\(.platform // "unknown")
  LANGUAGE=\(.language // "unknown")
  PO_ID=\(.po_id // "")
  TEAM=\(.team // "unknown")
  STARTED_AT=\(.startedAt // "unknown")
  COMPLEXITY=\(.complexity // "unknown")
  SUBTASK=\(.subtask // "")
  TURN_TYPE=\(.turn_type // "")
  SUBJECT_LABELS=\(.subject_labels // [] | tojson)
  SUBJECT_LABELS_LENGTH=\(.subject_labels // [] | length)"' metadata.json)"

echo "Detected metadata:"
echo "  Platform: $PLATFORM"
echo "  Language: $LANGUAGE"
echo "  PO ID: $PO_ID"
echo "  Team: $TEAM"
echo "  Started At: $STARTED_AT"
echo "  Complexity: $COMPLEXITY"
echo "  Subtask: $SUBTASK"
echo "  Turn Type: $TURN_TYPE"
echo "  Subject Labels: $SUBJECT_LABELS"

# Validation function for cleaner error handling
validate_required_field() {
  # shellcheck disable=SC2034
  local field_name="$1"
  local field_value="$2"
  local error_msg="$3"

  if [ -z "$field_value" ] || [ "$field_value" == "unknown" ] || [ "$field_value" == "null" ]; then
    echo "❌ $error_msg"
    return 1
  fi
  return 0
}

# Validation checks
ERRORS=()

# Validate required fields
validate_required_field "team" "$TEAM" "Team is required but not found in metadata.json" || ERRORS+=("team")
validate_required_field "started_at" "$STARTED_AT" "Started At is required but not found in metadata.json" || ERRORS+=("started_at")
validate_required_field "po_id" "$PO_ID" "PO_ID is required but not found in metadata.json" || ERRORS+=("po_id")
validate_required_field "complexity" "$COMPLEXITY" "Complexity is required but not found in metadata.json" || ERRORS+=("complexity")
validate_required_field "subtask" "$SUBTASK" "Subtask is required but not found in metadata.json" || ERRORS+=("subtask")

# Validate type_type field (must be "single" or "multi")
if [ -z "$TURN_TYPE" ]; then
  echo "❌ type_type is required but not found in metadata.json"
  ERRORS+=("type_type")
elif [ "$TURN_TYPE" != "single" ] && [ "$TURN_TYPE" != "multi" ]; then
  echo "❌ type_type must be either 'single' or 'multi', found: '$TURN_TYPE'"
  ERRORS+=("type_type")
fi

# Validate subject_labels array
if [ -z "$SUBJECT_LABELS" ] || [ "$SUBJECT_LABELS" == "null" ] || [ "$SUBJECT_LABELS" == "[]" ] || [ "$SUBJECT_LABELS_LENGTH" == "0" ]; then
  echo "❌ subject_labels must be a non-empty array in metadata.json"
  ERRORS+=("subject_labels")
fi

# Synthetic task specific validations (only for team="synth")
if [ "$TEAM" == "synth" ]; then
  echo "🔍 Detected synthetic task, performing additional validations..."
  
  # Check for required documentation files
  REQUIRED_DOCS=("lib/PROMPT.md" "lib/MODEL_RESPONSE.md")
  for doc in "${REQUIRED_DOCS[@]}"; do
    if [ ! -f "$doc" ]; then
      echo "❌ $doc not found"
      ERRORS+=("$doc")
    fi
  done

  # Optional documentation files
  OPTIONAL_DOCS=("lib/IDEAL_RESPONSE.md" "lib/MODEL_FAILURES.md")
  for doc in "${OPTIONAL_DOCS[@]}"; do
    if [ -f "$doc" ]; then
      echo "✅ $doc found"
    else
      echo "ℹ️ $doc not found (may not be required for all workflows)"
    fi
  done
else
  echo "ℹ️ Non-synthetic task detected (team=$TEAM), skipping background and documentation file checks"
fi

# Exit with error if any validation failed
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "❌ Metadata validation failed with ${#ERRORS[@]} error(s)"
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