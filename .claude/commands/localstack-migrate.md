---
name: localstack-migrate
description: Migrates tasks from archive folder or GitHub PR to LocalStack, testing deployment and fixing issues until successful.
color: green
model: sonnet
---

# LocalStack Migration Command

Picks a task from the archive folder (or fetches from GitHub PR if not found locally) and ensures it's deployable to LocalStack, fixing issues iteratively until successful.

## Configuration

This command uses settings from `.claude/config/localstack.yaml`. Key configurable options:

| Setting                                | Default | Description                    |
| -------------------------------------- | ------- | ------------------------------ |
| `iteration.max_fix_iterations`         | 3       | Maximum fix iterations         |
| `iteration.use_batch_fix`              | true    | Enable batch fix approach      |
| `localstack.reset_state_before_deploy` | false   | Reset LocalStack before deploy |
| `parallel.enabled`                     | true    | Enable parallel execution      |
| `parallel.max_concurrent_agents`       | 10      | Max parallel agents            |
| `smart_selection.enabled`              | true    | Enable smart task selection    |

See `.claude/config/localstack.yaml` for full configuration options.

## Usage

```bash
# Migrate a specific task by path
/localstack-migrate ./archive/cdk-ts/Pr7179

# Migrate by PR number (auto-detects platform, fetches from GitHub if not in archive)
/localstack-migrate Pr7179

# Migrate by PR number with explicit GitHub fetch
/localstack-migrate --github Pr2077

# Migrate next unprocessed task from a specific platform
/localstack-migrate --platform cdk-ts

# Migrate next unprocessed task (sequential)
/localstack-migrate --next

# Smart selection (highest success probability)
/localstack-migrate --smart

# Filter by AWS service
/localstack-migrate --service S3

# Show migration statistics
/localstack-migrate --stats

# PARALLEL EXECUTION: Skip LocalStack reset (for running multiple agents)
/localstack-migrate --no-reset Pr7179

# PARALLEL EXECUTION: Multiple agents on different PRs
# Terminal 1: /localstack-migrate --no-reset Pr7179
# Terminal 2: /localstack-migrate --no-reset Pr7180
# Terminal 3: /localstack-migrate --no-reset Pr7181
```

## Workflow

### Step 1: Initialize and Validate Environment

```bash
echo ""
echo "═══════════════════════════════════════════════════"
echo "🚀 LOCALSTACK MIGRATION"
echo "═══════════════════════════════════════════════════"
echo ""

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

# Parse arguments
TASK_PATH="${1:-}"
PLATFORM_FILTER=""
SERVICE_FILTER=""
PICK_NEXT=false
SMART_SELECT=false
SHOW_STATS=false
FORCE_GITHUB=false
SKIP_RESET=false
GITHUB_REPO="TuringGpt/iac-test-automations"

# Parse flags (support combining --no-reset with other options)
ARGS=("$@")
for ((i=0; i<${#ARGS[@]}; i++)); do
  case "${ARGS[i]}" in
    --no-reset)
      SKIP_RESET=true
      echo "🔄 Parallel mode: LocalStack state reset will be skipped"
      ;;
    --platform)
      PLATFORM_FILTER="${ARGS[i+1]:-}"
      TASK_PATH=""
      ((i++))
      ;;
    --service)
      SERVICE_FILTER="${ARGS[i+1]:-}"
      TASK_PATH=""
      ((i++))
      ;;
    --next)
      PICK_NEXT=true
      TASK_PATH=""
      ;;
    --smart)
      SMART_SELECT=true
      TASK_PATH=""
      ;;
    --stats)
      SHOW_STATS=true
      TASK_PATH=""
      ;;
    --github)
      FORCE_GITHUB=true
      TASK_PATH="${ARGS[i+1]:-}"
      ((i++))
      ;;
    *)
      # If not a flag and TASK_PATH is empty, treat as task path
      if [[ ! "${ARGS[i]}" =~ ^-- ]] && [ -z "$TASK_PATH" ]; then
        TASK_PATH="${ARGS[i]}"
      fi
      ;;
  esac
done

# Check LocalStack is running
echo "🔍 Checking LocalStack status..."
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
  echo "❌ LocalStack is not running!"
  echo ""
  echo "💡 Start LocalStack first:"
  echo "   ./scripts/localstack-start.sh"
  echo ""
  exit 1
fi

LOCALSTACK_VERSION=$(curl -s http://localhost:4566/_localstack/health | jq -r '.version // "unknown"')
echo "✅ LocalStack is running (version: $LOCALSTACK_VERSION)"
echo ""

# Check required tools
MISSING_TOOLS=()
for tool in awslocal jq curl; do
  if ! command -v $tool &> /dev/null; then
    MISSING_TOOLS+=("$tool")
  fi
done

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
  echo "❌ Missing required tools: ${MISSING_TOOLS[*]}"
  echo "💡 Install with: pip install awscli-local (for awslocal)"
  exit 1
fi
echo "✅ Required tools available"
echo ""
```

### Step 2: Initialize Migration Log

```bash
MIGRATION_LOG=".claude/reports/localstack-migrations.json"
mkdir -p .claude/reports

# Initialize migration log if not exists
if [ ! -f "$MIGRATION_LOG" ]; then
  cat > "$MIGRATION_LOG" << 'EOF'
{
  "created_at": "$(date -Iseconds)",
  "migrations": [],
  "summary": {
    "total_attempted": 0,
    "successful": 0,
    "failed": 0
  }
}
EOF
  # Fix the date
  jq --arg ts "$(date -Iseconds)" '.created_at = $ts' "$MIGRATION_LOG" > "${MIGRATION_LOG}.tmp"
  mv "${MIGRATION_LOG}.tmp" "$MIGRATION_LOG"
  echo "📋 Created migration log: $MIGRATION_LOG"
fi
```

### Step 3: Show Statistics (if requested)

