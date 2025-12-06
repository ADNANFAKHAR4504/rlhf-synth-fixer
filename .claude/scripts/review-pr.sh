#!/bin/bash
# Enhanced PR Review Script
# Validates synthetic PRs for merge readiness
set -e

PR_NUMBER="${1}"
BRANCH="${2}"
REPORT_FILE="${3:-.claude/reports/report-$(date +%Y-%m-%d).json}"
ASSIGNEE="${4:-mayanksethi-turing}"

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
# STEP 1: Metadata Validation
# ═══════════════════════════════════════════════════════
echo "1. VALIDATING METADATA"
echo "────────────────────────────────────────────────"

METADATA_ISSUES=()
METADATA_INFO=()
PLATFORM="unknown"
LANGUAGE="unknown"
COMPLEXITY="unknown"
TQ=0
SUBTASK="unknown"

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
  echo "  Result: PASS"
else
  echo "  Result: FAIL"
  for issue in "${METADATA_ISSUES[@]}"; do
    echo "     - $issue"
  done
fi

# ═══════════════════════════════════════════════════════
# STEP 2: Subtask <-> Subject Label Mapping Validation
# ═══════════════════════════════════════════════════════
echo ""
echo "2. VALIDATING SUBTASK/SUBJECT LABEL MAPPING"
echo "────────────────────────────────────────────────"

MAPPING_ISSUES=()

# Define valid subject labels per subtask
declare -A SUBTASK_LABELS
SUBTASK_LABELS["Provisioning of Infrastructure Environments"]="Environment Migration|Cloud Environment Setup|Multi-Environment Consistency and Replication"
SUBTASK_LABELS["Application Deployment"]="Web Application Deployment|Serverless Infrastructure (Functions as Code)"
SUBTASK_LABELS["CI/CD Pipeline Integration"]="CI/CD Pipeline"
SUBTASK_LABELS["Failure Recovery and High Availability"]="Failure Recovery Automation"
SUBTASK_LABELS["Security, Compliance, and Governance"]="Security Configuration as Code"
SUBTASK_LABELS["IaC Program Optimization"]="IaC Diagnosis/Edits|IaC Optimization"
SUBTASK_LABELS["Infrastructure QA and Management"]="Infrastructure Analysis/Monitoring|General Infrastructure Tooling QA"

# Platform requirements for special subtasks
declare -A SUBTASK_PLATFORM
SUBTASK_PLATFORM["CI/CD Pipeline Integration"]="cicd"
SUBTASK_PLATFORM["Infrastructure QA and Management"]="analysis"

declare -A SUBTASK_LANGUAGES
SUBTASK_LANGUAGES["CI/CD Pipeline Integration"]="yaml|yml"
SUBTASK_LANGUAGES["Infrastructure QA and Management"]="py"

# Get subject labels from metadata
SUBJECT_LABELS_RAW=$(jq -r '.subject_labels[]?' metadata.json 2>/dev/null || echo "")

# Validate subject_labels match subtask
if [ -n "${SUBTASK_LABELS[$SUBTASK]}" ]; then
  VALID_LABELS="${SUBTASK_LABELS[$SUBTASK]}"
  
  while IFS= read -r label; do
    [[ -z "$label" ]] && continue
    if [[ ! "$label" =~ ^($VALID_LABELS)$ ]]; then
      MAPPING_ISSUES+=("Subject label '$label' not valid for subtask '$SUBTASK'")
    fi
  done <<< "$SUBJECT_LABELS_RAW"
fi

# Validate platform requirement for special subtasks
if [ -n "${SUBTASK_PLATFORM[$SUBTASK]}" ]; then
  REQUIRED_PLATFORM="${SUBTASK_PLATFORM[$SUBTASK]}"
  if [ "$PLATFORM" != "$REQUIRED_PLATFORM" ]; then
    MAPPING_ISSUES+=("Subtask '$SUBTASK' requires platform='$REQUIRED_PLATFORM', got '$PLATFORM'")
  fi
  
  REQUIRED_LANG="${SUBTASK_LANGUAGES[$SUBTASK]}"
  if [[ ! "$LANGUAGE" =~ ^($REQUIRED_LANG)$ ]]; then
    MAPPING_ISSUES+=("Subtask '$SUBTASK' requires language matching '$REQUIRED_LANG', got '$LANGUAGE'")
  fi
