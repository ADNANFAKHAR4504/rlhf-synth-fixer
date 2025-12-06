#!/bin/bash
set -e

PR_NUMBER="${1}"
BRANCH="${2}"
REPORT_FILE="${3:-.claude/reports/report-$(date +%Y-%m-%d).json}"

echo "Setting up review environment..."

# Extract task_id from branch (format: synth-{task_id})
if [[ "$BRANCH" =~ ^synth-(.+)$ ]]; then
  TASK_ID="${BASH_REMATCH[1]}"
else
  echo "Invalid branch format: $BRANCH (expected synth-{task_id})"
  exit 1
fi

echo "PR Number: $PR_NUMBER"
echo "Branch: $BRANCH"
echo "Task ID: $TASK_ID"

# Create worktree for review
REVIEW_DIR="worktree/review-$TASK_ID"

# Clean up existing worktree
if [ -d "$REVIEW_DIR" ]; then
  git worktree remove "$REVIEW_DIR" --force 2>/dev/null || rm -rf "$REVIEW_DIR"
fi

# Fetch and create worktree
git fetch origin "$BRANCH" --quiet
git worktree add "$REVIEW_DIR" "origin/$BRANCH" --quiet

if [ ! -d "$REVIEW_DIR" ]; then
  echo "Failed to create worktree"
  exit 1
fi

cd "$REVIEW_DIR"
echo "Worktree ready: $REVIEW_DIR"
echo ""

# ═══════════════════════════════════════════════════════
# STEP 2: Metadata Validation
# ═══════════════════════════════════════════════════════
echo "VALIDATING METADATA"
echo "────────────────────────────────────────────────"

METADATA_ISSUES=()
METADATA_INFO=()

if [ ! -f "metadata.json" ]; then
  METADATA_ISSUES+=("metadata.json not found")
  METADATA_VALID="false"