```bash
if [ "$SHOW_STATS" = true ]; then
  echo "═══════════════════════════════════════════════════"
  echo "📊 LOCALSTACK MIGRATION STATISTICS"
  echo "═══════════════════════════════════════════════════"
  echo ""

  # Count total archive tasks
  TOTAL_ARCHIVE=$(find archive -maxdepth 3 -type d -name "Pr*" 2>/dev/null | wc -l | tr -d ' ')

  # Get migration stats
  TOTAL_MIGRATED=$(jq '.summary.total_attempted // 0' "$MIGRATION_LOG")
  SUCCESSFUL=$(jq '.summary.successful // 0' "$MIGRATION_LOG")
  FAILED=$(jq '.summary.failed // 0' "$MIGRATION_LOG")
  REMAINING=$((TOTAL_ARCHIVE - TOTAL_MIGRATED))

  echo "┌─────────────────────────────────────────────────┐"
  echo "│ OVERALL PROGRESS                                │"
  echo "├─────────────────────────────────────────────────┤"
  printf "│ %-25s %21s │\n" "Total Archive Tasks:" "$TOTAL_ARCHIVE"
  printf "│ %-25s %21s │\n" "Attempted:" "$TOTAL_MIGRATED"
  printf "│ %-25s %21s │\n" "Successful:" "$SUCCESSFUL"
  printf "│ %-25s %21s │\n" "Failed:" "$FAILED"
  printf "│ %-25s %21s │\n" "Remaining:" "$REMAINING"
  echo "└─────────────────────────────────────────────────┘"
  echo ""

  # By platform breakdown
  echo "📁 By Platform:"
  for platform_dir in archive/*/; do
    if [ -d "$platform_dir" ]; then
      PLATFORM_NAME=$(basename "$platform_dir")
      PLATFORM_TOTAL=$(find "$platform_dir" -maxdepth 2 -type d -name "Pr*" 2>/dev/null | wc -l | tr -d ' ')
      PLATFORM_MIGRATED=$(jq --arg p "archive/$PLATFORM_NAME" '[.migrations[] | select(.task_path | startswith($p))] | length' "$MIGRATION_LOG" 2>/dev/null || echo "0")
      if [ "$PLATFORM_TOTAL" -gt 0 ]; then
        PCT=$((PLATFORM_MIGRATED * 100 / PLATFORM_TOTAL))
        printf "   %-15s %5s / %5s (%3s%%)\n" "$PLATFORM_NAME:" "$PLATFORM_MIGRATED" "$PLATFORM_TOTAL" "$PCT"
      fi
    fi
  done
  echo ""

  # Recent migrations
  echo "📜 Recent Migrations (last 5):"
  jq -r '.migrations | sort_by(.attempted_at) | reverse | .[0:5] | .[] | "   \(.status | if . == "success" then "✅" else "❌" end) \(.task_path) (\(.attempted_at | split("T")[0]))"' "$MIGRATION_LOG" 2>/dev/null || echo "   No migrations yet"
  echo ""

  exit 0
fi
```

### Step 4: Select Task to Migrate (with GitHub Fetch Support)

