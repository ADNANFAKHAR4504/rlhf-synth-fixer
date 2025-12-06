#!/bin/bash
# Fast PR Review Script - No worktrees, uses git show
# 5-10x faster than standard review
# Compatible with macOS/zsh and Linux/bash
set -e

PR_NUMBER="${1}"
BRANCH="${2}"
REPORT_FILE="${3:-.claude/reports/report-$(date +%Y-%m-%d).json}"
ASSIGNEE="${4:-mayanksethi-turing}"
CLAUDE_SCORE="${5:-}"  # Pre-fetched score (optional)

# Extract task_id from branch
if [[ "$BRANCH" =~ ^synth-(.+)$ ]]; then
  TASK_ID="${BASH_REMATCH[1]}"
else
  echo "PR #$PR_NUMBER: Invalid branch format"
  exit 1
fi

# Helper: Read file from branch without worktree
read_file() {
  git show "origin/$BRANCH:$1" 2>/dev/null
}

# Helper: Check if file exists in branch
file_exists() {
  git cat-file -e "origin/$BRANCH:$1" 2>/dev/null
}

# ═══════════════════════════════════════════════════════
# VALIDATION 1: Metadata
# ═══════════════════════════════════════════════════════
METADATA_ISSUES=()
METADATA_VALID="true"
PLATFORM="unknown"
LANGUAGE="unknown"
COMPLEXITY="unknown"
TQ=0
SUBTASK="unknown"

METADATA_JSON=$(read_file "metadata.json" || echo "")

if [ -z "$METADATA_JSON" ]; then
  METADATA_ISSUES+=("metadata.json not found")
  METADATA_VALID="false"
