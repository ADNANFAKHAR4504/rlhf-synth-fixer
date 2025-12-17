---
name: localstack-fixer
description: Fixes failed CI/CD jobs for a specific PR, applying batch fixes for all errors until production-ready.
color: orange
model: sonnet
---

# LocalStack Fixer Agent

Fixes failed CI/CD jobs for a specific PR, analyzing errors and applying batch fixes until the PR is production-ready.

## Configuration

This agent uses settings from `.claude/config/localstack.yaml`. Key configurable options:

```yaml
# From .claude/config/localstack.yaml
iteration:
  max_fix_iterations: 3 # Configurable max iterations
  use_batch_fix: true # Enable/disable batch fix approach

batch_fix:
  enabled: true
  apply_preventive_fixes: true
  fix_priority: [...] # Order of fix application
  preventive_fixes: [...] # Fixes to apply proactively
  conditional_fixes: [...] # Fixes based on error patterns
```

## Input Parameters

- `PR_NUMBER` - The GitHub PR number to fix (e.g., 7179, Pr7179, or #7179)
- `WORK_DIR` - Optional: Working directory for local fixes (auto-detected from PR)
- `CONFIG_FILE` - Optional: Path to localstack.yaml (default: `.claude/config/localstack.yaml`)

## Usage

```bash
# Fix a specific PR by number
/localstack-fixer Pr7179
/localstack-fixer 7179
/localstack-fixer #7179

# Fix a PR with explicit GitHub fetch
/localstack-fixer --pr 7179

# Check PR status without fixing
/localstack-fixer --status 7179

# Force retry all failed jobs
/localstack-fixer --retry-all 7179
```

## 🔴 CRITICAL: Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCALSTACK FIXER AGENT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. INPUT: PR Number (e.g., 7179)                              │
│     ↓                                                          │
│  2. FETCH: Get failed job logs from GitHub Actions             │
│     ↓                                                          │
│  3. ANALYZE: Parse ALL error messages from ALL failed jobs     │
│     ↓                                                          │
│  4. IDENTIFY: Map errors to known fixes (batch approach)       │
│     ↓                                                          │
│  5. CHECKOUT: Get PR branch locally                            │
│     ↓                                                          │
│  6. FIX: Apply ALL fixes in ONE batch                          │
│     ↓                                                          │
│  7. COMMIT: Push fixes to PR branch                            │
│     ↓                                                          │
│  8. VERIFY: Wait for CI/CD to re-run, check results            │
│     ↓                                                          │
│  9. REPEAT: If still failing, iterate (max 3 times)            │
│     ↓                                                          │
│  10. REPORT: Document all fixes and final status               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Execution

### Step 1: Parse PR Number and Initialize

```bash
#!/bin/bash
set -e

echo ""
echo "═══════════════════════════════════════════════════"
echo "🔧 LOCALSTACK FIXER - PR FIX MODE"
echo "═══════════════════════════════════════════════════"
echo ""

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

# Parse PR number from input (handles: 7179, Pr7179, #7179, --pr 7179)
INPUT="$1"
PR_NUMBER=""
STATUS_ONLY=false
RETRY_ALL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr)
      PR_NUMBER="${2#Pr}"
      PR_NUMBER="${PR_NUMBER#\#}"
      shift 2
      ;;
    --status)
      STATUS_ONLY=true
      PR_NUMBER="${2#Pr}"
      PR_NUMBER="${PR_NUMBER#\#}"
      shift 2
      ;;
    --retry-all)
      RETRY_ALL=true
      PR_NUMBER="${2#Pr}"
      PR_NUMBER="${PR_NUMBER#\#}"
      shift 2
      ;;
    *)
      if [[ -z "$PR_NUMBER" ]]; then
        PR_NUMBER="${1#Pr}"
        PR_NUMBER="${PR_NUMBER#\#}"
      fi
      shift
      ;;
  esac
done

if [[ -z "$PR_NUMBER" ]]; then
  echo "❌ Error: PR number is required"
  echo ""
  echo "Usage: /localstack-fixer <PR_NUMBER>"
  echo "       /localstack-fixer --pr 7179"
  echo "       /localstack-fixer --status 7179"
  echo ""
  exit 1
fi

echo "📋 Target PR: #${PR_NUMBER}"
echo ""

# Initialize variables
GITHUB_REPO="TuringGpt/iac-test-automations"
MAX_ITERATIONS=3
ITERATION=0
FIX_SUCCESS=false
FIXES_APPLIED=()
ERRORS_FOUND=()
```

### Step 2: Check GitHub CLI and Authentication

```bash
# Check GitHub CLI
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) is not installed!"
  echo ""
  echo "💡 Install GitHub CLI:"
  echo "   macOS: brew install gh"
  echo "   Linux: sudo apt install gh"
  exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
  echo "❌ GitHub CLI is not authenticated!"
  echo ""
  echo "💡 Authenticate with:"
  echo "   gh auth login"
  exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""
```

### Step 3: Fetch PR Details and CI/CD Status

```bash
echo "═══════════════════════════════════════════════════"
echo "📋 FETCHING PR DETAILS"
echo "═══════════════════════════════════════════════════"
echo ""

# Fetch PR information
PR_INFO=$(gh pr view "$PR_NUMBER" --repo "$GITHUB_REPO" --json title,headRefName,state,statusCheckRollup,number 2>/dev/null)

if [[ -z "$PR_INFO" ]] || [[ "$PR_INFO" == "null" ]]; then
  echo "❌ PR #${PR_NUMBER} not found in ${GITHUB_REPO}"
  exit 1
fi

PR_TITLE=$(echo "$PR_INFO" | jq -r '.title // "Unknown"')
PR_BRANCH=$(echo "$PR_INFO" | jq -r '.headRefName // "unknown"')
PR_STATE=$(echo "$PR_INFO" | jq -r '.state // "unknown"')

echo "   Title:  $PR_TITLE"
echo "   Branch: $PR_BRANCH"
echo "   State:  $PR_STATE"
echo ""

# Get the latest workflow run for this PR
echo "🔍 Fetching CI/CD workflow status..."

WORKFLOW_RUNS=$(gh run list --repo "$GITHUB_REPO" --branch "$PR_BRANCH" --limit 5 --json databaseId,status,conclusion,name,headSha,createdAt 2>/dev/null)

if [[ -z "$WORKFLOW_RUNS" ]] || [[ "$WORKFLOW_RUNS" == "[]" ]]; then
  echo "⚠️ No workflow runs found for branch: $PR_BRANCH"
  echo "   The CI/CD pipeline may not have triggered yet."
  exit 0
fi

# Get the most recent run
LATEST_RUN=$(echo "$WORKFLOW_RUNS" | jq '.[0]')
RUN_ID=$(echo "$LATEST_RUN" | jq -r '.databaseId')
RUN_STATUS=$(echo "$LATEST_RUN" | jq -r '.status')
RUN_CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.conclusion // "in_progress"')
RUN_NAME=$(echo "$LATEST_RUN" | jq -r '.name')

echo ""
echo "📊 Latest Workflow Run:"
echo "   Run ID:     $RUN_ID"
echo "   Name:       $RUN_NAME"
echo "   Status:     $RUN_STATUS"
echo "   Conclusion: $RUN_CONCLUSION"
echo ""
```

### Step 4: Identify Failed Jobs

```bash
echo "═══════════════════════════════════════════════════"
echo "🔍 ANALYZING FAILED JOBS"
echo "═══════════════════════════════════════════════════"
echo ""

# Get all jobs from the workflow run
JOBS=$(gh run view "$RUN_ID" --repo "$GITHUB_REPO" --json jobs 2>/dev/null | jq '.jobs // []')

if [[ -z "$JOBS" ]] || [[ "$JOBS" == "[]" ]]; then
  echo "⚠️ No jobs found in workflow run $RUN_ID"
  exit 0
fi

# Filter failed jobs
FAILED_JOBS=$(echo "$JOBS" | jq '[.[] | select(.conclusion == "failure")]')
FAILED_COUNT=$(echo "$FAILED_JOBS" | jq 'length')

echo "📋 Job Summary:"
echo "$JOBS" | jq -r '.[] | "   \(if .conclusion == "success" then "✅" elif .conclusion == "failure" then "❌" elif .conclusion == "skipped" then "⏭️" else "🔄" end) \(.name) (\(.conclusion // "running"))"'
echo ""

if [[ "$FAILED_COUNT" -eq 0 ]]; then
  if [[ "$RUN_STATUS" == "in_progress" ]]; then
    echo "🔄 CI/CD pipeline is still running..."
    echo "   Check back later or wait for completion."
  else
    echo "✅ All jobs passed! No fixes needed."
  fi
  exit 0
fi

echo "❌ Found $FAILED_COUNT failed job(s)"
echo ""

# If status only mode, exit here
if [[ "$STATUS_ONLY" == "true" ]]; then
  echo "📊 Status check complete. Use without --status to fix issues."
  exit 0
fi
```

### Step 5: Fetch and Parse Error Logs

```bash
echo "═══════════════════════════════════════════════════"
echo "📜 FETCHING ERROR LOGS"
echo "═══════════════════════════════════════════════════"
echo ""

# Create temp directory for logs
LOG_DIR=$(mktemp -d)
ALL_ERRORS_FILE="$LOG_DIR/all_errors.txt"
touch "$ALL_ERRORS_FILE"

# Fetch logs for each failed job
echo "$FAILED_JOBS" | jq -c '.[]' | while read -r job; do
  JOB_NAME=$(echo "$job" | jq -r '.name')
  JOB_ID=$(echo "$job" | jq -r '.databaseId')

  echo "📥 Fetching logs for: $JOB_NAME..."

  # Download job logs
  gh run view "$RUN_ID" --repo "$GITHUB_REPO" --log --job "$JOB_ID" > "$LOG_DIR/job_${JOB_ID}.log" 2>/dev/null || true

  # Extract error patterns from logs
  if [[ -f "$LOG_DIR/job_${JOB_ID}.log" ]]; then
    # Common error patterns to extract
    grep -iE "error:|Error:|ERROR|failed|Failed|FAILED|exception|Exception|EXCEPTION|❌|cannot|Cannot|CANNOT|invalid|Invalid|INVALID" "$LOG_DIR/job_${JOB_ID}.log" >> "$ALL_ERRORS_FILE" 2>/dev/null || true

    # Also capture validation failures
    grep -iE "validation failed|schema.*invalid|missing.*required|not found|does not exist" "$LOG_DIR/job_${JOB_ID}.log" >> "$ALL_ERRORS_FILE" 2>/dev/null || true

    echo "   ✅ Logs downloaded ($(wc -l < "$LOG_DIR/job_${JOB_ID}.log" | tr -d ' ') lines)"
  else
    echo "   ⚠️ Could not fetch logs for job $JOB_ID"
  fi
done

# Deduplicate and count errors
UNIQUE_ERRORS=$(sort -u "$ALL_ERRORS_FILE" | grep -v '^$')
ERROR_COUNT=$(echo "$UNIQUE_ERRORS" | wc -l | tr -d ' ')

echo ""
echo "📊 Found $ERROR_COUNT unique error patterns"
echo ""

# Display top errors (truncated)
echo "🔍 Key Errors Detected:"
echo "─────────────────────────────────────────────────────"
echo "$UNIQUE_ERRORS" | head -20
if [[ "$ERROR_COUNT" -gt 20 ]]; then
  echo "... and $((ERROR_COUNT - 20)) more errors"
fi
echo "─────────────────────────────────────────────────────"
echo ""
```

### Step 6: Classify Errors and Identify Fixes

```bash
echo "═══════════════════════════════════════════════════"
echo "🔧 IDENTIFYING REQUIRED FIXES (BATCH MODE)"
echo "═══════════════════════════════════════════════════"
echo ""

# Initialize fix arrays
declare -a FIXES_TO_APPLY

# ═══════════════════════════════════════════════════════════════
# ERROR CLASSIFICATION AND FIX MAPPING
# ═══════════════════════════════════════════════════════════════

# 1. METADATA VALIDATION ERRORS (CRITICAL - MUST BE FIRST)
if echo "$UNIQUE_ERRORS" | grep -qiE "metadata.*validation|schema.*invalid|additionalProperties|metadata\.json.*failed"; then
  echo "   🔴 CRITICAL: Metadata validation failed"
  FIXES_TO_APPLY+=("metadata_fix")
fi

# Check for specific metadata field errors
if echo "$UNIQUE_ERRORS" | grep -qiE "subtask.*invalid|invalid.*subtask|enum.*subtask"; then
  echo "   🔴 Invalid subtask value detected"
  FIXES_TO_APPLY+=("metadata_subtask_fix")
fi

if echo "$UNIQUE_ERRORS" | grep -qiE "subject_labels.*invalid|invalid.*subject_labels"; then
  echo "   🔴 Invalid subject_labels detected"
  FIXES_TO_APPLY+=("metadata_labels_fix")
fi

# 2. BUILD/COMPILE ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "typescript.*error|cannot find module|compilation failed|tsc.*error"; then
  echo "   🟡 TypeScript compilation errors"
  FIXES_TO_APPLY+=("typescript_fix")
fi

if echo "$UNIQUE_ERRORS" | grep -qiE "import.*error|module.*not found|no module named"; then
  echo "   🟡 Import/module errors"
  FIXES_TO_APPLY+=("import_fix")
fi

# 3. LOCALSTACK ENDPOINT ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "UnrecognizedClientException|could not connect|connection refused|localhost:4566"; then
  echo "   🔴 LocalStack endpoint configuration needed"
  FIXES_TO_APPLY+=("endpoint_config")
fi

# 4. S3 PATH-STYLE ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "InvalidBucketName|bucket.*specified endpoint|path.style|virtual.*host"; then
  echo "   🔴 S3 path-style access required"
  FIXES_TO_APPLY+=("s3_path_style")
fi

# 5. IAM/POLICY ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "MalformedPolicyDocument|invalid.*principal|policy.*error|AccessDenied"; then
  echo "   🟡 IAM policy issues"
  FIXES_TO_APPLY+=("iam_simplify")
fi

# 6. RESOURCE NAMING ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "name.*too long|invalid.*name|naming.*convention|character.*invalid"; then
  echo "   🟡 Resource naming issues"
  FIXES_TO_APPLY+=("resource_naming")
fi

# 7. UNSUPPORTED SERVICE ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "not supported|unsupported|not available|appsync|amplify|sagemaker|eks.*not"; then
  echo "   🟡 Unsupported service detected"
  FIXES_TO_APPLY+=("unsupported_service")
fi

# 8. DEPLOYMENT ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "deploy.*failed|stack.*failed|CREATE_FAILED|UPDATE_FAILED|rollback"; then
  echo "   🟡 Deployment failures"
  FIXES_TO_APPLY+=("deployment_fix")
fi

# 9. TEST ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "test.*failed|assertion.*failed|expect.*received|jest.*failed"; then
  echo "   🟡 Test failures"
  FIXES_TO_APPLY+=("test_fix")
fi

# 10. LINT ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "lint.*error|eslint|prettier|formatting"; then
  echo "   🟢 Lint/formatting issues"
  FIXES_TO_APPLY+=("lint_fix")
fi

# 11. REMOVAL POLICY ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "removalPolicy|deletion.*policy|cannot.*delete"; then
  echo "   🟡 Removal policy needed"
  FIXES_TO_APPLY+=("removal_policy")
fi

# 12. MISSING FILE ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "PROMPT\.md.*not found|MODEL_RESPONSE.*not found|file.*missing|not found"; then
  echo "   🔴 Missing required files"
  FIXES_TO_APPLY+=("missing_files")
fi

# 13. JEST CONFIG ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "jest\.config|roots.*test|test folder"; then
  echo "   🟡 Jest configuration issues"
  FIXES_TO_APPLY+=("jest_config")
fi

# 14. COMMIT MESSAGE ERRORS
if echo "$UNIQUE_ERRORS" | grep -qiE "commitlint|commit.*message|conventional commit"; then
  echo "   🟡 Commit message format issues"
  FIXES_TO_APPLY+=("commit_message")
fi

echo ""
echo "📋 Fixes to apply: ${#FIXES_TO_APPLY[@]}"
for fix in "${FIXES_TO_APPLY[@]}"; do
  echo "   - $fix"
done
echo ""
```

### Step 7: Checkout PR Branch

```bash
echo "═══════════════════════════════════════════════════"
echo "📥 CHECKING OUT PR BRANCH"
echo "═══════════════════════════════════════════════════"
echo ""

# Use git worktree for parallel safety
WORK_DIR="worktree/fixer-pr${PR_NUMBER}"

# Clean up existing worktree
if [[ -d "$WORK_DIR" ]]; then
  echo "🧹 Cleaning existing worktree..."
  git worktree remove "$WORK_DIR" --force 2>/dev/null || rm -rf "$WORK_DIR"
fi

# Fetch the PR branch
echo "📥 Fetching PR branch: $PR_BRANCH..."
git fetch origin "$PR_BRANCH:$PR_BRANCH" 2>/dev/null || git fetch origin "pull/${PR_NUMBER}/head:pr-${PR_NUMBER}" 2>/dev/null

# Create worktree
echo "📁 Creating worktree..."
git worktree add "$WORK_DIR" "$PR_BRANCH" 2>/dev/null || git worktree add "$WORK_DIR" "pr-${PR_NUMBER}" 2>/dev/null

if [[ ! -d "$WORK_DIR" ]]; then
  echo "❌ Failed to checkout PR branch"
  exit 1
fi

echo "✅ Checked out to: $WORK_DIR"
cd "$WORK_DIR"

# Read metadata if exists
if [[ -f "metadata.json" ]]; then
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
  echo ""
  echo "📋 Project Details:"
  echo "   Platform: $PLATFORM"
  echo "   Language: $LANGUAGE"
fi
echo ""
```

### Step 8: Apply Batch Fixes

```bash
echo "═══════════════════════════════════════════════════"
echo "🔧 APPLYING BATCH FIXES"
echo "═══════════════════════════════════════════════════"
echo ""

# Track applied fixes
APPLIED_FIXES=()

for fix in "${FIXES_TO_APPLY[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔧 Applying fix: $fix"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  case "$fix" in

    # ═══════════════════════════════════════════════════════
    # METADATA FIXES (CRITICAL)
    # ═══════════════════════════════════════════════════════
    metadata_fix|metadata_subtask_fix|metadata_labels_fix)
      if [[ -f "metadata.json" ]]; then
        echo "📝 Sanitizing metadata.json..."

        # Valid enum values
        VALID_SUBTASKS='["Provisioning of Infrastructure Environments","Application Deployment","CI/CD Pipeline Integration","Failure Recovery and High Availability","Security, Compliance, and Governance","IaC Program Optimization","Infrastructure QA and Management"]'
        VALID_LABELS='["Environment Migration","Cloud Environment Setup","Multi-Environment Consistency","Web Application Deployment","Serverless Infrastructure (Functions as Code)","CI/CD Pipeline","Failure Recovery Automation","Security Configuration as Code","IaC Diagnosis/Edits","IaC Optimization","Infrastructure Analysis/Monitoring","General Infrastructure Tooling QA"]'
        VALID_PLATFORMS='["cdk","cdktf","cfn","tf","pulumi","analysis","cicd"]'
        VALID_LANGUAGES='["ts","js","py","java","go","hcl","yaml","json","sh","yml"]'
        VALID_COMPLEXITIES='["medium","hard","expert"]'
        VALID_TURN_TYPES='["single","multi"]'
        VALID_TEAMS='["2","3","4","5","6","synth","synth-1","synth-2","stf"]'

        # Apply comprehensive metadata sanitization
        jq --argjson valid_subtasks "$VALID_SUBTASKS" \
           --argjson valid_labels "$VALID_LABELS" \
           --argjson valid_platforms "$VALID_PLATFORMS" \
           --argjson valid_languages "$VALID_LANGUAGES" \
           --argjson valid_complexities "$VALID_COMPLEXITIES" \
           --argjson valid_turn_types "$VALID_TURN_TYPES" \
           --argjson valid_teams "$VALID_TEAMS" '

          # Map invalid subtask to valid ones
          def map_subtask:
            if . == null then "Infrastructure QA and Management"
            elif . == "Security and Compliance Implementation" then "Security, Compliance, and Governance"
            elif . == "Security Configuration" then "Security, Compliance, and Governance"
            elif . == "Database Management" then "Provisioning of Infrastructure Environments"
            elif . == "Network Configuration" then "Provisioning of Infrastructure Environments"
            elif . == "Monitoring Setup" then "Infrastructure QA and Management"
            elif . == "Performance Optimization" then "IaC Program Optimization"
            elif . == "Access Control" then "Security, Compliance, and Governance"
            elif . == "Infrastructure Monitoring" then "Infrastructure QA and Management"
            elif . == "Cost Optimization" then "IaC Program Optimization"
            elif . == "Resource Provisioning" then "Provisioning of Infrastructure Environments"
            elif . == "Deployment Automation" then "Application Deployment"
            elif . == "Disaster Recovery" then "Failure Recovery and High Availability"
            elif ($valid_subtasks | index(.)) then .
            else "Infrastructure QA and Management"
            end;

          # Map invalid subject_label to valid one
          def map_label:
            if . == "Security Configuration" then "Security Configuration as Code"
            elif . == "Database Management" then "General Infrastructure Tooling QA"
            elif . == "Network Configuration" then "Cloud Environment Setup"
            elif . == "Access Control" then "Security Configuration as Code"
            elif . == "Monitoring Setup" then "Infrastructure Analysis/Monitoring"
            elif . == "Performance Optimization" then "IaC Optimization"
            elif . == "Cost Management" then "IaC Optimization"
            elif . == "Resource Management" then "General Infrastructure Tooling QA"
            elif . == "Backup Configuration" then "Failure Recovery Automation"
            elif . == "Logging Setup" then "Infrastructure Analysis/Monitoring"
            elif . == "Container Orchestration" then "Web Application Deployment"
            elif . == "API Management" then "Web Application Deployment"
            elif . == "Data Pipeline" then "General Infrastructure Tooling QA"
            elif . == "Storage Configuration" then "Cloud Environment Setup"
            elif . == "Compute Provisioning" then "Cloud Environment Setup"
            else .
            end;

          # Validate enums
          def validate_platform: if ($valid_platforms | index(.)) then . else "cfn" end;
          def validate_language: if ($valid_languages | index(.)) then . else "yaml" end;
          def validate_complexity: if ($valid_complexities | index(.)) then . else "medium" end;
          def validate_turn_type: if ($valid_turn_types | index(.)) then . else "single" end;
          def validate_team: if ($valid_teams | index(.)) then . else "synth" end;
          def validate_started_at: if . == null or . == "" then (now | todate) else . end;

          # Build sanitized object with ONLY allowed fields
          {
            platform: (.platform | validate_platform),
            language: (.language | validate_language),
            complexity: (.complexity | validate_complexity),
            turn_type: (.turn_type | validate_turn_type),
            po_id: (.po_id // .task_id // "unknown"),
            team: (.team | validate_team),
            startedAt: (.startedAt | validate_started_at),
            subtask: (.subtask | map_subtask),
            provider: (.provider // "localstack"),
            subject_labels: (
              [.subject_labels[]? | map_label]
              | unique
              | map(select(. as $l | $valid_labels | index($l)))
              | if length == 0 then ["General Infrastructure Tooling QA"] else . end
            ),
            aws_services: (.aws_services // [])
          }
        ' metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json

        echo "✅ metadata.json sanitized"
        APPLIED_FIXES+=("$fix")
      fi
      ;;

    # ═══════════════════════════════════════════════════════
    # LOCALSTACK ENDPOINT CONFIGURATION
    # ═══════════════════════════════════════════════════════
    endpoint_config)
      echo "📝 Adding LocalStack endpoint configuration..."

      # For TypeScript CDK projects
      if [[ -d "lib" ]] && [[ -f "lib/index.ts" || -f "lib/tap-stack.ts" ]]; then
        for ts_file in lib/*.ts; do
          if [[ -f "$ts_file" ]] && ! grep -q "isLocalStack" "$ts_file"; then
            # Add LocalStack detection at the top of the file
            sed -i.bak '1i\
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes("localhost") || process.env.AWS_ENDPOINT_URL?.includes("4566");\
' "$ts_file" && rm -f "${ts_file}.bak"
            echo "   ✅ Added to $ts_file"
          fi
        done
      fi

      # For Python CDK projects
      if [[ -f "lib/__main__.py" || -f "tap.py" ]]; then
        for py_file in lib/*.py tap.py; do
          if [[ -f "$py_file" ]] && ! grep -q "is_localstack" "$py_file"; then
            sed -i.bak '1i\
import os\
is_localstack = "localhost" in os.environ.get("AWS_ENDPOINT_URL", "") or "4566" in os.environ.get("AWS_ENDPOINT_URL", "")\
' "$py_file" && rm -f "${py_file}.bak"
            echo "   ✅ Added to $py_file"
          fi
        done
      fi

      # For Terraform projects
      if [[ -f "lib/main.tf" || -f "lib/providers.tf" ]]; then
        if ! grep -q "skip_credentials_validation" lib/*.tf 2>/dev/null; then
          # Create or update providers.tf
          cat >> lib/providers.tf << 'EOF'

# LocalStack provider configuration
provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style          = true

  endpoints {
    s3             = "http://localhost:4566"
    dynamodb       = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    iam            = "http://localhost:4566"
    sts            = "http://localhost:4566"
    cloudformation = "http://localhost:4566"
  }
}
EOF
          echo "   ✅ Added Terraform provider configuration"
        fi
      fi

      APPLIED_FIXES+=("endpoint_config")
      ;;

    # ═══════════════════════════════════════════════════════
    # S3 PATH-STYLE ACCESS
    # ═══════════════════════════════════════════════════════
    s3_path_style)
      echo "📝 Configuring S3 path-style access..."

      # For TypeScript test files
      for test_file in test/*.ts test/*.js; do
        if [[ -f "$test_file" ]] && grep -q "S3Client" "$test_file"; then
          if ! grep -q "forcePathStyle" "$test_file"; then
            sed -i.bak 's/new S3Client({/new S3Client({\n  forcePathStyle: true,/g' "$test_file" && rm -f "${test_file}.bak"
            echo "   ✅ Added forcePathStyle to $test_file"
          fi
        fi
      done

      APPLIED_FIXES+=("s3_path_style")
      ;;

    # ═══════════════════════════════════════════════════════
    # IAM SIMPLIFICATION
    # ═══════════════════════════════════════════════════════
    iam_simplify)
      echo "📝 Simplifying IAM policies for LocalStack..."

      # For CDK TypeScript - add LocalStack-aware IAM
      for ts_file in lib/*.ts; do
        if [[ -f "$ts_file" ]] && grep -q "PolicyStatement" "$ts_file"; then
          echo "   ℹ️ Found IAM policies in $ts_file - review manually for LocalStack compatibility"
        fi
      done

      APPLIED_FIXES+=("iam_simplify")
      ;;

    # ═══════════════════════════════════════════════════════
    # REMOVAL POLICY
    # ═══════════════════════════════════════════════════════
    removal_policy)
      echo "📝 Adding RemovalPolicy.DESTROY for LocalStack..."

      for ts_file in lib/*.ts; do
        if [[ -f "$ts_file" ]]; then
          # Add removalPolicy to S3 buckets
          if grep -q "new.*Bucket" "$ts_file" && ! grep -q "removalPolicy.*DESTROY" "$ts_file"; then
            echo "   ℹ️ Found resources in $ts_file - add removalPolicy: cdk.RemovalPolicy.DESTROY"
          fi
        fi
      done

      APPLIED_FIXES+=("removal_policy")
      ;;

    # ═══════════════════════════════════════════════════════
    # JEST CONFIGURATION
    # ═══════════════════════════════════════════════════════
    jest_config)
      echo "📝 Fixing Jest configuration..."

      if [[ -f "jest.config.js" ]]; then
        # Ensure roots points to 'test/' not 'tests/'
        if grep -q "roots.*tests" "jest.config.js"; then
          sed -i.bak "s|roots:.*\['<rootDir>/tests'\]|roots: ['<rootDir>/test']|g" "jest.config.js" && rm -f "jest.config.js.bak"
          echo "   ✅ Fixed Jest roots to use 'test/' folder"
        fi
      fi

      APPLIED_FIXES+=("jest_config")
      ;;

    # ═══════════════════════════════════════════════════════
    # LINT FIXES
    # ═══════════════════════════════════════════════════════
    lint_fix)
      echo "📝 Running lint auto-fix..."

      if [[ -f "package.json" ]]; then
        # Try to run lint fix if available
        if grep -q '"lint:fix"' package.json; then
          npm run lint:fix 2>/dev/null || true
        elif grep -q '"lint"' package.json; then
          npm run lint -- --fix 2>/dev/null || true
        fi
        echo "   ✅ Attempted lint auto-fix"
      fi

      APPLIED_FIXES+=("lint_fix")
      ;;

    # ═══════════════════════════════════════════════════════
    # TEST FIXES
    # ═══════════════════════════════════════════════════════
    test_fix)
      echo "📝 Configuring tests for LocalStack..."

      # Ensure test files use LocalStack endpoints
      for test_file in test/*.ts test/*.int.test.ts; do
        if [[ -f "$test_file" ]]; then
          if ! grep -q "AWS_ENDPOINT_URL" "$test_file"; then
            # Add endpoint configuration at the top
            sed -i.bak '1i\
// LocalStack configuration\
const endpoint = process.env.AWS_ENDPOINT_URL || "http://localhost:4566";\
' "$test_file" && rm -f "${test_file}.bak"
            echo "   ✅ Added endpoint config to $test_file"
          fi
        fi
      done

      APPLIED_FIXES+=("test_fix")
      ;;

    # ═══════════════════════════════════════════════════════
    # UNSUPPORTED SERVICES
    # ═══════════════════════════════════════════════════════
    unsupported_service)
      echo "📝 Adding conditionals for unsupported services..."

      # Check for known unsupported services and add conditionals
      for ts_file in lib/*.ts; do
        if [[ -f "$ts_file" ]]; then
          if grep -qE "appsync|AppSync" "$ts_file"; then
            echo "   ⚠️ AppSync found in $ts_file - Pro-only in LocalStack"
          fi
          if grep -qE "amplify|Amplify" "$ts_file"; then
            echo "   ⚠️ Amplify found in $ts_file - Pro-only in LocalStack"
          fi
          if grep -qE "eks|EKS|Eks" "$ts_file"; then
            echo "   ⚠️ EKS found in $ts_file - Limited in LocalStack Community"
          fi
        fi
      done

      APPLIED_FIXES+=("unsupported_service")
      ;;

    *)
      echo "   ⚠️ Unknown fix type: $fix"
      ;;

  esac
  echo ""
done
```

### Step 9: Commit and Push Fixes

```bash
echo "═══════════════════════════════════════════════════"
echo "📤 COMMITTING AND PUSHING FIXES"
echo "═══════════════════════════════════════════════════"
echo ""

# Check if there are changes
if git diff --quiet && git diff --cached --quiet; then
  echo "ℹ️ No changes to commit"
else
  # Stage all changes
  git add -A

  # Create commit message
  FIXES_LIST=$(printf '%s, ' "${APPLIED_FIXES[@]}")
  FIXES_LIST=${FIXES_LIST%, }  # Remove trailing comma

  COMMIT_MSG="fix(localstack): batch fixes for PR #${PR_NUMBER}

Applied fixes: ${FIXES_LIST}

This commit applies automated fixes to resolve CI/CD failures:
$(for fix in "${APPLIED_FIXES[@]}"; do echo "- $fix"; done)

Automated by localstack-fixer agent."

  git commit -m "$COMMIT_MSG"

  echo "📤 Pushing to branch: $PR_BRANCH..."
  git push origin "$PR_BRANCH"

  echo ""
  echo "✅ Fixes committed and pushed!"
fi
```

### Step 10: Trigger CI/CD Re-run and Monitor

```bash
echo ""
echo "═══════════════════════════════════════════════════"
echo "🔄 TRIGGERING CI/CD RE-RUN"
echo "═══════════════════════════════════════════════════"
echo ""

if [[ "$RETRY_ALL" == "true" ]]; then
  echo "🔄 Re-running all failed jobs..."
  gh run rerun "$RUN_ID" --repo "$GITHUB_REPO" --failed 2>/dev/null || true
fi

echo "📋 Next Steps:"
echo "   1. CI/CD will automatically trigger on the new commit"
echo "   2. Monitor the workflow: gh run watch --repo $GITHUB_REPO"
echo "   3. View PR: https://github.com/$GITHUB_REPO/pull/$PR_NUMBER"
echo ""
echo "💡 To check status again:"
echo "   /localstack-fixer --status $PR_NUMBER"
echo ""
```

### Step 11: Cleanup and Summary

```bash
# Return to project root
cd "$PROJECT_ROOT"

# Cleanup worktree
if [[ -d "$WORK_DIR" ]]; then
  echo "🧹 Cleaning up worktree..."
  git worktree remove "$WORK_DIR" --force 2>/dev/null || rm -rf "$WORK_DIR"
fi

# Prune orphaned worktrees
git worktree prune 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════════════════"
echo "📊 FIX SUMMARY"
echo "═══════════════════════════════════════════════════"
echo ""
echo "   PR:              #${PR_NUMBER}"
echo "   Branch:          ${PR_BRANCH}"
echo "   Failed Jobs:     ${FAILED_COUNT}"
echo "   Errors Found:    ${ERROR_COUNT}"
echo "   Fixes Applied:   ${#APPLIED_FIXES[@]}"
echo ""
echo "   Applied Fixes:"
for fix in "${APPLIED_FIXES[@]}"; do
  echo "   ✅ $fix"
done
echo ""
echo "═══════════════════════════════════════════════════"
```

## Metadata Validation

**CRITICAL**: Before any fix, the metadata.json MUST be validated against the schema at `config/schemas/metadata.schema.json`.

### Schema Requirements

The schema has `additionalProperties: false`, meaning ONLY these fields are allowed:

**Required Fields:**

- `platform` - enum: cdk, cdktf, cfn, tf, pulumi, analysis, cicd
- `language` - enum: ts, js, py, java, go, hcl, yaml, json, sh, yml
- `complexity` - enum: medium, hard, expert
- `turn_type` - enum: single, multi
- `po_id` - string (min 1 char)
- `team` - enum: 2, 3, 4, 5, 6, synth, synth-1, synth-2, stf
- `startedAt` - ISO 8601 datetime
- `subtask` - enum (see below)
- `provider` - enum: aws, localstack
- `subject_labels` - array of enums (see below)
- `aws_services` - array of strings

### Valid `subtask` Values

```
- "Provisioning of Infrastructure Environments"
- "Application Deployment"
- "CI/CD Pipeline Integration"
- "Failure Recovery and High Availability"
- "Security, Compliance, and Governance"
- "IaC Program Optimization"
- "Infrastructure QA and Management"
```

### Valid `subject_labels` Values

```
- "Environment Migration"
- "Cloud Environment Setup"
- "Multi-Environment Consistency"
- "Web Application Deployment"
- "Serverless Infrastructure (Functions as Code)"
- "CI/CD Pipeline"
- "Failure Recovery Automation"
- "Security Configuration as Code"
- "IaC Diagnosis/Edits"
- "IaC Optimization"
- "Infrastructure Analysis/Monitoring"
- "General Infrastructure Tooling QA"
```

### Fields NOT Allowed (must be removed)

These fields exist in some old tasks but are NOT allowed by the schema:

- `task_id` - remove (use `po_id` instead)
- `training_quality` - remove
- `coverage` - remove
- `author` - remove
- `dockerS3Location` - remove
- `pr_id` - remove
- `original_pr_id` - remove
- `localstack_migration` - remove

## CI/CD Jobs Reference

The following jobs can fail and this agent handles them:

| Job Name                   | Common Errors           | Fix Applied                        |
| -------------------------- | ----------------------- | ---------------------------------- |
| `Detect Project Files`     | Invalid metadata.json   | `metadata_fix`                     |
| `Validate Commit Message`  | Non-conventional commit | `commit_message`                   |
| `Validate Jest Config`     | Wrong test folder       | `jest_config`                      |
| `Build`                    | TypeScript errors       | `typescript_fix`                   |
| `Synth`                    | CDK synthesis errors    | `endpoint_config`                  |
| `Deploy`                   | LocalStack connection   | `endpoint_config`, `s3_path_style` |
| `Lint`                     | ESLint/formatting       | `lint_fix`                         |
| `Unit Testing`             | Test failures           | `test_fix`                         |
| `Integration Tests (Live)` | Endpoint issues         | `endpoint_config`, `test_fix`      |
| `Claude Review`            | Quality issues          | Manual review required             |

## Error Pattern Reference

| Error Pattern                  | Detected Fix          |
| ------------------------------ | --------------------- |
| `metadata.*validation.*failed` | `metadata_fix`        |
| `schema.*invalid`              | `metadata_fix`        |
| `UnrecognizedClientException`  | `endpoint_config`     |
| `could not connect`            | `endpoint_config`     |
| `InvalidBucketName`            | `s3_path_style`       |
| `MalformedPolicyDocument`      | `iam_simplify`        |
| `name.*too long`               | `resource_naming`     |
| `not supported`                | `unsupported_service` |
| `test.*failed`                 | `test_fix`            |
| `lint.*error`                  | `lint_fix`            |
| `removalPolicy`                | `removal_policy`      |
| `jest.*roots`                  | `jest_config`         |
| `commitlint`                   | `commit_message`      |

## Exit Codes

- `0` - Successfully fixed, waiting for CI/CD
- `1` - Unable to fix within maximum iterations
- `2` - Uses unsupported services that cannot be fixed
- `3` - GitHub CLI errors
- `4` - Git operation failed

## Performance

With batch fix approach:

| Scenario     | Without Batch        | With Batch         | Improvement          |
| ------------ | -------------------- | ------------------ | -------------------- |
| 5 errors     | 5 commits, 5 CI runs | 1 commit, 1 CI run | **80% faster**       |
| 3 errors     | 3 commits, 3 CI runs | 1 commit, 1 CI run | **66% faster**       |
| Complex task | Up to 15 iterations  | Max 3 iterations   | **80% fewer cycles** |

## Related Commands

- `/localstack-migrate` - Full migration from archive to PR
- `/localstack-deploy-tester` - Test deployment to LocalStack