```bash
FETCHED_FROM_GITHUB=false

if [ -n "$TASK_PATH" ]; then
  # Manual path provided
  if [[ "$TASK_PATH" =~ ^Pr[0-9]+$ ]] || [[ "$TASK_PATH" =~ ^[0-9]+$ ]]; then
    # Normalize PR number format
    PR_NUMBER="${TASK_PATH#Pr}"
    PR_ID="Pr${PR_NUMBER}"

    # Find task by PR number in archive
    FOUND_PATH=$(find archive -maxdepth 3 -type d -name "$PR_ID" 2>/dev/null | head -1)

    if [ -z "$FOUND_PATH" ] || [ "$FORCE_GITHUB" = true ]; then
      echo ""
      echo "═══════════════════════════════════════════════════"
      echo "🔍 FETCHING FROM GITHUB"
      echo "═══════════════════════════════════════════════════"
      echo ""

      if [ -z "$FOUND_PATH" ]; then
        echo "📋 Task $PR_ID not found in archive directory"
      else
        echo "📋 Force GitHub fetch requested for $PR_ID"
      fi
      echo "🌐 Fetching from GitHub PR #${PR_NUMBER}..."
      echo ""

      # Check if gh CLI is available
      if ! command -v gh &> /dev/null; then
        echo "❌ GitHub CLI (gh) is not installed!"
        echo ""
        echo "💡 Install GitHub CLI:"
        echo "   macOS: brew install gh"
        echo "   Linux: sudo apt install gh"
        echo ""
        echo "💡 Then authenticate:"
        echo "   gh auth login"
        exit 1
      fi

      # Check if authenticated
      if ! gh auth status &> /dev/null; then
        echo "❌ GitHub CLI is not authenticated!"
        echo ""
        echo "💡 Authenticate with:"
        echo "   gh auth login"
        exit 1
      fi

      echo "✅ GitHub CLI authenticated"

      # Fetch PR details
      echo "📥 Fetching PR #${PR_NUMBER} details from ${GITHUB_REPO}..."

      PR_INFO=$(gh pr view "$PR_NUMBER" --repo "$GITHUB_REPO" --json title,headRefName,files,state 2>/dev/null)

      if [ -z "$PR_INFO" ] || [ "$PR_INFO" = "null" ]; then
        echo "❌ PR #${PR_NUMBER} not found in ${GITHUB_REPO}"
        echo ""
        echo "💡 Verify the PR exists:"
        echo "   gh pr view $PR_NUMBER --repo $GITHUB_REPO"
        exit 1
      fi

      PR_TITLE=$(echo "$PR_INFO" | jq -r '.title // "Unknown"')
      PR_BRANCH=$(echo "$PR_INFO" | jq -r '.headRefName // "unknown"')
      PR_STATE=$(echo "$PR_INFO" | jq -r '.state // "unknown"')

      echo ""
      echo "   Title:  $PR_TITLE"
      echo "   Branch: $PR_BRANCH"
      echo "   State:  $PR_STATE"
      echo ""

      # Create temporary directory for PR files
      GITHUB_WORK_DIR="worktree/github-${PR_ID}"
      rm -rf "$GITHUB_WORK_DIR"
      mkdir -p "$GITHUB_WORK_DIR"

      echo "📁 Created temp directory: $GITHUB_WORK_DIR"

      # Fetch the PR diff and extract changed files
      echo "📥 Downloading PR files..."

      # Get the list of files changed in the PR
      PR_FILES=$(gh pr diff "$PR_NUMBER" --repo "$GITHUB_REPO" --name-only 2>/dev/null)

      if [ -z "$PR_FILES" ]; then
        echo "⚠️  No files found in PR diff, trying to checkout branch..."

        # Alternative: checkout the PR branch
        git fetch origin "pull/${PR_NUMBER}/head:pr-${PR_NUMBER}" 2>/dev/null || true

        if git rev-parse "pr-${PR_NUMBER}" &>/dev/null; then
          # Get files from the PR branch
          git show "pr-${PR_NUMBER}:." --name-only 2>/dev/null | while read -r file; do
            if [ -n "$file" ]; then
              mkdir -p "$GITHUB_WORK_DIR/$(dirname "$file")"
              git show "pr-${PR_NUMBER}:$file" > "$GITHUB_WORK_DIR/$file" 2>/dev/null || true
            fi
          done

          # Clean up the temporary branch
          git branch -D "pr-${PR_NUMBER}" 2>/dev/null || true
        fi
      else
        # Download each file from the PR
        echo "$PR_FILES" | while read -r file; do
          if [ -n "$file" ]; then
            echo "   📄 $file"
            mkdir -p "$GITHUB_WORK_DIR/$(dirname "$file")"
            gh api "repos/${GITHUB_REPO}/contents/${file}?ref=${PR_BRANCH}" --jq '.content' 2>/dev/null | base64 -d > "$GITHUB_WORK_DIR/$file" 2>/dev/null || true
          fi
        done
      fi

      # Check if we got the essential files
      if [ ! -f "$GITHUB_WORK_DIR/metadata.json" ] && [ ! -f "$GITHUB_WORK_DIR/lib/index.ts" ] && [ ! -f "$GITHUB_WORK_DIR/lib/__main__.py" ]; then
        echo ""
        echo "⚠️  Could not find task files in PR. Trying full branch checkout..."

        # Try checking out the full branch content
        TEMP_CLONE_DIR=$(mktemp -d)
        git clone --depth 1 --branch "$PR_BRANCH" "https://github.com/${GITHUB_REPO}.git" "$TEMP_CLONE_DIR" 2>/dev/null || {
          echo "❌ Failed to clone PR branch"
          rm -rf "$TEMP_CLONE_DIR"
          exit 1
        }

        # Copy relevant files
        if [ -d "$TEMP_CLONE_DIR/lib" ]; then
          cp -r "$TEMP_CLONE_DIR/lib" "$GITHUB_WORK_DIR/"
        fi
        if [ -d "$TEMP_CLONE_DIR/test" ]; then
          cp -r "$TEMP_CLONE_DIR/test" "$GITHUB_WORK_DIR/"
        fi
        if [ -f "$TEMP_CLONE_DIR/metadata.json" ]; then
          cp "$TEMP_CLONE_DIR/metadata.json" "$GITHUB_WORK_DIR/"
        fi
        if [ -f "$TEMP_CLONE_DIR/package.json" ]; then
          cp "$TEMP_CLONE_DIR/package.json" "$GITHUB_WORK_DIR/"
        fi
        if [ -f "$TEMP_CLONE_DIR/tsconfig.json" ]; then
          cp "$TEMP_CLONE_DIR/tsconfig.json" "$GITHUB_WORK_DIR/"
        fi
        if [ -f "$TEMP_CLONE_DIR/Pipfile" ]; then
          cp "$TEMP_CLONE_DIR/Pipfile" "$GITHUB_WORK_DIR/"
        fi

        rm -rf "$TEMP_CLONE_DIR"
      fi

      # Verify we have essential files
      if [ ! -f "$GITHUB_WORK_DIR/metadata.json" ]; then
        echo ""
        echo "❌ metadata.json not found in PR #${PR_NUMBER}"
        echo ""
        echo "💡 The PR may not contain a valid IaC task structure."
        echo "   Expected files: metadata.json, lib/ directory"
        rm -rf "$GITHUB_WORK_DIR"
        exit 1
      fi

      echo ""
      echo "✅ PR files downloaded successfully"

      # Set task path to the GitHub work directory
      TASK_PATH="$GITHUB_WORK_DIR"
      FETCHED_FROM_GITHUB=true

      # Log the source
      echo ""
      echo "📋 Task Source: GitHub PR #${PR_NUMBER}"
      echo "   Repository: ${GITHUB_REPO}"
      echo "   Branch: ${PR_BRANCH}"
      echo ""
    else
      TASK_PATH="$FOUND_PATH"
    fi
  fi

  if [ ! -d "$TASK_PATH" ]; then
    echo "❌ Directory not found: $TASK_PATH"
    exit 1
  fi

  if [ "$FETCHED_FROM_GITHUB" = true ]; then
    echo "📁 Using task fetched from GitHub: $TASK_PATH"
  else
    echo "📁 Using specified task: $TASK_PATH"
  fi

else
  # Auto-select task
  echo "🔍 Selecting task to migrate..."

  # Get already migrated/attempted tasks
  ATTEMPTED=$(jq -r '.migrations[].task_path' "$MIGRATION_LOG" 2>/dev/null | sort -u)

  # Build search path
  SEARCH_DIR="archive"
  if [ -n "$PLATFORM_FILTER" ]; then
    SEARCH_DIR="archive/$PLATFORM_FILTER"
    echo "   Platform filter: $PLATFORM_FILTER"
  fi

  # Define service compatibility for smart selection
  HIGH_COMPAT_SERVICES="s3 dynamodb sqs sns iam kms cloudwatch logs secretsmanager ssm"
  MED_COMPAT_SERVICES="lambda apigateway stepfunctions events"
  LOW_COMPAT_SERVICES="ecs rds ec2 eks fargate alb appsync"

  # Find candidate tasks
  TASK_PATH=""
  BEST_SCORE=0

  for dir in $(find "$SEARCH_DIR" -maxdepth 3 -type d -name "Pr*" 2>/dev/null | sort); do
    if [ ! -f "$dir/metadata.json" ]; then
      continue
    fi

    # Skip already attempted
    if echo "$ATTEMPTED" | grep -q "^$dir$"; then
      continue
    fi

    # Service filter
    if [ -n "$SERVICE_FILTER" ]; then
      if ! jq -e --arg svc "$SERVICE_FILTER" '.aws_services | map(ascii_downcase) | any(. | contains($svc | ascii_downcase))' "$dir/metadata.json" >/dev/null 2>&1; then
        continue
      fi
    fi

    # Smart selection scoring
    if [ "$SMART_SELECT" = true ]; then
      SCORE=100
      SERVICES=$(jq -r '.aws_services[]?' "$dir/metadata.json" 2>/dev/null | tr '[:upper:]' '[:lower:]')

      for svc in $SERVICES; do
        svc_lower=$(echo "$svc" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
        if echo "$LOW_COMPAT_SERVICES" | grep -qi "$svc_lower"; then
          SCORE=$((SCORE - 25))
        elif echo "$MED_COMPAT_SERVICES" | grep -qi "$svc_lower"; then
          SCORE=$((SCORE - 10))
        fi
      done

      # Prefer simpler platforms
      PLATFORM=$(jq -r '.platform' "$dir/metadata.json")
      case "$PLATFORM" in
        cfn) SCORE=$((SCORE + 10)) ;;
        cdk) SCORE=$((SCORE + 5)) ;;
      esac

      if [ "$SCORE" -gt "$BEST_SCORE" ]; then
        BEST_SCORE=$SCORE
        TASK_PATH="$dir"
      fi
    else
      # Simple sequential selection
      TASK_PATH="$dir"
      break
    fi
  done

  if [ -z "$TASK_PATH" ]; then
    echo "✅ All tasks in $SEARCH_DIR have been processed!"
    echo ""
    echo "💡 Options:"
    echo "   - Try a different platform: /localstack-migrate --platform <platform>"
    echo "   - View stats: /localstack-migrate --stats"
    exit 0
  fi

  if [ "$SMART_SELECT" = true ]; then
    echo "   Smart selection score: $BEST_SCORE"
  fi
fi

echo ""
```

