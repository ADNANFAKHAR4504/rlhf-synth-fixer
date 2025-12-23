#!/bin/bash

# Exit on any error
set -e

echo "🔍 Detecting project metadata..."

# Check if metadata.json exists
if [ ! -f "metadata.json" ]; then
  echo "❌ metadata.json not found, exiting with failure"
  exit 1
fi

# Run comprehensive metadata validation early to fail fast
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Running comprehensive metadata validation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
VALIDATE_SCRIPT=".claude/scripts/validate-metadata.sh"
if [ -f "$VALIDATE_SCRIPT" ]; then
  if ! bash "$VALIDATE_SCRIPT" metadata.json; then
    echo ""
    echo "❌ Comprehensive metadata validation failed!"
    echo "Please fix the issues above before proceeding."
    echo ""
    echo "Reference: .claude/docs/references/iac-subtasks-subject-labels.json"
    echo "           .claude/docs/references/metadata-requirements.md"
    exit 1
  fi
  echo ""
else
  echo "⚠️ Warning: $VALIDATE_SCRIPT not found, skipping comprehensive validation"
  echo ""
fi

# Check for emojis in lib/*.md files (strict validation)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Checking for emojis in lib/*.md files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "lib" ]; then
  # Find all .md files in lib folder
  MD_FILES=$(find lib -maxdepth 1 -name "*.md" -type f 2>/dev/null)
  
  if [ -n "$MD_FILES" ]; then
    EMOJI_FOUND=false
    FILES_WITH_EMOJIS=()
    
    # Comprehensive emoji regex patterns covering:
    # - Emoticons (1F600-1F64F)
    # - Dingbats (2700-27BF)
    # - Transport/Map symbols (1F680-1F6FF)
    # - Miscellaneous symbols (2600-26FF)
    # - Symbols & Pictographs (1F300-1F5FF)
    # - Supplemental Symbols (1F900-1F9FF)
    # - Flags (1F1E0-1F1FF)
    # - Various other emoji ranges
    EMOJI_PATTERN='[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]|[\x{1F1E0}-\x{1F1FF}]|[\x{1FA00}-\x{1FAFF}]|[\x{231A}-\x{231B}]|[\x{23E9}-\x{23F3}]|[\x{23F8}-\x{23FA}]|[\x{25AA}-\x{25AB}]|[\x{25B6}]|[\x{25C0}]|[\x{25FB}-\x{25FE}]|[\x{2614}-\x{2615}]|[\x{2648}-\x{2653}]|[\x{267F}]|[\x{2693}]|[\x{26A1}]|[\x{26AA}-\x{26AB}]|[\x{26BD}-\x{26BE}]|[\x{26C4}-\x{26C5}]|[\x{26CE}]|[\x{26D4}]|[\x{26EA}]|[\x{26F2}-\x{26F3}]|[\x{26F5}]|[\x{26FA}]|[\x{26FD}]|[\x{2702}]|[\x{2705}]|[\x{2708}-\x{270D}]|[\x{270F}]|[\x{2712}]|[\x{2714}]|[\x{2716}]|[\x{271D}]|[\x{2721}]|[\x{2728}]|[\x{2733}-\x{2734}]|[\x{2744}]|[\x{2747}]|[\x{274C}]|[\x{274E}]|[\x{2753}-\x{2755}]|[\x{2757}]|[\x{2763}-\x{2764}]|[\x{2795}-\x{2797}]|[\x{27A1}]|[\x{27B0}]|[\x{27BF}]|[\x{2934}-\x{2935}]|[\x{2B05}-\x{2B07}]|[\x{2B1B}-\x{2B1C}]|[\x{2B50}]|[\x{2B55}]|[\x{3030}]|[\x{303D}]|[\x{3297}]|[\x{3299}]'
    
    while IFS= read -r file; do
      if [ -n "$file" ]; then
        # Use grep with Perl regex to detect emojis
        if grep -Pq "$EMOJI_PATTERN" "$file" 2>/dev/null; then
          EMOJI_FOUND=true
          FILES_WITH_EMOJIS+=("$file")
          echo "  ❌ Emojis found in: $file"
          # Show the lines with emojis
          grep -Pn "$EMOJI_PATTERN" "$file" 2>/dev/null | head -5 | while read -r line; do
            echo "     Line $line"
          done
        else
          echo "  ✅ No emojis in: $file"
        fi
      fi
    done <<< "$MD_FILES"
    
    if [ "$EMOJI_FOUND" = true ]; then
      echo ""
      echo "❌ CRITICAL: Emojis found in lib/*.md files!"
      echo ""
      echo "Files with emojis:"
      for f in "${FILES_WITH_EMOJIS[@]}"; do
        echo "  - $f"
      done
      echo ""
      echo "Emojis are NOT allowed in documentation files."
      echo "Please remove all emojis from the above files and try again."
      exit 1
    fi
    echo ""
  else
    echo "  ℹ️ No .md files found in lib/ folder"
    echo ""
  fi
else
  echo "  ℹ️ lib/ folder not found, skipping emoji check"
  echo ""
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
  PROVIDER=\(.provider // "aws")
  SUBJECT_LABELS=\(.subject_labels // [] | tojson)
  SUBJECT_LABELS_LENGTH=\(.subject_labels // [] | length)"' metadata.json)"

echo "Detected metadata:"
echo "  Platform: $PLATFORM"
echo "  Language: $LANGUAGE"
echo "  PO ID: $PO_ID"
echo "  Team: $TEAM"
echo "  Provider: $PROVIDER"
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

# Synthetic task specific validations (for team starting with "synth")
if [[ "$TEAM" =~ ^synth ]]; then
  echo ""
  echo "🔍 Detected synthetic task, performing additional validations..."
  
  # Check for required documentation files
  REQUIRED_DOCS=("lib/PROMPT.md" "lib/MODEL_RESPONSE.md")
  for doc in "${REQUIRED_DOCS[@]}"; do
    if [ ! -f "$doc" ]; then
      echo "  ❌ $doc not found"
      ERRORS+=("$doc")
    fi
  done

  # Optional documentation files
  OPTIONAL_DOCS=("lib/IDEAL_RESPONSE.md" "lib/MODEL_FAILURES.md")
  for doc in "${OPTIONAL_DOCS[@]}"; do
    if [ -f "$doc" ]; then
      echo "  ✅ $doc found"
    else
      echo " ℹ️ $doc not found (may not be required for all workflows)"
    fi
  done
else
  echo ""
  echo "ℹ️ Non-synthetic task detected (team=$TEAM), skipping background and documentation file checks"
fi

# Exit with error if any validation failed
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "❌ Metadata validation failed with ${#ERRORS[@]} error(s)"
  exit 1
fi

# Export variables for use in other scripts or GitHub Actions
export PLATFORM
export LANGUAGE
export PO_ID
export TEAM
export PROVIDER
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
  echo "provider=$PROVIDER" >> "$GITHUB_OUTPUT"
  echo "started_at=$STARTED_AT" >> "$GITHUB_OUTPUT"
  echo "complexity=$COMPLEXITY" >> "$GITHUB_OUTPUT"
  echo "subtask=$SUBTASK" >> "$GITHUB_OUTPUT"
  echo "subject_labels=$SUBJECT_LABELS" >> "$GITHUB_OUTPUT"
fi

echo ""
echo "✅ Metadata detection and validation completed successfully"