else
  # Required Fields Check
  REQUIRED_FIELDS=("platform" "language" "complexity" "turn_type" "po_id" "team" "startedAt" "subtask")

  for field in "${REQUIRED_FIELDS[@]}"; do
    if ! jq -e ".$field" metadata.json &>/dev/null || [ "$(jq -r ".$field" metadata.json)" == "null" ]; then
      METADATA_ISSUES+=("Missing required field: $field")
    fi
  done

  # Platform Validation
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
  VALID_PLATFORMS="cdk cdktf cfn tf pulumi cicd analysis"

  if [[ ! " $VALID_PLATFORMS " =~ " $PLATFORM " ]]; then
    METADATA_ISSUES+=("Invalid platform: '$PLATFORM' (allowed: $VALID_PLATFORMS)")
  fi
  METADATA_INFO+=("Platform: $PLATFORM")

  # Language Validation (per platform)
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
  LANG_VALID="true"

  case "$PLATFORM" in
    cdk)
      [[ "$LANGUAGE" =~ ^(ts|js|py|java|go)$ ]] || LANG_VALID="false"
      ALLOWED_LANGS="ts, js, py, java, go"
      ;;
    cdktf)
      [[ "$LANGUAGE" =~ ^(ts|py|go|java)$ ]] || LANG_VALID="false"
      ALLOWED_LANGS="ts, py, go, java"
      ;;
    pulumi)
      [[ "$LANGUAGE" =~ ^(ts|js|py|go|java)$ ]] || LANG_VALID="false"
      ALLOWED_LANGS="ts, js, py, go, java"
      ;;
    tf)
      [[ "$LANGUAGE" == "hcl" ]] || LANG_VALID="false"
      ALLOWED_LANGS="hcl"
      ;;
    cfn)
      [[ "$LANGUAGE" =~ ^(yaml|json)$ ]] || LANG_VALID="false"
      ALLOWED_LANGS="yaml, json"
      ;;
    cicd)
      [[ "$LANGUAGE" =~ ^(yaml|yml)$ ]] || LANG_VALID="false"
      ALLOWED_LANGS="yaml, yml"
      ;;
    analysis)
      [[ "$LANGUAGE" =~ ^(py|sh)$ ]] || LANG_VALID="false"
      ALLOWED_LANGS="py, sh"
      ;;
  esac

  if [ "$LANG_VALID" == "false" ]; then
    METADATA_ISSUES+=("Invalid language '$LANGUAGE' for platform '$PLATFORM' (allowed: $ALLOWED_LANGS)")
  fi
  METADATA_INFO+=("Language: $LANGUAGE")

  # Complexity Validation
  COMPLEXITY=$(jq -r '.complexity // "unknown"' metadata.json)
  if [[ ! "$COMPLEXITY" =~ ^(medium|hard|expert)$ ]]; then
    METADATA_ISSUES+=("Invalid complexity: '$COMPLEXITY' (allowed: medium, hard, expert)")
  fi
  METADATA_INFO+=("Complexity: $COMPLEXITY")

  # Subtask Validation
  SUBTASK=$(jq -r '.subtask // "unknown"' metadata.json)
  VALID_SUBTASKS=(
    "Provisioning of Infrastructure Environments"
    "Application Deployment"
    "CI/CD Pipeline Integration"
    "Failure Recovery and High Availability"
    "Security, Compliance, and Governance"
    "IaC Program Optimization"
    "Infrastructure QA and Management"
  )

  SUBTASK_VALID="false"
  for valid_subtask in "${VALID_SUBTASKS[@]}"; do
    if [ "$SUBTASK" == "$valid_subtask" ]; then
      SUBTASK_VALID="true"
      break
    fi
  done

  if [ "$SUBTASK_VALID" == "false" ]; then
    METADATA_ISSUES+=("Invalid subtask: '$SUBTASK'")
  fi
  METADATA_INFO+=("Subtask: $SUBTASK")

  # Training Quality Check
  TQ=$(jq -r '.training_quality // 0' metadata.json)
  if [ "$TQ" -lt 8 ] 2>/dev/null; then
    METADATA_ISSUES+=("Training quality $TQ < 8 (minimum required)")
  fi
  METADATA_INFO+=("Training Quality: $TQ")

  # Array Type Validation
  if jq -e '.aws_services' metadata.json &>/dev/null; then
    AWS_TYPE=$(jq -r '.aws_services | type' metadata.json)
    if [ "$AWS_TYPE" != "array" ]; then
      METADATA_ISSUES+=("aws_services must be array, got: $AWS_TYPE")
    fi
  fi

  if jq -e '.subject_labels' metadata.json &>/dev/null; then
    SL_TYPE=$(jq -r '.subject_labels | type' metadata.json)
    if [ "$SL_TYPE" != "array" ]; then
      METADATA_ISSUES+=("subject_labels must be array, got: $SL_TYPE")
    fi
  fi

  # Check for unexpected/invalid fields
  VALID_FIELDS="platform language complexity turn_type po_id team startedAt subtask subject_labels aws_services region task_config training_quality"
  ALL_FIELDS=$(jq -r 'keys[]' metadata.json)

  while IFS= read -r field; do
    if [[ ! " $VALID_FIELDS " =~ " $field " ]]; then
      METADATA_ISSUES+=("Unexpected field: '$field' (not in schema)")
    fi
  done <<< "$ALL_FIELDS"

  # Determine metadata validity
  METADATA_VALID=$([[ ${#METADATA_ISSUES[@]} -eq 0 ]] && echo "true" || echo "false")
fi

# Display metadata results
for info in "${METADATA_INFO[@]}"; do
  echo "  $info"
done
echo ""
if [ "$METADATA_VALID" == "true" ]; then
  echo "  Metadata: VALID"
else
  echo "  Metadata: INVALID"
  for issue in "${METADATA_ISSUES[@]}"; do
    echo "     - $issue"
  done
fi

# ═══════════════════════════════════════════════════════
# STEP 3: File/Folder Validation
# ═══════════════════════════════════════════════════════
echo ""
echo "VALIDATING FILES/FOLDERS"
echo "────────────────────────────────────────────────"

FILE_ISSUES=()

# Get changed files in this PR
cd ../..
CHANGED_FILES=$(git diff --name-only origin/main...origin/$BRANCH 2>/dev/null || echo "")
cd "$REVIEW_DIR"

# Allowed folders
ALLOWED_FOLDERS=("bin/" "lib/" "test/" "tests/" "gradle/")

# Allowed root-level files
ALLOWED_ROOT_FILES=(
  "package.json"
  "package-lock.json"
  "cdk.json"
  "cdktf.json"
  "Pulumi.yaml"
  "tap.py"
  "tap.go"
  "metadata.json"
  "Pipfile"
  "Pipfile.lock"
  "requirements.txt"
  "build.gradle"
  "settings.gradle"
  "pom.xml"
  "gradlew"
  "gradlew.bat"
)

FILE_COUNT=0
INVALID_COUNT=0

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  FILE_COUNT=$((FILE_COUNT + 1))

  valid="false"

  # Check if in allowed folder
  for folder in "${ALLOWED_FOLDERS[@]}"; do
    if [[ "$file" == "$folder"* ]]; then
      valid="true"
      break
    fi
  done

  # Check if allowed root file
  if [ "$valid" == "false" ]; then
    for allowed in "${ALLOWED_ROOT_FILES[@]}"; do
      if [ "$file" == "$allowed" ]; then
        valid="true"
        break
      fi
    done
  fi

  if [ "$valid" == "false" ]; then
    FILE_ISSUES+=("$file")
    INVALID_COUNT=$((INVALID_COUNT + 1))
  fi
done <<< "$CHANGED_FILES"

FILES_VALID=$([[ ${#FILE_ISSUES[@]} -eq 0 ]] && echo "true" || echo "false")

echo "  Total files in PR: $FILE_COUNT"
if [ "$FILES_VALID" == "true" ]; then
  echo "  Files: ALL VALID"
else
  echo "  Files: $INVALID_COUNT INVALID"
  for file in "${FILE_ISSUES[@]}"; do
    echo "     - $file"
  done
fi

# ═══════════════════════════════════════════════════════
# STEP 4: Emoji Check in lib/*.md
# ═══════════════════════════════════════════════════════
echo ""
echo "CHECKING FOR EMOJIS"
echo "────────────────────────────────────────────────"

EMOJI_ISSUES=()

# Check all .md files in lib/
for md_file in lib/*.md; do
  [[ ! -f "$md_file" ]] && continue

  # Check for common emoji unicode ranges
  if grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]|[\x{1F600}-\x{1F64F}]|[\x{1F680}-\x{1F6FF}]|[\x{1F1E0}-\x{1F1FF}]' "$md_file" 2>/dev/null; then
    EMOJI_ISSUES+=("$md_file")
  fi
done

NO_EMOJIS=$([[ ${#EMOJI_ISSUES[@]} -eq 0 ]] && echo "true" || echo "false")

if [ "$NO_EMOJIS" == "true" ]; then
  echo "  No emojis found in lib/*.md"
else
  echo "  Emojis found in:"
  for file in "${EMOJI_ISSUES[@]}"; do
    echo "     - $file"
  done
fi

# ═══════════════════════════════════════════════════════
# STEP 5: Claude Review Validation
# ═══════════════════════════════════════════════════════
echo ""
echo "CHECKING CLAUDE REVIEW"
echo "────────────────────────────────────────────────"

CLAUDE_SCORE=""
CLAUDE_SOURCE=""
CRITICAL_ISSUES=()

cd ../..

# Method 1: Check PR Comments
echo "  Checking PR comments..."

COMMENTS=$(gh pr view $PR_NUMBER --json comments --jq '.comments[].body' 2>/dev/null || echo "")

if [ -n "$COMMENTS" ]; then
  # Look for SCORE:X pattern (case insensitive, with or without space)
  SCORE_MATCH=$(echo "$COMMENTS" | grep -oE "SCORE:[[:space:]]*[0-9]+" | tail -1 || echo "")

  if [ -n "$SCORE_MATCH" ]; then
    CLAUDE_SCORE=$(echo "$SCORE_MATCH" | grep -oE "[0-9]+" | tail -1)
    CLAUDE_SOURCE="PR comments"
    echo "    Found SCORE:$CLAUDE_SCORE in PR comments"

    # Extract critical issues (lines with X marks or failures)
    CRITICAL_LINES=$(echo "$COMMENTS" | grep -E "CRITICAL|FAIL|ERROR" | head -5 || echo "")
    if [ -n "$CRITICAL_LINES" ]; then
      while IFS= read -r line; do
        [[ -n "$line" ]] && CRITICAL_ISSUES+=("$line")
      done <<< "$CRITICAL_LINES"
    fi
  fi
fi

# Method 2: Check CI/CD Job Logs (if not found in comments)
if [ -z "$CLAUDE_SCORE" ]; then
  echo "    Not found in comments, checking CI/CD logs..."

  # Get Claude Review job details
  CLAUDE_JOB=$(gh pr checks $PR_NUMBER --json name,state,conclusion,detailsUrl 2>/dev/null | \
    jq -r '.[] | select(.name | test("Claude|Review"; "i"))' || echo "")

  if [ -n "$CLAUDE_JOB" ]; then
    JOB_URL=$(echo "$CLAUDE_JOB" | jq -r '.detailsUrl // empty')
    JOB_CONCLUSION=$(echo "$CLAUDE_JOB" | jq -r '.conclusion // "unknown"')

    if [ -n "$JOB_URL" ]; then
      echo "    Found Claude Review job: $JOB_CONCLUSION"

      if [ "$JOB_CONCLUSION" == "success" ] || [ "$JOB_CONCLUSION" == "SUCCESS" ]; then
        CLAUDE_SOURCE="CI/CD job (passed)"
        CLAUDE_SCORE="8"
        echo "    Claude Review job PASSED (score >= 8)"
      else
        CLAUDE_SOURCE="CI/CD job ($JOB_CONCLUSION)"
        echo "    Claude Review job: $JOB_CONCLUSION"
        echo "    Check logs: $JOB_URL"
      fi
    fi
  else
    echo "    No Claude Review job found"
    CLAUDE_SOURCE="not found"
  fi
fi

cd "$REVIEW_DIR"

# Determine Claude review validity
CLAUDE_VALID="false"
if [ -n "$CLAUDE_SCORE" ] && [ "$CLAUDE_SCORE" -ge 8 ] 2>/dev/null; then
  CLAUDE_VALID="true"
fi

if [ "$CLAUDE_VALID" == "true" ]; then
  echo "  Claude Review: SCORE $CLAUDE_SCORE (source: $CLAUDE_SOURCE)"
else
  echo "  Claude Review: ${CLAUDE_SCORE:-not found}"
  if [ ${#CRITICAL_ISSUES[@]} -gt 0 ]; then
    echo "     Critical issues found:"
    for issue in "${CRITICAL_ISSUES[@]:0:3}"; do
      echo "     - ${issue:0:80}..."
    done
  fi
fi

# ═══════════════════════════════════════════════════════
# STEP 6: Generate Result & Update Report
# ═══════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════"
echo "REVIEW RESULT"
echo "════════════════════════════════════════════════"

# Determine overall merge readiness
READY_TO_MERGE="false"
if [[ "$METADATA_VALID" == "true" && "$FILES_VALID" == "true" && "$NO_EMOJIS" == "true" && "$CLAUDE_VALID" == "true" ]]; then
  READY_TO_MERGE="true"
fi

# Build validation results JSON
METADATA_ISSUES_JSON=$(printf '%s\n' "${METADATA_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
FILE_ISSUES_JSON=$(printf '%s\n' "${FILE_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
EMOJI_ISSUES_JSON=$(printf '%s\n' "${EMOJI_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
CRITICAL_ISSUES_JSON=$(printf '%s\n' "${CRITICAL_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")

# Build review JSON
REVIEW_JSON=$(cat <<EOF
{
  "pr_number": $PR_NUMBER,
  "pr_url": "https://github.com/TuringGpt/iac-test-automations/pull/$PR_NUMBER",
  "branch": "$BRANCH",
  "task_id": "$TASK_ID",
  "validations": {
    "metadata": {
      "valid": $METADATA_VALID,
      "issues": $METADATA_ISSUES_JSON,
      "platform": "${PLATFORM:-unknown}",
      "language": "${LANGUAGE:-unknown}",
      "complexity": "${COMPLEXITY:-unknown}",
      "training_quality": ${TQ:-0}
    },
    "files": {
      "valid": $FILES_VALID,
      "total_files": $FILE_COUNT,
      "invalid_count": ${INVALID_COUNT:-0},
      "issues": $FILE_ISSUES_JSON
    },
    "emojis": {
      "valid": $NO_EMOJIS,
      "issues": $EMOJI_ISSUES_JSON
    },
    "claude_review": {
      "valid": $CLAUDE_VALID,
      "score": ${CLAUDE_SCORE:-null},
      "source": "${CLAUDE_SOURCE:-not found}",
      "critical_issues": $CRITICAL_ISSUES_JSON
    }
  },
  "ready_to_merge": $READY_TO_MERGE,
  "reviewed_at": "$(date -Iseconds)"
}
EOF
)

# Display summary box
echo ""
echo "PR #$PR_NUMBER Validation Summary"
echo "─────────────────────────────────────────────"
printf "%-20s %s\n" "Metadata:" "$([ "$METADATA_VALID" == "true" ] && echo "PASS" || echo "FAIL")"
printf "%-20s %s\n" "Files:" "$([ "$FILES_VALID" == "true" ] && echo "PASS" || echo "FAIL")"
printf "%-20s %s\n" "No Emojis:" "$([ "$NO_EMOJIS" == "true" ] && echo "PASS" || echo "FAIL")"
printf "%-20s %s\n" "Claude Review:" "$([ "$CLAUDE_VALID" == "true" ] && echo "PASS (${CLAUDE_SCORE})" || echo "FAIL")"
echo "─────────────────────────────────────────────"
if [ "$READY_TO_MERGE" == "true" ]; then
  echo "READY TO MERGE"
else
  echo "NOT READY - Fix issues above"
fi
echo ""

# Update report file
cd ../..

if [ -f "$REPORT_FILE" ]; then
  # Add this review to the reviews array
  jq --argjson review "$REVIEW_JSON" '.reviews += [$review]' "$REPORT_FILE" > "${REPORT_FILE}.tmp"
  mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
  echo "Report updated: $REPORT_FILE"
fi

# Cleanup worktree
echo ""
echo "Cleaning up worktree..."
git worktree remove "$REVIEW_DIR" --force 2>/dev/null || rm -rf "$REVIEW_DIR" 2>/dev/null
echo "Done"