### Step 5: Read Task Metadata

```bash
if [ ! -f "$TASK_PATH/metadata.json" ]; then
  echo "❌ No metadata.json found in $TASK_PATH"
  exit 1
fi

METADATA=$(cat "$TASK_PATH/metadata.json")
PLATFORM=$(echo "$METADATA" | jq -r '.platform // "unknown"')
LANGUAGE=$(echo "$METADATA" | jq -r '.language // "unknown"')
COMPLEXITY=$(echo "$METADATA" | jq -r '.complexity // "unknown"')
PR_ID=$(basename "$TASK_PATH")
AWS_SERVICES=$(echo "$METADATA" | jq -r '.aws_services // [] | join(", ")')

echo "═══════════════════════════════════════════════════"
echo "📋 TASK DETAILS"
echo "═══════════════════════════════════════════════════"
echo ""
echo "   Path:       $TASK_PATH"
echo "   Platform:   $PLATFORM"
echo "   Language:   $LANGUAGE"
echo "   Complexity: $COMPLEXITY"
echo "   PR ID:      $PR_ID"
echo "   Services:   $AWS_SERVICES"
echo ""

# Check if platform is supported
SUPPORTED_PLATFORMS="cdk cfn tf pulumi"
if ! echo "$SUPPORTED_PLATFORMS" | grep -qw "$PLATFORM"; then
  echo "⚠️  Platform '$PLATFORM' may not be fully supported for LocalStack"
  echo "   Supported: $SUPPORTED_PLATFORMS"
  echo ""
fi
```

### Step 6: Setup Working Directory

```bash
echo "═══════════════════════════════════════════════════"
echo "📁 SETTING UP WORKING DIRECTORY"
echo "═══════════════════════════════════════════════════"
echo ""

WORK_DIR="worktree/localstack-${PR_ID}"

# Clean existing work directory
if [ -d "$WORK_DIR" ]; then
  echo "🧹 Cleaning existing work directory..."
  rm -rf "$WORK_DIR"
fi

mkdir -p "$WORK_DIR"
echo "📁 Created: $WORK_DIR"

# Copy task files
cp -r "${TASK_PATH}"/* "$WORK_DIR/"
echo "📋 Copied task files"

# Copy project-level files needed for deployment
for file in package.json tsconfig.json jest.config.js babel.config.js; do
  if [ -f "$file" ] && [ ! -f "$WORK_DIR/$file" ]; then
    cp "$file" "$WORK_DIR/" 2>/dev/null || true
  fi
done

# Copy scripts directory (needed for deployment)
mkdir -p "$WORK_DIR/scripts"
cp scripts/localstack-*.sh "$WORK_DIR/scripts/" 2>/dev/null || true

echo "✅ Working directory ready"
echo ""
```

### Step 7: Reset LocalStack State (Skipped in Parallel Mode)

```bash
if [ "$SKIP_RESET" = true ]; then
  echo "⏭️  Skipping LocalStack state reset (parallel mode / --no-reset flag)"
  echo "   ℹ️  Using unique stack name: tap-stack-${PR_ID}"
  echo ""
else
  echo "🧹 Resetting LocalStack state..."
  curl -X POST http://localhost:4566/_localstack/state/reset 2>/dev/null && echo "✅ LocalStack state reset" || echo "⚠️  State reset not available (continuing anyway)"
  echo ""
fi

# For parallel execution, use unique stack names based on PR_ID
# This ensures different migrations don't conflict with each other
STACK_NAME="tap-stack-${PR_ID}"
export STACK_NAME
echo "📋 Using stack name: $STACK_NAME"
echo ""
```

### Step 8: Invoke LocalStack Deploy Tester Agent

Now invoke the `localstack-deploy-tester` agent to test if the task deploys:

**Agent Context**:

````markdown
You are testing if task at `${WORK_DIR}` is deployable to LocalStack.

**Task Details**:

- Original Path: ${TASK_PATH}
- Work Directory: ${WORK_DIR}
- Platform: ${PLATFORM}
- Language: ${LANGUAGE}
- PR ID: ${PR_ID}
- AWS Services: ${AWS_SERVICES}

**Your Mission**:

1. Change to the working directory: `cd ${WORK_DIR}`
2. Set up LocalStack environment variables
3. Install dependencies based on platform/language
4. Attempt LocalStack deployment using the appropriate method
5. Capture deployment output in `execution-output.md`
6. If deployment succeeds, attempt to run integration tests
7. Report detailed results

**Environment Setup**:

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1
```
````

**Deployment Commands by Platform** (use unique stack name `${STACK_NAME}` for parallel safety):

- CDK: Bootstrap with `cdklocal bootstrap`, then `cdklocal deploy --all --require-approval never` (stack names auto-prefixed)
- CloudFormation: `awslocal cloudformation create-stack --stack-name ${STACK_NAME} --template-body file://lib/TapStack.yml --capabilities CAPABILITY_IAM`
- Terraform: `tflocal init && tflocal apply -auto-approve` (use workspace or prefix resources with PR_ID)
- Pulumi: Configure local backend, then `pulumi up --yes --stack ${STACK_NAME}`

