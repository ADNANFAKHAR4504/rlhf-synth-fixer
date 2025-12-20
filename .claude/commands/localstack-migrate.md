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

| Setting                                | Default                        | Description                    |
| -------------------------------------- | ------------------------------ | ------------------------------ |
| `github.repo`                          | TuringGpt/iac-test-automations | GitHub repository              |
| `iteration.max_fix_iterations`         | 3                              | Maximum fix iterations         |
| `iteration.use_batch_fix`              | true                           | Enable batch fix approach      |
| `localstack.reset_state_before_deploy` | false                          | Reset LocalStack before deploy |
| `parallel.enabled`                     | true                           | Enable parallel execution      |
| `parallel.max_concurrent_agents`       | 10                             | Max parallel agents            |
| `smart_selection.enabled`              | true                           | Enable smart task selection    |

See `.claude/config/localstack.yaml` for full configuration options.

## Modular Scripts

This command uses modular shell scripts in `.claude/scripts/` for better maintainability:

| Script                            | Description                                                           |
| --------------------------------- | --------------------------------------------------------------------- |
| `localstack-common.sh`            | Common functions, config loading, error handling                      |
| `localstack-init.sh`              | Environment validation and initialization                             |
| `localstack-select-task.sh`       | Task selection logic                                                  |
| `localstack-fetch-github.sh`      | Fetch tasks from GitHub PRs                                           |
| `localstack-sanitize-metadata.sh` | Sanitize metadata.json for schema compliance (sets team to `synth-2`) |
| `localstack-create-pr.sh`         | Create GitHub PR with migrated code                                   |
| `localstack-update-log.sh`        | Update migration log with file locking                                |

All scripts use `set -euo pipefail` for strict error handling and trap handlers for cleanup.

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
#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# LocalStack Migration - Main Workflow
# ═══════════════════════════════════════════════════════════════════════════
# Uses modular scripts from .claude/scripts/ for maintainability
# All scripts use set -euo pipefail and trap handlers for error handling
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Source common functions (loads config, sets up error handling)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
source "$PROJECT_ROOT/.claude/scripts/localstack-common.sh"

# Setup error handling with trap
setup_error_handling

log_header "🚀 LOCALSTACK MIGRATION"

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

# Note: GITHUB_REPO is loaded from config via localstack-common.sh
# Default: TuringGpt/iac-test-automations (from .claude/config/localstack.yaml)