fi

MAPPING_VALID=$([[ ${#MAPPING_ISSUES[@]} -eq 0 ]] && echo "true" || echo "false")

echo "  Subtask: $SUBTASK"
echo "  Subject Labels: $(jq -c '.subject_labels // []' metadata.json 2>/dev/null)"
echo ""
if [ "$MAPPING_VALID" == "true" ]; then
  echo "  Result: PASS"
else
  echo "  Result: FAIL"
  for issue in "${MAPPING_ISSUES[@]}"; do
    echo "     - $issue"
  done
fi

# ═══════════════════════════════════════════════════════
# STEP 3: Strict File/Folder Validation
# ═══════════════════════════════════════════════════════
echo ""
echo "3. VALIDATING FILES/FOLDERS (STRICT)"
echo "────────────────────────────────────────────────"

FILE_ISSUES=()

# Get changed files in this PR
cd ../..
CHANGED_FILES=$(git diff --name-only origin/main...origin/$BRANCH 2>/dev/null || echo "")
cd "$REVIEW_DIR"

# Strict allowed patterns
ALLOWED_PATTERNS=(
  "^bin/.*"
  "^lib/.*"
  "^test/.*"
  "^tests/.*"
  "^gradle/.*"
  "^metadata\.json$"
  "^package\.json$"
  "^package-lock\.json$"
  "^cdk\.json$"
  "^cdktf\.json$"
  "^Pulumi\.yaml$"
  "^tap\.py$"
  "^tap\.go$"
  "^Pipfile$"
  "^Pipfile\.lock$"
  "^requirements\.txt$"
  "^build\.gradle$"
  "^settings\.gradle$"
  "^pom\.xml$"
  "^gradlew$"
  "^gradlew\.bat$"
)

FILE_COUNT=0
INVALID_COUNT=0

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  FILE_COUNT=$((FILE_COUNT + 1))

  is_allowed="false"
  for pattern in "${ALLOWED_PATTERNS[@]}"; do
    if [[ "$file" =~ $pattern ]]; then
      is_allowed="true"
      break
    fi
  done

  if [ "$is_allowed" == "false" ]; then
    FILE_ISSUES+=("$file")
    INVALID_COUNT=$((INVALID_COUNT + 1))
  fi
done <<< "$CHANGED_FILES"

FILES_VALID=$([[ ${#FILE_ISSUES[@]} -eq 0 ]] && echo "true" || echo "false")

echo "  Total files in PR: $FILE_COUNT"
if [ "$FILES_VALID" == "true" ]; then
  echo "  Result: PASS (all files in allowed locations)"
else
  echo "  Result: FAIL ($INVALID_COUNT unexpected files)"
  for file in "${FILE_ISSUES[@]}"; do
    echo "     - $file"
  done
fi

# ═══════════════════════════════════════════════════════
# STEP 4: Required Files Validation
# ═══════════════════════════════════════════════════════
echo ""
echo "4. VALIDATING REQUIRED FILES"
echo "────────────────────────────────────────────────"

REQUIRED_FILES_ISSUES=()

# Base required files for all tasks
BASE_REQUIRED=("lib/PROMPT.md" "lib/MODEL_RESPONSE.md" "lib/IDEAL_RESPONSE.md" "lib/MODEL_FAILURES.md" "metadata.json")

for file in "${BASE_REQUIRED[@]}"; do
  if [ ! -f "$file" ]; then
    REQUIRED_FILES_ISSUES+=("Missing: $file")
  fi
done

# Platform-specific required files
case "$PLATFORM" in
  cdk)
    [ ! -f "cdk.json" ] && REQUIRED_FILES_ISSUES+=("Missing: cdk.json (required for CDK)")
    ;;
  cdktf)
    [ ! -f "cdktf.json" ] && REQUIRED_FILES_ISSUES+=("Missing: cdktf.json (required for CDKTF)")
    ;;
  pulumi)
    [ ! -f "Pulumi.yaml" ] && REQUIRED_FILES_ISSUES+=("Missing: Pulumi.yaml (required for Pulumi)")
    ;;
  cicd)
    [ ! -f "lib/ci-cd.yml" ] && REQUIRED_FILES_ISSUES+=("Missing: lib/ci-cd.yml (required for CI/CD tasks)")
    ;;
  analysis)
    if [ ! -f "lib/analyse.py" ] && [ ! -f "lib/analyze.py" ]; then
      REQUIRED_FILES_ISSUES+=("Missing: lib/analyse.py or lib/analyze.py (required for Analysis tasks)")
    fi
    ;;
esac

# Optimization tasks need optimize.py
if [ "$SUBTASK" == "IaC Program Optimization" ]; then
  [ ! -f "lib/optimize.py" ] && REQUIRED_FILES_ISSUES+=("Missing: lib/optimize.py (required for Optimization tasks)")
fi

REQUIRED_FILES_VALID=$([[ ${#REQUIRED_FILES_ISSUES[@]} -eq 0 ]] && echo "true" || echo "false")

if [ "$REQUIRED_FILES_VALID" == "true" ]; then
  echo "  Result: PASS (all required files present)"
else
  echo "  Result: FAIL"
  for issue in "${REQUIRED_FILES_ISSUES[@]}"; do
    echo "     - $issue"
  done
fi

# ═══════════════════════════════════════════════════════
# STEP 5: Emoji Check in lib/*.md
# ═══════════════════════════════════════════════════════
echo ""
echo "5. CHECKING FOR EMOJIS IN lib/*.md"
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
  echo "  Result: PASS (no emojis found)"
else
  echo "  Result: FAIL (emojis found in:)"
  for file in "${EMOJI_ISSUES[@]}"; do
    echo "     - $file"
  done
fi

# ═══════════════════════════════════════════════════════
# STEP 6: PROMPT.md Style Validation
# ═══════════════════════════════════════════════════════
echo ""
echo "6. VALIDATING PROMPT.md STYLE"
echo "────────────────────────────────────────────────"

PROMPT_ISSUES=()

if [ -f "lib/PROMPT.md" ]; then
  # Check for forbidden AI patterns
  AI_PATTERNS=$(grep -cE '(^ROLE:|^CONTEXT:|^CONSTRAINTS:|Here is a comprehensive|Let me provide|I will create)' lib/PROMPT.md 2>/dev/null || echo 0)
  if [ "$AI_PATTERNS" -gt 0 ]; then
    PROMPT_ISSUES+=("AI-generated patterns found ($AI_PATTERNS occurrences)")
  fi

  # Check for conversational opening
  CONVERSATIONAL=$(head -10 lib/PROMPT.md | grep -cE '(Hey|Hi|We need|I need|Our|The|Create|Build|Deploy|Implement)' 2>/dev/null || echo 0)
  if [ "$CONVERSATIONAL" -eq 0 ]; then
    PROMPT_ISSUES+=("Missing conversational opening")
  fi

  # Check for bold platform statement
  BOLD_PLATFORM=$(grep -cE '\*\*.*\s(with|using)\s.*\*\*' lib/PROMPT.md 2>/dev/null || echo 0)
  if [ "$BOLD_PLATFORM" -eq 0 ]; then
    PROMPT_ISSUES+=("Missing bold platform statement")
  fi
else
  PROMPT_ISSUES+=("lib/PROMPT.md not found")
fi

PROMPT_VALID=$([[ ${#PROMPT_ISSUES[@]} -eq 0 ]] && echo "true" || echo "false")

if [ "$PROMPT_VALID" == "true" ]; then
  echo "  Result: PASS (human-style prompt)"
else
  echo "  Result: FAIL"
  for issue in "${PROMPT_ISSUES[@]}"; do
    echo "     - $issue"
  done
fi

# ═══════════════════════════════════════════════════════
# STEP 7: MODEL_FAILURES Quality Check
# ═══════════════════════════════════════════════════════
echo ""
echo "7. CHECKING MODEL_FAILURES QUALITY"
echo "────────────────────────────────────────────────"

MODEL_FAILURES_QUALITY="unknown"
FAILURE_COUNT=0
CAT_A_FIXES=0

if [ -f "lib/MODEL_FAILURES.md" ]; then
  # Count documented failures
  FAILURE_COUNT=$(grep -cE '^[-*]\s|^[0-9]+\.' lib/MODEL_FAILURES.md 2>/dev/null || echo 0)

  # Check for Category A fixes (significant)
  CAT_A_FIXES=$(grep -ciE 'security|encryption|iam|architecture|monitoring|authentication|kms|multi-az|scaling' lib/MODEL_FAILURES.md 2>/dev/null || echo 0)

  # Determine quality
  if [ "$FAILURE_COUNT" -lt 3 ]; then
    MODEL_FAILURES_QUALITY="low"
  elif [ "$CAT_A_FIXES" -gt 0 ]; then
    MODEL_FAILURES_QUALITY="high"
  else
    MODEL_FAILURES_QUALITY="medium"
  fi
fi

echo "  Documented failures: $FAILURE_COUNT"
echo "  Category A fixes: $CAT_A_FIXES"
echo "  Quality: $MODEL_FAILURES_QUALITY"

# ═══════════════════════════════════════════════════════
# STEP 8: No Retain/DeletionProtection Check
# ═══════════════════════════════════════════════════════
echo ""
echo "8. CHECKING FOR RETAIN/DELETION PROTECTION"
echo "────────────────────────────────────────────────"

RETAIN_COUNT=$(grep -rE 'RemovalPolicy\.RETAIN|removalPolicy:\s*RETAIN|deletion_protection\s*=\s*true|DeletionProtection.*true|deletionProtection:\s*true' lib/ 2>/dev/null | wc -l || echo 0)

NO_RETAIN=$([[ "$RETAIN_COUNT" -eq 0 ]] && echo "true" || echo "false")

if [ "$NO_RETAIN" == "true" ]; then
  echo "  Result: PASS (no retain policies found)"
else
  echo "  Result: FAIL ($RETAIN_COUNT retain/deletion protection found)"
  echo "  Resources with Retain policies cannot be destroyed"
fi

# ═══════════════════════════════════════════════════════
# STEP 9: environmentSuffix Usage Check
# ═══════════════════════════════════════════════════════
echo ""
echo "9. CHECKING environmentSuffix USAGE"
echo "────────────────────────────────────────────────"

SUFFIX_USAGE=0
SUFFIX_VALID="true"

# Check for environmentSuffix in stack files
STACK_FILES=$(find lib -name "*.ts" -o -name "*.py" -o -name "*.go" -o -name "*.java" 2>/dev/null | head -5)

for stack_file in $STACK_FILES; do
  [[ ! -f "$stack_file" ]] && continue
  SUFFIX_USAGE=$((SUFFIX_USAGE + $(grep -c 'environmentSuffix\|environment_suffix\|props\.environmentSuffix\|props\.environment_suffix' "$stack_file" 2>/dev/null || echo 0)))
done

if [ "$SUFFIX_USAGE" -gt 0 ]; then
  echo "  Result: PASS ($SUFFIX_USAGE references found)"
else
  echo "  Result: WARNING (no environmentSuffix references found)"
  SUFFIX_VALID="false"
fi

# ═══════════════════════════════════════════════════════
# STEP 10: Integration Tests Check (No Mocks)
# ═══════════════════════════════════════════════════════
echo ""
echo "10. CHECKING INTEGRATION TESTS"
echo "────────────────────────────────────────────────"

INTEGRATION_ISSUES=()

# Check for mock usage (not allowed in integration tests)
MOCK_COUNT=$(grep -rE 'jest\.mock|sinon\.|@Mock|Mockito\.|mock\(' test/ tests/ 2>/dev/null | wc -l || echo 0)
if [ "$MOCK_COUNT" -gt 0 ]; then
  INTEGRATION_ISSUES+=("Mocking found in tests ($MOCK_COUNT occurrences) - integration tests should use real resources")
fi

# Check if tests use cfn-outputs
CFN_OUTPUT_USAGE=$(grep -r 'cfn-outputs\|flat-outputs' test/ tests/ 2>/dev/null | wc -l || echo 0)
if [ "$CFN_OUTPUT_USAGE" -eq 0 ] && [ -d "test" ]; then
  INTEGRATION_ISSUES+=("Tests don't reference cfn-outputs - integration tests should use deployment outputs")
fi

INTEGRATION_VALID=$([[ ${#INTEGRATION_ISSUES[@]} -eq 0 ]] && echo "true" || echo "false")

echo "  Mock usage: $MOCK_COUNT"
echo "  cfn-outputs references: $CFN_OUTPUT_USAGE"
if [ "$INTEGRATION_VALID" == "true" ]; then
  echo "  Result: PASS"
else
  echo "  Result: WARNING"
  for issue in "${INTEGRATION_ISSUES[@]}"; do
    echo "     - $issue"
  done
fi

# ═══════════════════════════════════════════════════════
# STEP 11: Claude Review Validation
# ═══════════════════════════════════════════════════════
echo ""
echo "11. CHECKING CLAUDE REVIEW"
echo "────────────────────────────────────────────────"

CLAUDE_SCORE=""
CLAUDE_SOURCE=""
CRITICAL_ISSUES=()

cd ../..

# Method 1: Check PR Comments
echo "  Checking PR comments..."

COMMENTS=$(gh pr view $PR_NUMBER --json comments --jq '.comments[].body' 2>/dev/null || echo "")

if [ -n "$COMMENTS" ]; then
  SCORE_MATCH=$(echo "$COMMENTS" | grep -oE "SCORE:[[:space:]]*[0-9]+" | tail -1 || echo "")

  if [ -n "$SCORE_MATCH" ]; then
    CLAUDE_SCORE=$(echo "$SCORE_MATCH" | grep -oE "[0-9]+" | tail -1)
    CLAUDE_SOURCE="PR comments"
    echo "    Found SCORE:$CLAUDE_SCORE in PR comments"

    CRITICAL_LINES=$(echo "$COMMENTS" | grep -E "CRITICAL|FAIL|ERROR" | head -5 || echo "")
    if [ -n "$CRITICAL_LINES" ]; then
      while IFS= read -r line; do
        [[ -n "$line" ]] && CRITICAL_ISSUES+=("$line")
      done <<< "$CRITICAL_LINES"
    fi
  fi
fi

# Method 2: Check CI/CD Job Logs
if [ -z "$CLAUDE_SCORE" ]; then
  echo "    Not found in comments, checking CI/CD logs..."

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
        echo "    Check logs: $JOB_URL"
      fi
    fi
  else
    echo "    No Claude Review job found"
    CLAUDE_SOURCE="not found"
  fi
fi

cd "$REVIEW_DIR"

CLAUDE_VALID="false"
if [ -n "$CLAUDE_SCORE" ] && [ "$CLAUDE_SCORE" -ge 8 ] 2>/dev/null; then
  CLAUDE_VALID="true"
fi

if [ "$CLAUDE_VALID" == "true" ]; then
  echo "  Result: PASS (SCORE $CLAUDE_SCORE)"
else
  echo "  Result: FAIL (score: ${CLAUDE_SCORE:-not found})"
fi

# ═══════════════════════════════════════════════════════
# FINAL: Generate Result & Update Report
# ═══════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════"
echo "REVIEW SUMMARY"
echo "════════════════════════════════════════════════"

# Determine overall merge readiness (core checks)
READY_TO_MERGE="false"
if [[ "$METADATA_VALID" == "true" && "$MAPPING_VALID" == "true" && "$FILES_VALID" == "true" && "$REQUIRED_FILES_VALID" == "true" && "$NO_EMOJIS" == "true" && "$CLAUDE_VALID" == "true" && "$NO_RETAIN" == "true" ]]; then
  READY_TO_MERGE="true"
fi

# Build failure reason
FAILURE_REASON=""
if [ "$READY_TO_MERGE" == "false" ]; then
  REASON_PARTS=()
  [[ "$METADATA_VALID" == "false" ]] && REASON_PARTS+=("metadata")
  [[ "$MAPPING_VALID" == "false" ]] && REASON_PARTS+=("subtask_mapping")
  [[ "$FILES_VALID" == "false" ]] && REASON_PARTS+=("unexpected_files")
  [[ "$REQUIRED_FILES_VALID" == "false" ]] && REASON_PARTS+=("missing_files")
  [[ "$NO_EMOJIS" == "false" ]] && REASON_PARTS+=("emojis")
  [[ "$CLAUDE_VALID" == "false" ]] && REASON_PARTS+=("claude_review")
  [[ "$NO_RETAIN" == "false" ]] && REASON_PARTS+=("retain_policies")
  FAILURE_REASON=$(IFS='; '; echo "${REASON_PARTS[*]}")
fi

# Build validation results JSON
METADATA_ISSUES_JSON=$(printf '%s\n' "${METADATA_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
MAPPING_ISSUES_JSON=$(printf '%s\n' "${MAPPING_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
FILE_ISSUES_JSON=$(printf '%s\n' "${FILE_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
REQUIRED_FILES_ISSUES_JSON=$(printf '%s\n' "${REQUIRED_FILES_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
EMOJI_ISSUES_JSON=$(printf '%s\n' "${EMOJI_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
PROMPT_ISSUES_JSON=$(printf '%s\n' "${PROMPT_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
INTEGRATION_ISSUES_JSON=$(printf '%s\n' "${INTEGRATION_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
CRITICAL_ISSUES_JSON=$(printf '%s\n' "${CRITICAL_ISSUES[@]:-}" | jq -R . | jq -s . 2>/dev/null || echo "[]")

# Build review JSON
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
      "subject_labels": $(jq -c '.subject_labels // []' metadata.json 2>/dev/null || echo "[]"),
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
      "issues": $PROMPT_ISSUES_JSON
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
      "issues": $INTEGRATION_ISSUES_JSON
    },
    "claude_review": {
      "valid": $CLAUDE_VALID,
      "score": ${CLAUDE_SCORE:-null},
      "source": "${CLAUDE_SOURCE:-not found}",
      "critical_issues": $CRITICAL_ISSUES_JSON
    }
  },
  "ready_to_merge": $READY_TO_MERGE,
  "failure_reason": $([ -n "$FAILURE_REASON" ] && echo "\"$FAILURE_REASON\"" || echo "null"),
  "reviewed_at": "$(date -Iseconds)"
}
EOF
)

# Display summary
echo ""
printf "%-25s %s\n" "1.  Metadata:" "$([ "$METADATA_VALID" == "true" ] && echo "PASS" || echo "FAIL")"
printf "%-25s %s\n" "2.  Subtask Mapping:" "$([ "$MAPPING_VALID" == "true" ] && echo "PASS" || echo "FAIL")"
printf "%-25s %s\n" "3.  File Locations:" "$([ "$FILES_VALID" == "true" ] && echo "PASS" || echo "FAIL")"
printf "%-25s %s\n" "4.  Required Files:" "$([ "$REQUIRED_FILES_VALID" == "true" ] && echo "PASS" || echo "FAIL")"
printf "%-25s %s\n" "5.  No Emojis:" "$([ "$NO_EMOJIS" == "true" ] && echo "PASS" || echo "FAIL")"
printf "%-25s %s\n" "6.  PROMPT Style:" "$([ "$PROMPT_VALID" == "true" ] && echo "PASS" || echo "FAIL")"
printf "%-25s %s\n" "7.  MODEL_FAILURES:" "$MODEL_FAILURES_QUALITY ($FAILURE_COUNT fixes)"
printf "%-25s %s\n" "8.  No Retain Policies:" "$([ "$NO_RETAIN" == "true" ] && echo "PASS" || echo "FAIL")"
printf "%-25s %s\n" "9.  environmentSuffix:" "$([ "$SUFFIX_VALID" == "true" ] && echo "PASS" || echo "WARN")"
printf "%-25s %s\n" "10. Integration Tests:" "$([ "$INTEGRATION_VALID" == "true" ] && echo "PASS" || echo "WARN")"
printf "%-25s %s\n" "11. Claude Review:" "$([ "$CLAUDE_VALID" == "true" ] && echo "PASS ($CLAUDE_SCORE)" || echo "FAIL")"
echo "════════════════════════════════════════════════"

if [ "$READY_TO_MERGE" == "true" ]; then
  echo "READY TO MERGE"
else
  echo "NOT READY: $FAILURE_REASON"
fi
echo ""

# Update report file
cd ../..

if [ -f "$REPORT_FILE" ]; then
  jq --argjson review "$REVIEW_JSON" '.reviews += [$review]' "$REPORT_FILE" > "${REPORT_FILE}.tmp"
  mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
  echo "Report updated: $REPORT_FILE"
fi

# Cleanup worktree
echo ""
echo "Cleaning up worktree..."
git worktree remove "$REVIEW_DIR" --force 2>/dev/null || rm -rf "$REVIEW_DIR" 2>/dev/null
echo "Done"