**Important for Parallel Execution**: The `STACK_NAME` environment variable is set to `tap-stack-${PR_ID}` to ensure each migration uses a unique stack name and doesn't conflict with other parallel migrations.

**Output Required**:
Create `execution-output.md` with:

- Deployment commands run
- Full output/errors
- Success/failure status

Set shell variables for next step:

- DEPLOY_SUCCESS=true/false
- DEPLOY_ERRORS="error message if failed"
- TEST_SUCCESS=true/false (if deployment succeeded)
- TEST_ERRORS="test error if failed"

Exit with code 0 if deployment successful, 1 if failed.

````

### Step 9: Handle Deployment Result and Invoke Fixer if Needed

Based on the deploy tester results:

```bash
if [ "$DEPLOY_SUCCESS" = "true" ] && [ "$TEST_SUCCESS" = "true" ]; then
  echo ""
  echo "═══════════════════════════════════════════════════"
  echo "✅ DEPLOYMENT AND TESTS SUCCESSFUL!"
  echo "═══════════════════════════════════════════════════"

  FIX_SUCCESS="true"

elif [ "$DEPLOY_SUCCESS" = "true" ] && [ "$TEST_SUCCESS" != "true" ]; then
  echo ""
  echo "⚠️  Deployment succeeded but tests failed"
  echo "Invoking localstack-fixer agent to fix tests..."
  echo ""

  # Invoke fixer agent for test fixes
  # (Agent will be invoked here)

else
  echo ""
  echo "❌ Deployment failed"
  echo "Errors: $DEPLOY_ERRORS"
  echo ""
  echo "Invoking localstack-fixer agent..."
  echo ""

  # Invoke fixer agent
  # (Agent will be invoked here)
fi
````

If deployment or tests failed, invoke `localstack-fixer` agent:

**Agent Context**:

```markdown
You are fixing task at `${WORK_DIR}` to make it LocalStack-compatible.

**Task Details**:

- Work Directory: ${WORK_DIR}
- Platform: ${PLATFORM}
- Language: ${LANGUAGE}
- PR ID: ${PR_ID}

**Current Errors**:
Deployment Errors: ${DEPLOY_ERRORS:-"None"}
Test Errors: ${TEST_ERRORS:-"None"}

**Your Mission** (BATCH FIX APPROACH - apply ALL fixes before re-deploying):

1. Analyze ALL errors in `${WORK_DIR}/execution-output.md`
2. Identify ALL applicable fixes (including preventive fixes)
3. Apply ALL fixes in ONE batch before re-deploying
4. Re-attempt deployment only after ALL fixes are applied
5. Maximum 3 iterations (reduced due to batch approach)
6. Document all changes in `execution-output.md`

**Batch Fix Strategy** (CRITICAL - do NOT fix one at a time):

Before EACH re-deployment, apply ALL of these if applicable:

1. LocalStack endpoint configuration (almost always needed)
2. S3 path-style access (if using S3/buckets)
3. RemovalPolicy.DESTROY (always for LocalStack)
4. IAM policy simplification (if IAM errors)
5. Resource naming simplification (if naming errors)
6. Test endpoint configuration (if test/ exists)
7. Unsupported service conditionals (if service errors)
8. Default parameter values (if parameter errors)

**Constraints**:

- Maximum 3 fix iterations (batch mode)
- Apply ALL known fixes per iteration, NOT one at a time
- Do NOT change core business logic
- Keep changes minimal and focused
- Document every change made

**Output**:
Set variables:

- FIX_SUCCESS=true/false
- FIX_FAILURE_REASON="reason if failed"
- ITERATIONS_USED=N (max 3 with batch approach)
- FIXES_APPLIED="list of all fixes applied"

Exit code 0 if fixed, 1 if unable to fix, 2 if unsupported services.

**Performance Note**: With batch fix approach, expect 1-2 iterations instead of 5. Each iteration applies ALL applicable fixes before re-deploying.
```

### Step 10: Create Pull Request for Migrated Task (Parallel-Safe with Git Worktrees)

```bash
echo ""
echo "═══════════════════════════════════════════════════"
echo "📦 CREATING PULL REQUEST (Parallel-Safe)"
echo "═══════════════════════════════════════════════════"
echo ""

MIGRATION_STATUS="failed"
MIGRATION_REASON=""
NEW_PR_URL=""
NEW_PR_NUMBER=""
GIT_WORKTREE_DIR=""