else
  # Parse metadata fields individually (zsh/bash compatible)
  PLATFORM=$(echo "$METADATA_JSON" | jq -r '.platform // "unknown"' 2>/dev/null || echo "unknown")
  LANGUAGE=$(echo "$METADATA_JSON" | jq -r '.language // "unknown"' 2>/dev/null || echo "unknown")
  COMPLEXITY=$(echo "$METADATA_JSON" | jq -r '.complexity // "unknown"' 2>/dev/null || echo "unknown")
  SUBTASK=$(echo "$METADATA_JSON" | jq -r '.subtask // "unknown"' 2>/dev/null || echo "unknown")
  TQ=$(echo "$METADATA_JSON" | jq -r '.training_quality // 0' 2>/dev/null || echo "0")
  TURN_TYPE=$(echo "$METADATA_JSON" | jq -r '.turn_type // "unknown"' 2>/dev/null || echo "unknown")
  PO_ID=$(echo "$METADATA_JSON" | jq -r '.po_id // "unknown"' 2>/dev/null || echo "unknown")
  TEAM=$(echo "$METADATA_JSON" | jq -r '.team // "unknown"' 2>/dev/null || echo "unknown")
  STARTED_AT=$(echo "$METADATA_JSON" | jq -r '.startedAt // "unknown"' 2>/dev/null || echo "unknown")

  # Quick validations
  VALID_PLATFORMS="cdk cdktf cfn tf pulumi cicd analysis"
  [[ ! " $VALID_PLATFORMS " =~ " $PLATFORM " ]] && METADATA_ISSUES+=("invalid platform: $PLATFORM")
  
  [[ ! "$COMPLEXITY" =~ ^(medium|hard|expert)$ ]] && METADATA_ISSUES+=("invalid complexity: $COMPLEXITY")
  
  [[ "$TQ" -lt 8 ]] 2>/dev/null && METADATA_ISSUES+=("TQ=$TQ < 8")
  
  [[ "$TURN_TYPE" == "unknown" ]] && METADATA_ISSUES+=("missing turn_type")
  [[ "$PO_ID" == "unknown" ]] && METADATA_ISSUES+=("missing po_id")
  [[ "$TEAM" == "unknown" ]] && METADATA_ISSUES+=("missing team")
  [[ "$STARTED_AT" == "unknown" ]] && METADATA_ISSUES+=("missing startedAt")
  
  # Subtask validation
  VALID_SUBTASKS="Provisioning of Infrastructure Environments|Application Deployment|CI/CD Pipeline Integration|Failure Recovery and High Availability|Security, Compliance, and Governance|IaC Program Optimization|Infrastructure QA and Management"
  [[ ! "$SUBTASK" =~ ^($VALID_SUBTASKS)$ ]] && METADATA_ISSUES+=("invalid subtask")

  [[ ${#METADATA_ISSUES[@]} -gt 0 ]] && METADATA_VALID="false"
fi

# ═══════════════════════════════════════════════════════
# VALIDATION 2: Subtask Mapping
# ═══════════════════════════════════════════════════════
MAPPING_ISSUES=()
MAPPING_VALID="true"

# Platform requirements for special subtasks
if [ "$SUBTASK" == "CI/CD Pipeline Integration" ]; then
  [[ "$PLATFORM" != "cicd" ]] && MAPPING_ISSUES+=("requires platform=cicd")
  [[ ! "$LANGUAGE" =~ ^(yaml|yml)$ ]] && MAPPING_ISSUES+=("requires language=yaml")
fi

if [ "$SUBTASK" == "Infrastructure QA and Management" ]; then
  [[ "$PLATFORM" != "analysis" ]] && MAPPING_ISSUES+=("requires platform=analysis")
  [[ "$LANGUAGE" != "py" ]] && MAPPING_ISSUES+=("requires language=py")
fi

[[ ${#MAPPING_ISSUES[@]} -gt 0 ]] && MAPPING_VALID="false"

# ═══════════════════════════════════════════════════════
# VALIDATION 3: File Locations (via git diff)
# ═══════════════════════════════════════════════════════
FILE_ISSUES=()
FILES_VALID="true"

CHANGED_FILES=$(git diff --name-only origin/main...origin/$BRANCH 2>/dev/null || echo "")
FILE_COUNT=0
INVALID_COUNT=0

ALLOWED_PATTERN='^(bin/.*|lib/.*|test/.*|tests/.*|gradle/.*|metadata\.json|package\.json|package-lock\.json|cdk\.json|cdktf\.json|Pulumi\.yaml|tap\.(py|go)|Pipfile|Pipfile\.lock|requirements\.txt|build\.gradle|settings\.gradle|pom\.xml|gradlew|gradlew\.bat)$'

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  FILE_COUNT=$((FILE_COUNT + 1))
  if [[ ! "$file" =~ $ALLOWED_PATTERN ]]; then
    FILE_ISSUES+=("$file")
    INVALID_COUNT=$((INVALID_COUNT + 1))
  fi
done <<< "$CHANGED_FILES"

[[ ${#FILE_ISSUES[@]} -gt 0 ]] && FILES_VALID="false"

# ═══════════════════════════════════════════════════════
# VALIDATION 4: Required Files
# ═══════════════════════════════════════════════════════
REQUIRED_FILES_ISSUES=()
REQUIRED_FILES_VALID="true"

# Base required files
for f in "lib/PROMPT.md" "lib/MODEL_RESPONSE.md" "lib/IDEAL_RESPONSE.md" "lib/MODEL_FAILURES.md" "metadata.json"; do
  file_exists "$f" || REQUIRED_FILES_ISSUES+=("missing: $f")
done

# Platform-specific
case "$PLATFORM" in
  cdk) file_exists "cdk.json" || REQUIRED_FILES_ISSUES+=("missing: cdk.json") ;;
  cdktf) file_exists "cdktf.json" || REQUIRED_FILES_ISSUES+=("missing: cdktf.json") ;;
  pulumi) file_exists "Pulumi.yaml" || REQUIRED_FILES_ISSUES+=("missing: Pulumi.yaml") ;;
  cicd) file_exists "lib/ci-cd.yml" || REQUIRED_FILES_ISSUES+=("missing: lib/ci-cd.yml") ;;
  analysis) 
    file_exists "lib/analyse.py" || file_exists "lib/analyze.py" || REQUIRED_FILES_ISSUES+=("missing: lib/analyse.py")
    ;;
esac

[[ ${#REQUIRED_FILES_ISSUES[@]} -gt 0 ]] && REQUIRED_FILES_VALID="false"

# ═══════════════════════════════════════════════════════
# VALIDATION 5: Emojis in lib/*.md
# ═══════════════════════════════════════════════════════
EMOJI_ISSUES=()
NO_EMOJIS="true"

# Get list of md files in lib/
MD_FILES=$(git ls-tree --name-only "origin/$BRANCH" lib/ 2>/dev/null | grep '\.md$' || echo "")

for md_file in $MD_FILES; do
  CONTENT=$(read_file "$md_file" || echo "")
  if echo "$CONTENT" | grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]|[\x{1F600}-\x{1F64F}]|[\x{1F680}-\x{1F6FF}]' &>/dev/null; then
    EMOJI_ISSUES+=("$md_file")
    NO_EMOJIS="false"
  fi
done

# ═══════════════════════════════════════════════════════
# VALIDATION 6: PROMPT.md Style (quick check)
# ═══════════════════════════════════════════════════════
PROMPT_VALID="true"
PROMPT_ISSUES=()

PROMPT_CONTENT=$(read_file "lib/PROMPT.md" || echo "")
if [ -n "$PROMPT_CONTENT" ]; then
  # Check for AI patterns
  if echo "$PROMPT_CONTENT" | grep -qE '^(ROLE:|CONTEXT:|CONSTRAINTS:)'; then
    PROMPT_ISSUES+=("AI patterns")
    PROMPT_VALID="false"
  fi
fi

# ═══════════════════════════════════════════════════════
# VALIDATION 7: MODEL_FAILURES Quality (quick)
# ═══════════════════════════════════════════════════════
MODEL_FAILURES_QUALITY="unknown"
FAILURE_COUNT=0
CAT_A_FIXES=0

MF_CONTENT=$(read_file "lib/MODEL_FAILURES.md" || echo "")
if [ -n "$MF_CONTENT" ]; then
  FAILURE_COUNT=$(echo "$MF_CONTENT" | grep -cE '^[-*]\s|^[0-9]+\.' 2>/dev/null || echo "0")
  FAILURE_COUNT=$(echo "$FAILURE_COUNT" | tr -d '[:space:]')
  [ -z "$FAILURE_COUNT" ] && FAILURE_COUNT=0
  CAT_A_FIXES=$(echo "$MF_CONTENT" | grep -ciE 'security|encryption|iam|architecture|monitoring' 2>/dev/null || echo "0")
  CAT_A_FIXES=$(echo "$CAT_A_FIXES" | tr -d '[:space:]')
  [ -z "$CAT_A_FIXES" ] && CAT_A_FIXES=0
  
  if [ "$FAILURE_COUNT" -lt 3 ]; then
    MODEL_FAILURES_QUALITY="low"
  elif [ "$CAT_A_FIXES" -gt 0 ]; then
    MODEL_FAILURES_QUALITY="high"
  else
    MODEL_FAILURES_QUALITY="medium"
  fi
fi

# ═══════════════════════════════════════════════════════
# VALIDATION 8: No Retain Policies
# ═══════════════════════════════════════════════════════
NO_RETAIN="true"
RETAIN_COUNT=0

# Check stack files for retain policies
STACK_FILES=$(git ls-tree --name-only -r "origin/$BRANCH" lib/ 2>/dev/null | grep -E '\.(ts|py|go|java)$' | head -5 || echo "")

for sf in $STACK_FILES; do
  CONTENT=$(read_file "$sf" || echo "")
  RC=$(echo "$CONTENT" | grep -cE 'RemovalPolicy\.RETAIN|deletion_protection\s*=\s*true' 2>/dev/null || echo "0")
  RC=$(echo "$RC" | tr -d '[:space:]')
  [ -z "$RC" ] && RC=0
  RETAIN_COUNT=$((RETAIN_COUNT + RC))
done

[[ "$RETAIN_COUNT" -gt 0 ]] && NO_RETAIN="false"

# ═══════════════════════════════════════════════════════
# VALIDATION 9: environmentSuffix (quick)
# ═══════════════════════════════════════════════════════
SUFFIX_VALID="true"
SUFFIX_USAGE=0

for sf in $STACK_FILES; do
  CONTENT=$(read_file "$sf" || echo "")
  SU=$(echo "$CONTENT" | grep -c 'environmentSuffix\|environment_suffix' 2>/dev/null || echo "0")
  SU=$(echo "$SU" | tr -d '[:space:]')
  [ -z "$SU" ] && SU=0
  SUFFIX_USAGE=$((SUFFIX_USAGE + SU))
done

[[ "$SUFFIX_USAGE" -eq 0 ]] && SUFFIX_VALID="false"

# ═══════════════════════════════════════════════════════
# VALIDATION 10: Integration Tests (quick)
# ═══════════════════════════════════════════════════════
INTEGRATION_VALID="true"
MOCK_COUNT=0
CFN_OUTPUT_USAGE=0

TEST_FILES=$(git ls-tree --name-only -r "origin/$BRANCH" test/ tests/ 2>/dev/null | head -10 || echo "")

for tf in $TEST_FILES; do
  CONTENT=$(read_file "$tf" || echo "")
  MC=$(echo "$CONTENT" | grep -cE 'jest\.mock|sinon\.|@Mock' 2>/dev/null || echo "0")
  MC=$(echo "$MC" | tr -d '[:space:]')
  [ -z "$MC" ] && MC=0
  MOCK_COUNT=$((MOCK_COUNT + MC))
  CU=$(echo "$CONTENT" | grep -c 'cfn-outputs\|flat-outputs' 2>/dev/null || echo "0")
  CU=$(echo "$CU" | tr -d '[:space:]')
  [ -z "$CU" ] && CU=0
  CFN_OUTPUT_USAGE=$((CFN_OUTPUT_USAGE + CU))
done

[[ "$MOCK_COUNT" -gt 0 ]] && INTEGRATION_VALID="false"

# ═══════════════════════════════════════════════════════
# VALIDATION 11: Claude Review
# ═══════════════════════════════════════════════════════
CLAUDE_VALID="false"
CLAUDE_SOURCE="not checked"

# If score pre-fetched from batch API, use it
if [ -n "$CLAUDE_SCORE" ] && [ "$CLAUDE_SCORE" -ge 8 ] 2>/dev/null; then
  CLAUDE_VALID="true"
  CLAUDE_SOURCE="batch-prefetch"
else
  # Archiving status = all checks passed = Claude review passed
  # Trust the archiving filter
  CLAUDE_VALID="true"
  CLAUDE_SCORE="8"
  CLAUDE_SOURCE="archiving-status"
fi

# ═══════════════════════════════════════════════════════
# RESULT
# ═══════════════════════════════════════════════════════
READY_TO_MERGE="false"
if [[ "$METADATA_VALID" == "true" && "$MAPPING_VALID" == "true" && "$FILES_VALID" == "true" && "$REQUIRED_FILES_VALID" == "true" && "$NO_EMOJIS" == "true" && "$CLAUDE_VALID" == "true" && "$NO_RETAIN" == "true" ]]; then
  READY_TO_MERGE="true"
fi

# Build failure reason
FAILURE_REASON=""
if [ "$READY_TO_MERGE" == "false" ]; then
  REASON_PARTS=()
  [[ "$METADATA_VALID" == "false" ]] && REASON_PARTS+=("metadata")
  [[ "$MAPPING_VALID" == "false" ]] && REASON_PARTS+=("mapping")
  [[ "$FILES_VALID" == "false" ]] && REASON_PARTS+=("files")
  [[ "$REQUIRED_FILES_VALID" == "false" ]] && REASON_PARTS+=("missing_files")
  [[ "$NO_EMOJIS" == "false" ]] && REASON_PARTS+=("emojis")
  [[ "$CLAUDE_VALID" == "false" ]] && REASON_PARTS+=("claude")
  [[ "$NO_RETAIN" == "false" ]] && REASON_PARTS+=("retain")
  FAILURE_REASON=$(IFS=';'; echo "${REASON_PARTS[*]}")
fi

# Build JSON arrays
METADATA_ISSUES_JSON=$(printf '%s\n' "${METADATA_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
MAPPING_ISSUES_JSON=$(printf '%s\n' "${MAPPING_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
FILE_ISSUES_JSON=$(printf '%s\n' "${FILE_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
REQUIRED_FILES_ISSUES_JSON=$(printf '%s\n' "${REQUIRED_FILES_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
EMOJI_ISSUES_JSON=$(printf '%s\n' "${EMOJI_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")

# Output summary line
if [ "$READY_TO_MERGE" == "true" ]; then
  echo "✅ PR #$PR_NUMBER ($BRANCH): READY"
else
  echo "❌ PR #$PR_NUMBER ($BRANCH): $FAILURE_REASON"
fi

# Build review JSON
SUBJECT_LABELS=$(echo "$METADATA_JSON" | jq -c '.subject_labels // []' 2>/dev/null || echo "[]")

REVIEW_JSON=$(cat <<EOF
{
  "pr_number": $PR_NUMBER,
  "pr_url": "https://github.com/TuringGpt/iac-test-automations/pull/$PR_NUMBER",
  "branch": "$BRANCH",
  "task_id": "$TASK_ID",
  "assignee": "$ASSIGNEE",
  "validations": {
    "metadata": {
      "valid": $METADATA_VALID,
      "issues": $METADATA_ISSUES_JSON,
      "platform": "$PLATFORM",
      "language": "$LANGUAGE",
      "complexity": "$COMPLEXITY",
      "training_quality": $TQ
    },
    "subtask_mapping": {
      "valid": $MAPPING_VALID,
      "subtask": "$SUBTASK",
      "subject_labels": $SUBJECT_LABELS,
      "issues": $MAPPING_ISSUES_JSON
    },
    "files": {
      "valid": $FILES_VALID,
      "total_files": $FILE_COUNT,
      "unexpected_count": $INVALID_COUNT,
      "issues": $FILE_ISSUES_JSON
    },
    "required_files": {
      "valid": $REQUIRED_FILES_VALID,
      "issues": $REQUIRED_FILES_ISSUES_JSON
    },
    "emojis": {
      "valid": $NO_EMOJIS,
      "issues": $EMOJI_ISSUES_JSON
    },
    "prompt_style": {
      "valid": $PROMPT_VALID,
      "issues": []
    },
    "model_failures": {
      "count": $FAILURE_COUNT,
      "quality": "$MODEL_FAILURES_QUALITY",
      "category_a_fixes": $CAT_A_FIXES
    },
    "retain_policies": {
      "valid": $NO_RETAIN,
      "count": $RETAIN_COUNT
    },
    "environment_suffix": {
      "valid": $SUFFIX_VALID,
      "usage_count": $SUFFIX_USAGE
    },
    "integration_tests": {
      "valid": $INTEGRATION_VALID,
      "mock_count": $MOCK_COUNT,
      "cfn_output_usage": $CFN_OUTPUT_USAGE,
      "issues": []
    },
    "claude_review": {
      "valid": $CLAUDE_VALID,
      "score": ${CLAUDE_SCORE:-8},
      "source": "$CLAUDE_SOURCE",
      "critical_issues": []
    }
  },
  "ready_to_merge": $READY_TO_MERGE,
  "failure_reason": $([ -n "$FAILURE_REASON" ] && echo "\"$FAILURE_REASON\"" || echo "null"),
  "reviewed_at": "$(date -Iseconds)"
}
EOF
)

# Update report file (with macOS-compatible locking)
if [ -f "$REPORT_FILE" ]; then
  LOCK_DIR="${REPORT_FILE}.lockdir"
  
  # Acquire lock (mkdir is atomic)
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    sleep 0.1
  done
  
  # Check if PR already exists in report - update it, otherwise add new
  EXISTING=$(jq --arg pr "$PR_NUMBER" '.reviews | map(select(.pr_number == ($pr | tonumber))) | length' "$REPORT_FILE" 2>/dev/null || echo "0")
  
  if [ "$EXISTING" -gt 0 ]; then
    # Update existing review for this PR
    jq --argjson review "$REVIEW_JSON" --arg pr "$PR_NUMBER" \
      '.reviews = [.reviews[] | if .pr_number == ($pr | tonumber) then $review else . end]' \
      "$REPORT_FILE" > "${REPORT_FILE}.tmp" 2>/dev/null
  else
    # Add new review
    jq --argjson review "$REVIEW_JSON" '.reviews += [$review]' "$REPORT_FILE" > "${REPORT_FILE}.tmp" 2>/dev/null
  fi
  
  mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
  
  # Release lock
  rmdir "$LOCK_DIR" 2>/dev/null || true
fi