# Parse flags (support combining --no-reset with other options)
ARGS=("$@")
for ((i=0; i<${#ARGS[@]}; i++)); do
  case "${ARGS[i]}" in
    --no-reset)
      SKIP_RESET=true
      log_info "Parallel mode: LocalStack state reset will be skipped"
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

# Run initialization script (validates environment, checks prerequisites)
if [ "$SKIP_RESET" = true ]; then
  source "$PROJECT_ROOT/.claude/scripts/localstack-init.sh" --skip-reset
else
  source "$PROJECT_ROOT/.claude/scripts/localstack-init.sh"
fi
```

### Step 2: Initialize Migration Log

> **Note**: Migration log initialization is handled by `localstack-init.sh` sourced in Step 1.
> The log path is loaded from config: `migration_log.path` (default: `.claude/reports/localstack-migrations.json`)

```bash
# Migration log is already initialized by localstack-init.sh
# MIGRATION_LOG variable is exported from localstack-common.sh
log_info "Migration log: $MIGRATION_LOG"
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

> **Note**: GitHub fetch uses `localstack-fetch-github.sh` which handles:
>
> - GitHub CLI authentication checks
> - PR file downloading via API or branch clone
> - Task structure validation
> - Error handling with cleanup

```bash
FETCHED_FROM_GITHUB=false

if [ -n "$TASK_PATH" ]; then
  # Manual path provided
  if [[ "$TASK_PATH" =~ ^Pr[0-9]+$ ]] || [[ "$TASK_PATH" =~ ^[0-9]+$ ]]; then
    # Normalize PR number format
    PR_NUMBER=$(normalize_pr_number "$TASK_PATH")
    PR_ID=$(get_pr_id "$PR_NUMBER")

    # Find task by PR number in archive
    FOUND_PATH=$(find archive -maxdepth 3 -type d -name "$PR_ID" 2>/dev/null | head -1)

    if [ -z "$FOUND_PATH" ] || [ "$FORCE_GITHUB" = true ]; then
      # Use modular GitHub fetch script
      GITHUB_WORK_DIR=$("$PROJECT_ROOT/.claude/scripts/localstack-fetch-github.sh" "$PR_NUMBER" 2>&1 | tail -1)

      if [ -d "$GITHUB_WORK_DIR" ] && [ -f "$GITHUB_WORK_DIR/metadata.json" ]; then
        TASK_PATH="$GITHUB_WORK_DIR"
        FETCHED_FROM_GITHUB=true
        log_success "Task fetched from GitHub: $TASK_PATH"
      else
        log_error "Failed to fetch task from GitHub PR #$PR_NUMBER"
        exit 1
      fi
    else
      TASK_PATH="$FOUND_PATH"
    fi
  fi

  if [ ! -d "$TASK_PATH" ]; then
    log_error "Directory not found: $TASK_PATH"
    exit 1
  fi

  if [ "$FETCHED_FROM_GITHUB" = true ]; then
    log_info "Using task fetched from GitHub: $TASK_PATH"
  else
    log_info "Using specified task: $TASK_PATH"
  fi

else
  # Auto-select task using the selection script
  log_info "Selecting task to migrate..."

  if [ "$SMART_SELECT" = true ]; then
    TASK_PATH=$("$PROJECT_ROOT/.claude/scripts/localstack-select-task.sh" smart 2>&1 | head -1)
  elif [ -n "$PLATFORM_FILTER" ]; then
    TASK_PATH=$("$PROJECT_ROOT/.claude/scripts/localstack-select-task.sh" platform "$PLATFORM_FILTER" 2>&1 | head -1)
  elif [ -n "$SERVICE_FILTER" ]; then
    TASK_PATH=$("$PROJECT_ROOT/.claude/scripts/localstack-select-task.sh" service "$SERVICE_FILTER" 2>&1 | head -1)
  else
    TASK_PATH=$("$PROJECT_ROOT/.claude/scripts/localstack-select-task.sh" next 2>&1 | head -1)
  fi

  if [ -z "$TASK_PATH" ]; then
    log_success "All tasks have been processed!"
    echo ""
    echo "💡 Options:"
    echo "   - Try a different platform: /localstack-migrate --platform <platform>"
    echo "   - View stats: /localstack-migrate --stats"
    exit 0
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

> **Note**: This step uses the shared worktree setup pattern for consistency and parallel execution safety.

```bash
echo "═══════════════════════════════════════════════════"
echo "📁 SETTING UP WORKING DIRECTORY"
echo "═══════════════════════════════════════════════════"
echo ""

WORK_DIR="$PROJECT_ROOT/worktree/localstack-${PR_ID}"

# ═══════════════════════════════════════════════════════════════
# WORKTREE SETUP - Use shared patterns for consistency
# For localstack-migrate, we use a work directory (not git worktree)
# because we're copying files from archive, not checking out a branch
# ═══════════════════════════════════════════════════════════════

# Clean existing work directory
if [ -d "$WORK_DIR" ]; then
  echo "🧹 Cleaning existing work directory..."

  # If it's a git worktree, remove it properly
  if git worktree list 2>/dev/null | grep -q "$WORK_DIR"; then
    cd "$PROJECT_ROOT"
    git worktree remove "$WORK_DIR" --force 2>/dev/null || true
  fi

  rm -rf "$WORK_DIR"
fi

mkdir -p "$WORK_DIR"
echo "📁 Created: $WORK_DIR"

# Copy task files
cp -r "${TASK_PATH}"/* "$WORK_DIR/"
echo "📋 Copied task files"

# Copy project-level files needed for deployment
for file in package.json tsconfig.json jest.config.js babel.config.js; do
  if [ -f "$PROJECT_ROOT/$file" ] && [ ! -f "$WORK_DIR/$file" ]; then
    cp "$PROJECT_ROOT/$file" "$WORK_DIR/" 2>/dev/null || true
  fi
done

# Copy scripts directory (needed for deployment) - but NOT .claude/scripts
mkdir -p "$WORK_DIR/scripts"
for script in "$PROJECT_ROOT/scripts/localstack-"*.sh; do
  [ -f "$script" ] && cp "$script" "$WORK_DIR/scripts/" 2>/dev/null || true
done

# Verify the work directory structure
echo ""
echo "🔍 Verifying work directory..."
if [ -f "$WORK_DIR/metadata.json" ]; then
  echo "   ✅ metadata.json found"
else
  echo "   ❌ metadata.json missing!"
  exit 1
fi

if [ -d "$WORK_DIR/lib" ]; then
  echo "   ✅ lib/ directory found"
else
  echo "   ⚠️ lib/ directory missing (may be expected for some platforms)"
fi

echo ""
echo "✅ Working directory ready: $WORK_DIR"
echo ""
```

### Step 7: Reset LocalStack State (Skipped in Parallel Mode)

> **Note**: LocalStack state management is handled by `localstack-init.sh` sourced in Step 1.
> The `--skip-reset` / `--no-reset` flag is respected automatically.

```bash
# LocalStack reset was already handled by localstack-init.sh
# For parallel execution, use unique stack names based on PR_ID
STACK_NAME="tap-stack-${PR_ID}"
export STACK_NAME
log_info "Using stack name: $STACK_NAME"
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

> **Note**: This step uses modular scripts for better maintainability:
>
> - `localstack-sanitize-metadata.sh` - Sanitizes metadata.json for schema compliance
> - `localstack-create-pr.sh` - Creates PR with git worktrees for parallel safety
> - `localstack-update-log.sh` - Updates migration log with file locking

> **🏷️ Required Labels**: All PRs created by localstack-migrate automatically include:
>
> - `synth-2` - Identifies PRs created by the synth-2 team/process
> - `localstack` - Identifies PRs for LocalStack-compatible tasks
> - `<platform>` - Platform type from metadata.json (e.g., `cdk`, `cfn`, `tf`, `pulumi`)
> - `<language>` - Language from metadata.json (e.g., `ts`, `py`, `go`, `java`)

```bash
log_header "📦 CREATING PULL REQUEST (Parallel-Safe)"

MIGRATION_STATUS="failed"
MIGRATION_REASON=""
NEW_PR_URL=""
NEW_PR_NUMBER=""
NEW_BRANCH=""
LS_PR_ID=""
ORIGINAL_PR_ID="$PR_ID"

if [ "$FIX_SUCCESS" = "true" ]; then
  # Use modular PR creation script
  # This handles: metadata sanitization, git worktree, commit, push, PR creation

  PR_OUTPUT=$("$PROJECT_ROOT/.claude/scripts/localstack-create-pr.sh" \
    "$WORK_DIR" \
    "$PR_ID" \
    --platform "$PLATFORM" \
    --language "$LANGUAGE" \
    --services "$AWS_SERVICES" \
    --iterations "${ITERATIONS_USED:-1}" \
    --complexity "${COMPLEXITY:-medium}" \
    2>&1) || {
    MIGRATION_REASON="PR creation script failed"
    log_error "Failed to create PR"
  }

  # Parse output from create-pr script
  if echo "$PR_OUTPUT" | grep -q "NEW_PR_URL="; then
    NEW_PR_URL=$(echo "$PR_OUTPUT" | grep "NEW_PR_URL=" | cut -d= -f2)
    NEW_PR_NUMBER=$(echo "$PR_OUTPUT" | grep "NEW_PR_NUMBER=" | cut -d= -f2)
    NEW_BRANCH=$(echo "$PR_OUTPUT" | grep "NEW_BRANCH=" | cut -d= -f2)
    LS_PR_ID=$(echo "$PR_OUTPUT" | grep "LS_PR_ID=" | cut -d= -f2)
    MIGRATION_STATUS="success"

    log_success "Pull Request created!"
    echo "   URL:    $NEW_PR_URL"
    echo "   Number: #$NEW_PR_NUMBER"
    echo "   Branch: $NEW_BRANCH"
  fi
else
  MIGRATION_REASON="${FIX_FAILURE_REASON:-Unknown error}"
  log_error "Migration failed: $MIGRATION_REASON"
fi

# ═══════════════════════════════════════════════════════════════
# PARALLEL-SAFE: Update migration log with file locking
# Uses localstack-update-log.sh for atomic updates
# ═══════════════════════════════════════════════════════════════

log_info "Updating migration log (with file locking for parallel safety)..."

# Get AWS services as JSON array
AWS_SERVICES_JSON=$(jq -c '.aws_services // []' "$WORK_DIR/metadata.json" 2>/dev/null || echo "[]")

"$PROJECT_ROOT/.claude/scripts/localstack-update-log.sh" \
  --task-path "$TASK_PATH" \
  --status "$MIGRATION_STATUS" \
  --pr-url "${NEW_PR_URL:-}" \
  --pr-number "${NEW_PR_NUMBER:-}" \
  --branch "${NEW_BRANCH:-}" \
  --ls-pr-id "${LS_PR_ID:-}" \
  --original-pr-id "${ORIGINAL_PR_ID:-$PR_ID}" \
  --platform "$PLATFORM" \
  --language "$LANGUAGE" \
  --services "$AWS_SERVICES_JSON" \
  --reason "${MIGRATION_REASON:-}" \
  --iterations "${ITERATIONS_USED:-0}"

log_success "Migration log updated"
```

### Step 11: Cleanup and Summary

```bash
log_section "Cleaning up..."

# Clean up work directory
if [ -d "$WORK_DIR" ]; then
  rm -rf "$WORK_DIR"
  log_success "Work directory cleaned: $WORK_DIR"
fi

# Prune any orphaned worktrees (git worktree cleanup handled by create-pr script)
git worktree prune 2>/dev/null || true

log_success "Cleanup complete"

# ═══════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════

if [ "$MIGRATION_STATUS" = "success" ]; then
  log_header "✅ MIGRATION SUCCESSFUL - PR CREATED!"

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
else
  log_header "❌ MIGRATION FAILED"

  echo "   Task:   $TASK_PATH"
  echo "   Reason: $MIGRATION_REASON"
  echo ""
  echo "💡 Next steps:"
  echo "   - Review errors in migration log"
  echo "   - Try manual migration"
  echo "   - Check if services are supported in LocalStack Community"
fi

echo ""
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