if [ "$FIX_SUCCESS" = "true" ]; then

  # Check if gh CLI is available
  if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed!"
    echo ""
    echo "💡 Install GitHub CLI:"
    echo "   macOS: brew install gh"
    echo "   Linux: sudo apt install gh"
    echo ""
    MIGRATION_REASON="GitHub CLI not installed"
  else
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
      echo "❌ GitHub CLI is not authenticated!"
      echo ""
      echo "💡 Authenticate with:"
      echo "   gh auth login"
      MIGRATION_REASON="GitHub CLI not authenticated"
    else
      echo "✅ GitHub CLI authenticated"

      # Generate new PR ID with ls- prefix
      ORIGINAL_PR_ID="$PR_ID"
      LS_PR_ID="ls-${PR_ID}"

      # Generate branch name: ls-synth-{original_pr_id}
      NEW_BRANCH="ls-synth-${PR_ID}"

      echo ""
      echo "📋 Original PR ID: $ORIGINAL_PR_ID"
      echo "📋 New PR ID: $LS_PR_ID"
      echo "🌿 Creating new branch: $NEW_BRANCH"

      # Navigate to project root
      cd "$PROJECT_ROOT"

      # ═══════════════════════════════════════════════════════════════
      # PARALLEL-SAFE: Use git worktree for isolated branch operations
      # This allows multiple agents to work simultaneously without conflicts
      # ═══════════════════════════════════════════════════════════════

      GIT_WORKTREE_DIR="worktree/git-${PR_ID}"

      echo ""
      echo "🔀 Using git worktree for parallel-safe operations..."
      echo "   Worktree directory: $GIT_WORKTREE_DIR"

      # Clean up any existing worktree for this PR
      if [ -d "$GIT_WORKTREE_DIR" ]; then
        echo "   🧹 Cleaning existing worktree..."
        git worktree remove "$GIT_WORKTREE_DIR" --force 2>/dev/null || rm -rf "$GIT_WORKTREE_DIR"
      fi

      # Delete the branch if it exists locally (from previous runs)
      if git show-ref --verify --quiet "refs/heads/$NEW_BRANCH"; then
        echo "   ⚠️  Branch $NEW_BRANCH exists locally, deleting..."
        git branch -D "$NEW_BRANCH" 2>/dev/null || true
      fi

      # Fetch latest main without switching branches
      echo "   📥 Fetching latest main..."
      git fetch origin main:main 2>/dev/null || git fetch origin main 2>/dev/null || true

      # Create a new worktree with the new branch based on origin/main
      echo "   📁 Creating isolated worktree with new branch..."
      git worktree add -b "$NEW_BRANCH" "$GIT_WORKTREE_DIR" origin/main 2>/dev/null

      if [ $? -ne 0 ]; then
        # Try alternative: create worktree from main
        git worktree add -b "$NEW_BRANCH" "$GIT_WORKTREE_DIR" main 2>/dev/null
      fi

      if [ ! -d "$GIT_WORKTREE_DIR" ]; then
        echo "❌ Failed to create git worktree"
        MIGRATION_REASON="Failed to create git worktree"
      else
        echo "   ✅ Worktree created: $GIT_WORKTREE_DIR"

        # Update metadata.json in work directory with new PR ID
        if [ -f "$WORK_DIR/metadata.json" ]; then
          echo "📝 Updating metadata.json with new PR ID: $LS_PR_ID"
          jq --arg new_id "$LS_PR_ID" --arg orig_id "$ORIGINAL_PR_ID" \
            '. + {"pr_id": $new_id, "original_pr_id": $orig_id, "localstack_migration": true, "provider": "localstack"}' \
            "$WORK_DIR/metadata.json" > "$WORK_DIR/metadata.json.tmp"
          mv "$WORK_DIR/metadata.json.tmp" "$WORK_DIR/metadata.json"
        fi

        # Copy work directory contents to the isolated worktree (not project root!)
        echo ""
        echo "📁 Preparing PR files in isolated worktree..."

        # Copy lib/ directory
        if [ -d "$WORK_DIR/lib" ]; then
          rm -rf "$GIT_WORKTREE_DIR/lib/"
          cp -r "$WORK_DIR/lib" "$GIT_WORKTREE_DIR/"
          echo "   ✅ Copied lib/"
        fi

        # Copy test/ directory
        if [ -d "$WORK_DIR/test" ]; then
          rm -rf "$GIT_WORKTREE_DIR/test/"
          cp -r "$WORK_DIR/test" "$GIT_WORKTREE_DIR/"
          echo "   ✅ Copied test/"
        fi

        # Copy metadata.json
        if [ -f "$WORK_DIR/metadata.json" ]; then
          cp "$WORK_DIR/metadata.json" "$GIT_WORKTREE_DIR/"
          echo "   ✅ Copied metadata.json"
        fi

        # Copy any other essential files
        for file in Pipfile Pipfile.lock requirements.txt cdk.json cdktf.json Pulumi.yaml main.tf; do
          if [ -f "$WORK_DIR/$file" ]; then
            cp "$WORK_DIR/$file" "$GIT_WORKTREE_DIR/"
            echo "   ✅ Copied $file"
          fi
        done

        echo ""
        echo "✅ PR files prepared in worktree"

        # Change to worktree directory for git operations
        cd "$GIT_WORKTREE_DIR"

        # Stage all changes
        echo ""
        echo "📝 Staging changes in worktree..."
        git add lib/ test/ metadata.json 2>/dev/null || true
        git add Pipfile Pipfile.lock requirements.txt cdk.json cdktf.json Pulumi.yaml main.tf 2>/dev/null || true
        git add -A  # Stage any other changes

        # Create commit
        COMMIT_MSG="feat(localstack): ${LS_PR_ID} - LocalStack compatible task

PR ID: ${LS_PR_ID}
Original PR ID: ${ORIGINAL_PR_ID}
Platform: ${PLATFORM}
Language: ${LANGUAGE}
AWS Services: ${AWS_SERVICES}

This task has been migrated and tested for LocalStack compatibility.
The PR pipeline will handle deployment and validation."

        echo "📝 Creating commit..."
        git commit -m "$COMMIT_MSG"

        if [ $? -ne 0 ]; then
          echo "❌ Failed to create commit"
          MIGRATION_REASON="Failed to create git commit"
        else
          echo "✅ Commit created"

          # Push branch to origin (force push in case branch exists remotely)
          echo ""
          echo "🚀 Pushing branch to origin..."
          git push -u origin "$NEW_BRANCH" --force

          if [ $? -ne 0 ]; then
            echo "❌ Failed to push branch"
            MIGRATION_REASON="Failed to push branch to origin"
          else
            echo "✅ Branch pushed to origin"

            # Create Pull Request
            echo ""
            echo "📋 Creating Pull Request..."

            PR_TITLE="[LocalStack] ${LS_PR_ID} - ${PLATFORM}/${LANGUAGE}"
            PR_BODY="## LocalStack Migration

### Task Details
- **New PR ID:** ${LS_PR_ID}
- **Original PR ID:** ${ORIGINAL_PR_ID}
- **Platform:** ${PLATFORM}
- **Language:** ${LANGUAGE}
- **AWS Services:** ${AWS_SERVICES}
- **Complexity:** ${COMPLEXITY}

### Migration Summary
This PR contains a LocalStack-compatible version of task ${ORIGINAL_PR_ID}, migrated as ${LS_PR_ID}.

The task has been:
- ✅ Tested for LocalStack deployment
- ✅ Verified with integration tests
- ✅ Updated with LocalStack-specific configurations

### Source
- Original Task: \`${TASK_PATH}\`

### Pipeline
This PR will be processed by the CI/CD pipeline which will:
1. Run linting and validation
2. Deploy to LocalStack
3. Run integration tests
4. Report results

### LocalStack Compatibility
- LocalStack Version: ${LOCALSTACK_VERSION}
- Iterations to fix: ${ITERATIONS_USED:-1}

---
*This PR was automatically created by the \`/localstack-migrate\` command.*
*The PR pipeline will handle deployment and testing.*"

            # Create the PR
            PR_RESULT=$(gh pr create \
              --repo "$GITHUB_REPO" \
              --title "$PR_TITLE" \
              --body "$PR_BODY" \
              --base main \
              --head "$NEW_BRANCH" \
              2>&1)

            if [ $? -eq 0 ]; then
              NEW_PR_URL="$PR_RESULT"
              NEW_PR_NUMBER=$(echo "$NEW_PR_URL" | grep -oE '[0-9]+$')
              MIGRATION_STATUS="success"

              echo ""
              echo "✅ Pull Request created successfully!"
              echo "   URL: $NEW_PR_URL"
              echo "   PR #: $NEW_PR_NUMBER"
            else
              echo "❌ Failed to create Pull Request"
              echo "   Error: $PR_RESULT"
              MIGRATION_REASON="Failed to create PR: $PR_RESULT"
            fi
          fi
        fi

        # Return to project root
        cd "$PROJECT_ROOT"

        # Clean up the git worktree
        echo ""
        echo "🧹 Cleaning up git worktree..."
        git worktree remove "$GIT_WORKTREE_DIR" --force 2>/dev/null || rm -rf "$GIT_WORKTREE_DIR"
        echo "✅ Worktree cleaned up"
      fi
    fi
  fi
else
  MIGRATION_REASON="${FIX_FAILURE_REASON:-Unknown error}"
  echo "❌ Migration failed: $MIGRATION_REASON"
fi

# ═══════════════════════════════════════════════════════════════
# PARALLEL-SAFE: Update migration log with file locking
# Uses flock to prevent race conditions when multiple agents run
# ═══════════════════════════════════════════════════════════════

echo ""
echo "📋 Updating migration log (with file locking for parallel safety)..."

MIGRATION_ENTRY=$(cat <<EOF
{
  "task_path": "$TASK_PATH",
  "new_pr_url": $([ -n "$NEW_PR_URL" ] && echo "\"$NEW_PR_URL\"" || echo "null"),
  "new_pr_number": $([ -n "$NEW_PR_NUMBER" ] && echo "\"$NEW_PR_NUMBER\"" || echo "null"),
  "branch": "${NEW_BRANCH:-null}",
  "platform": "$PLATFORM",
  "language": "$LANGUAGE",
  "ls_pr_id": "${LS_PR_ID:-null}",
  "original_pr_id": "${ORIGINAL_PR_ID:-$PR_ID}",
  "aws_services": $(echo "$METADATA" | jq '.aws_services // []'),
  "status": "$MIGRATION_STATUS",
  "reason": $([ -n "$MIGRATION_REASON" ] && echo "\"$MIGRATION_REASON\"" || echo "null"),
  "iterations_used": ${ITERATIONS_USED:-0},
  "attempted_at": "$(date -Iseconds)"
}
EOF
)

# Create lock file directory
LOCK_FILE="${PROJECT_ROOT}/.claude/reports/.migration-log.lock"
mkdir -p "$(dirname "$LOCK_FILE")"

# Use flock for atomic update (with timeout to prevent deadlock)
# If flock is not available (e.g., macOS), use a simple retry mechanism
if command -v flock &> /dev/null; then
  # Linux: use flock
  (
    flock -w 30 200 || { echo "⚠️  Could not acquire lock, updating anyway..."; }

    jq --argjson entry "$MIGRATION_ENTRY" --arg status "$MIGRATION_STATUS" '
      .migrations += [$entry] |
      .summary.total_attempted += 1 |
      if $status == "success" then .summary.successful += 1 else .summary.failed += 1 end
    ' "$MIGRATION_LOG" > "${MIGRATION_LOG}.tmp.$$"
    mv "${MIGRATION_LOG}.tmp.$$" "$MIGRATION_LOG"

  ) 200>"$LOCK_FILE"
else
  # macOS: use a simple lock file mechanism with retries
  MAX_RETRIES=10
  RETRY_COUNT=0
  LOCK_ACQUIRED=false

  while [ "$RETRY_COUNT" -lt "$MAX_RETRIES" ]; do
    # Try to create lock file atomically
    if (set -o noclobber; echo "$$" > "$LOCK_FILE") 2>/dev/null; then
      LOCK_ACQUIRED=true
      trap 'rm -f "$LOCK_FILE"' EXIT
      break
    fi

    # Check if lock is stale (older than 60 seconds)
    if [ -f "$LOCK_FILE" ]; then
      LOCK_AGE=$(($(date +%s) - $(stat -f %m "$LOCK_FILE" 2>/dev/null || echo 0)))
      if [ "$LOCK_AGE" -gt 60 ]; then
        echo "   ⚠️  Stale lock detected, removing..."
        rm -f "$LOCK_FILE"
        continue
      fi
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   ⏳ Waiting for migration log lock (attempt $RETRY_COUNT/$MAX_RETRIES)..."
    sleep 1
  done

  if [ "$LOCK_ACQUIRED" = true ]; then
    jq --argjson entry "$MIGRATION_ENTRY" --arg status "$MIGRATION_STATUS" '
      .migrations += [$entry] |
      .summary.total_attempted += 1 |
      if $status == "success" then .summary.successful += 1 else .summary.failed += 1 end
    ' "$MIGRATION_LOG" > "${MIGRATION_LOG}.tmp.$$"
    mv "${MIGRATION_LOG}.tmp.$$" "$MIGRATION_LOG"
    rm -f "$LOCK_FILE"
  else
    echo "   ⚠️  Could not acquire lock after $MAX_RETRIES attempts, updating anyway..."
    jq --argjson entry "$MIGRATION_ENTRY" --arg status "$MIGRATION_STATUS" '
      .migrations += [$entry] |
      .summary.total_attempted += 1 |
      if $status == "success" then .summary.successful += 1 else .summary.failed += 1 end
    ' "$MIGRATION_LOG" > "${MIGRATION_LOG}.tmp.$$"
    mv "${MIGRATION_LOG}.tmp.$$" "$MIGRATION_LOG"
  fi
fi

echo "✅ Migration log updated"
```

### Step 11: Cleanup and Summary

```bash
echo ""
echo "🧹 Cleaning up..."

# Clean up work directory
if [ -d "$WORK_DIR" ]; then
  rm -rf "$WORK_DIR"
  echo "   ✅ Work directory cleaned: $WORK_DIR"
fi

# Clean up git worktree if it still exists (parallel-safe cleanup)
if [ -n "$GIT_WORKTREE_DIR" ] && [ -d "$GIT_WORKTREE_DIR" ]; then
  cd "$PROJECT_ROOT"
  git worktree remove "$GIT_WORKTREE_DIR" --force 2>/dev/null || rm -rf "$GIT_WORKTREE_DIR"
  echo "   ✅ Git worktree cleaned: $GIT_WORKTREE_DIR"
fi

# Prune any orphaned worktrees
git worktree prune 2>/dev/null || true

echo "✅ Cleanup complete"

echo ""
echo "═══════════════════════════════════════════════════"
if [ "$MIGRATION_STATUS" = "success" ]; then
  echo "✅ MIGRATION SUCCESSFUL - PR CREATED!"
  echo "═══════════════════════════════════════════════════"
  echo ""
  echo "   Original PR ID: ${ORIGINAL_PR_ID:-$PR_ID}"
  echo "   New PR ID:      ${LS_PR_ID:-N/A}"
  echo "   Source:         $TASK_PATH"
  echo "   Platform:       $PLATFORM"
  echo "   Language:       $LANGUAGE"
  echo ""
  echo "🔗 Pull Request:"
  echo "   URL:    $NEW_PR_URL"
  echo "   Number: #$NEW_PR_NUMBER"
  echo "   Branch: $NEW_BRANCH"
  echo ""
  echo "📋 Next Steps:"
  echo "   1. The PR pipeline will automatically deploy and test"
  echo "   2. Review the PR: $NEW_PR_URL"
  echo "   3. Merge when pipeline passes"
  echo ""
else
  echo "❌ MIGRATION FAILED"
  echo "═══════════════════════════════════════════════════"
  echo ""
  echo "   Task:   $TASK_PATH"
  echo "   Reason: $MIGRATION_REASON"
  echo ""
  echo "💡 Next steps:"
  echo "   - Review errors in migration log"
  echo "   - Try manual migration"
  echo "   - Check if services are supported in LocalStack Community"
  echo ""
fi

echo "📋 Migration log: $MIGRATION_LOG"
echo ""

# Exit with appropriate code
if [ "$MIGRATION_STATUS" = "success" ]; then
  exit 0
else
  exit 1
fi
```

## Supported Platforms

| Platform | Language         | Deploy Method                    |
| -------- | ---------------- | -------------------------------- |
| cdk      | ts, py, go, java | cdklocal                         |
| cfn      | yaml, json       | awslocal cloudformation          |
| tf       | hcl              | tflocal                          |
| pulumi   | ts, py, go       | pulumi with LocalStack endpoints |

## Migration Log Schema

```json
{
  "created_at": "2025-12-17T...",
  "migrations": [
    {
      "task_path": "archive/cdk-ts/Pr7179",
      "new_pr_url": "https://github.com/TuringGpt/iac-test-automations/pull/1234",
      "new_pr_number": "1234",
      "branch": "ls-synth-Pr7179",
      "platform": "cdk",
      "language": "ts",
      "ls_pr_id": "ls-Pr7179",
      "original_pr_id": "Pr7179",
      "aws_services": ["S3", "Lambda"],
      "status": "success",
      "reason": null,
      "iterations_used": 2,
      "attempted_at": "2025-12-17T..."
    }
  ],
  "summary": {
    "total_attempted": 10,
    "successful": 8,
    "failed": 2
  }
}
```

## Parallel Execution

This command supports running multiple instances in parallel for different PRs. This is useful when you want to migrate multiple tasks simultaneously using multiple Claude agents.

### How to Run in Parallel

```bash
# Terminal/Agent 1
/localstack-migrate --no-reset Pr7179

# Terminal/Agent 2
/localstack-migrate --no-reset Pr7180

# Terminal/Agent 3
/localstack-migrate --no-reset Pr7181

# Terminal/Agent 4
/localstack-migrate --no-reset Pr7182

# Terminal/Agent 5
/localstack-migrate --no-reset Pr7183
```

### Key Features for Parallel Execution

| Feature             | How It's Handled                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| LocalStack State    | `--no-reset` flag skips state reset; unique stack names (`tap-stack-{PR_ID}`) prevent conflicts |
| Git Operations      | Uses **git worktrees** (`worktree/git-{PR_ID}`) for isolated branch operations                  |
| Working Directories | Each migration uses its own directory (`worktree/localstack-{PR_ID}`)                           |
| Migration Log       | **File locking** prevents race conditions when updating the shared log                          |
| GitHub PRs          | Each agent creates its own PR with unique branch name (`ls-synth-{PR_ID}`)                      |

### Important Notes

1. **Always use `--no-reset`**: When running multiple agents, use the `--no-reset` flag to prevent one agent from clearing another's deployed resources.

2. **Unique Stack Names**: Each migration automatically uses a unique CloudFormation/CDK stack name based on the PR ID to prevent resource conflicts.

3. **Git Worktrees**: The command uses git worktrees instead of switching branches in the main repository. This allows multiple agents to work on different branches simultaneously without conflicts.

4. **File Locking**: The migration log (`.claude/reports/localstack-migrations.json`) is updated using file locking to prevent corruption when multiple agents finish at the same time.

5. **Resource Cleanup**: Each agent cleans up its own worktree and work directory after completion.

### Pre-Parallel Execution Setup

Before running multiple agents in parallel, optionally reset LocalStack once:

```bash
# Reset LocalStack state once before starting parallel migrations
curl -X POST http://localhost:4566/_localstack/state/reset

# Then start your parallel agents with --no-reset
```

### Troubleshooting Parallel Execution

**Issue: Stack name conflicts**

- Solution: Each migration uses `tap-stack-{PR_ID}` automatically. If you see conflicts, ensure different PRs are being migrated.

**Issue: Git worktree errors**

- Solution: Clean up stale worktrees: `git worktree prune`

**Issue: Migration log corruption**

- Solution: The file locking mechanism should prevent this. If it occurs, manually merge entries.

## Related Agents

- `localstack-task-selector` - Intelligent task selection
- `localstack-deploy-tester` - Tests deployment to LocalStack
- `localstack-fixer` - Fixes compatibility issues
