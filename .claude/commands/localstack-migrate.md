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
| `localstack-compatibility-check.sh` | **NEW**: Pre-migration compatibility assessment                     |
| `localstack-dashboard.sh`         | **NEW**: Real-time migration dashboard                                |
| `localstack-rollback.sh`          | **NEW**: Rollback failed migrations                                   |
| `localstack-enhance-tests.sh`     | **NEW**: Auto-enhance tests for LocalStack                            |
| `localstack-ci-simulate.sh`       | **NEW**: Run full CI/CD pipeline locally before pushing               |

All scripts use `set -euo pipefail` for strict error handling and trap handlers for cleanup.

## 🚀 LOCAL-ONLY MODE (DEFAULT!)

**Local-only is now the DEFAULT behavior** - no flag needed! Run the entire workflow locally without touching CI/CD until you're 100% confident.

### Why Use Local-Only Mode?

| CI/CD Pipeline | Local-Only Mode |
|---------------|-----------------|
| ❌ Consumes CI credits on every push | ✅ Zero CI credits until final push |
| ❌ 15-30 min wait per iteration | ✅ 2-5 min local validation |
| ❌ Multiple iterations common | ✅ Fix issues instantly |
| ❌ Hard to debug failures | ✅ Full local debugging |

### Local CI Simulation

The `localstack-ci-simulate.sh` script runs ALL CI/CD jobs locally:

```bash
# Run full CI simulation on your work directory
.claude/scripts/localstack-ci-simulate.sh ./worktree/localstack-Pr7179

# Run specific job only
.claude/scripts/localstack-ci-simulate.sh --job build ./worktree/localstack-Pr7179

# Run from a specific job onwards
.claude/scripts/localstack-ci-simulate.sh --from deploy ./worktree/localstack-Pr7179

# Auto-fix issues while running
.claude/scripts/localstack-ci-simulate.sh --fix ./worktree/localstack-Pr7179
```

### Jobs Simulated Locally

| Job | Local Simulation | Notes |
|-----|-----------------|-------|
| detect-metadata | ✅ Full | Validates metadata.json, file locations, emojis |
| claude-review-prompt-quality | ✅ Basic | Checks PROMPT.md exists and has content |
| validate-commit-message | ✅ Full | Conventional commits validation |
| validate-jest-config | ✅ Full | Jest roots configuration |
| build | ✅ Full | npm install, npm build |
| synth | ✅ Full | CDK/CDKTF synthesis |
| deploy | ✅ Full | Deploys to local LocalStack |
| lint | ✅ Full | ESLint/Ruff checks |
| unit-tests | ✅ Full | Jest/Pytest tests |
| integration-tests-live | ✅ Full | Against LocalStack |
| claude-code-action | ⏭️ Skip | Only in CI (Claude review) |
| cleanup | ✅ Full | Destroys LocalStack resources |
| claude-review-ideal-response | ✅ Basic | Validates IDEAL_RESPONSE.md |
| archive-folders | ⏭️ Skip | Only in CI |

### Usage (Local is DEFAULT)

```bash
# Migrate and validate locally (DEFAULT - no CI/CD)
/localstack-migrate Pr7179

# Migrate with auto-fix enabled
/localstack-migrate --fix Pr7179

# After local validation passes, push to CI
/localstack-migrate --push Pr7179

# Or combine: fix locally until ready, then auto-push
/localstack-migrate --fix --push-when-ready Pr7179
```

### Default Local-Only Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DEFAULT WORKFLOW (Local-Only - Saves CI Credits!)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1: /localstack-migrate Pr7179  (or --fix Pr7179)                      │
│          ├── Copy files to worktree                                         │
│          ├── Run localstack-ci-simulate.sh (ALL jobs)                       │
│          ├── Fix issues with localstack-fixer                               │
│          └── Iterate until local CI passes                                  │
│                                                                             │
│  Step 2: Review locally                                                     │
│          ├── Check execution-output.md                                      │
│          ├── Verify metadata.json                                           │
│          └── Confirm all tests pass                                         │
│                                                                             │
│  Step 3: /localstack-migrate --push Pr7179                                  │
│          ├── Create PR                                                      │
│          └── Only 1-2 CI iterations needed (vs 5-10 previously)             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Enhanced Features

### Pre-Migration Compatibility Check

Before starting a migration, assess the success probability:

```bash
# Check compatibility for a task
.claude/scripts/localstack-compatibility-check.sh ./archive/cdk-ts/Pr7179

# JSON output for automation
.claude/scripts/localstack-compatibility-check.sh --json Pr7179
```

Output includes:
- Compatibility score (0-100)
- Service categorization (high/medium/low/pro-only)
- Predicted fixes needed
- Estimated migration time
- Success probability

### Real-Time Dashboard

Monitor parallel migrations in real-time:

```bash
# Live dashboard (auto-refreshes)
.claude/scripts/localstack-dashboard.sh

# One-time status
.claude/scripts/localstack-dashboard.sh --status

# View history
.claude/scripts/localstack-dashboard.sh --history

# Full statistics
.claude/scripts/localstack-dashboard.sh --stats
```

### Rollback Capability

Rollback failed migrations to a previous state:

```bash
# Rollback to latest snapshot
.claude/scripts/localstack-rollback.sh Pr7179

# Full rollback to original state
.claude/scripts/localstack-rollback.sh Pr7179 --full

# Rollback only the last fix (git revert)
.claude/scripts/localstack-rollback.sh Pr7179 --last-fix

# Rollback to specific snapshot
.claude/scripts/localstack-rollback.sh Pr7179 --to-snapshot 2

# List available snapshots
.claude/scripts/localstack-rollback.sh Pr7179 --list
```

### Test Enhancement

Auto-enhance integration tests for LocalStack compatibility:

```bash
# Analyze test files
.claude/scripts/localstack-enhance-tests.sh ./worktree/localstack-Pr7179

# Apply automatic enhancements
.claude/scripts/localstack-enhance-tests.sh --fix ./worktree/localstack-Pr7179
```

Creates helper files with:
- LocalStack endpoint configuration
- Retry logic for flaky operations
- Proper timeouts
- Setup/cleanup hooks

### Fix Templates

Pre-built templates for common LocalStack fixes in `.claude/templates/localstack-fixes/`:

| Template                  | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `cdk-ts-endpoint.ts`      | CDK TypeScript endpoint configuration          |
| `cdk-ts-s3-bucket.ts`     | CDK TypeScript S3 bucket with LocalStack setup |
| `tf-hcl-provider.tf`      | Terraform HCL LocalStack provider              |
| `pulumi-ts-config.ts`     | Pulumi TypeScript LocalStack configuration     |
| `cfn-yaml-parameters.yaml`| CloudFormation YAML LocalStack parameters      |

### Service Substitution Suggestions

When Pro-only services are detected, the system suggests alternatives. See `service_substitutions` in `.claude/config/localstack.yaml`:

| Pro-Only Service | Suggested Alternative            |
| ---------------- | -------------------------------- |
| AppSync          | API Gateway + Lambda             |
| EKS              | ECS (limited support)            |
| Cognito          | IAM + Lambda Authorizer          |
| Amplify          | S3 Static Hosting                |
| SageMaker        | Lambda (for simple inference)    |

### Intelligent Fix Ordering

Fixes are automatically ordered based on error analysis. See `intelligent_fixes` in `.claude/config/localstack.yaml`:

1. **Error Pattern Analysis**: Matches errors to specific fixes
2. **Service Detection**: Skips inapplicable fixes
3. **Priority-Based Ordering**: Critical fixes first

## Usage

**DEFAULT: Local-only mode** - All migrations run locally first. Use `--push` or `--ci` to push to GitHub CI/CD.

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 DEFAULT: LOCAL-ONLY MODE (No CI/CD until you're ready!)
# ═══════════════════════════════════════════════════════════════════════════════

# Migrate task locally (DEFAULT - no CI/CD)
/localstack-migrate Pr7179

# Migrate with auto-fix enabled
/localstack-migrate --fix Pr7179

# Migrate a specific task by path
/localstack-migrate ./archive/cdk-ts/Pr7179

# Run local CI simulation on existing worktree
/localstack-migrate --simulate ./worktree/localstack-Pr7179

# ═══════════════════════════════════════════════════════════════════════════════
# 📤 PUSH TO CI/CD (Only when local validation passes!)
# ═══════════════════════════════════════════════════════════════════════════════

# Push to CI after local validation passes
/localstack-migrate --push Pr7179

# Full workflow: migrate, fix, validate locally, then push to CI
/localstack-migrate --fix --push-when-ready Pr7179

# Force push to CI without local validation (NOT recommended)
/localstack-migrate --ci Pr7179

# ═══════════════════════════════════════════════════════════════════════════════
# OTHER OPTIONS
# ═══════════════════════════════════════════════════════════════════════════════

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

# Pre-migration compatibility check
/localstack-migrate --check Pr7179

# Show real-time dashboard
/localstack-migrate --dashboard

# Enhance tests for LocalStack
/localstack-migrate --enhance-tests Pr7179

# Rollback a failed migration
/localstack-migrate --rollback Pr7179
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

# Don't exit yet - PR creation is only PARTIAL completion
# Task is complete only when archive-folders job passes
```

### Step 12: Monitor CI/CD Pipeline Until Archive Stage (TASK COMPLETION)

> **CRITICAL**: A task is NOT complete when the PR is created. It is only complete when the **archive-folders** job passes in CI/CD. This step monitors the pipeline and triggers auto-fixes until that checkpoint is reached.

```bash
# ═══════════════════════════════════════════════════════════════
# STEP 12: POST-PR MONITORING AND AUTO-FIX LOOP
# ═══════════════════════════════════════════════════════════════
# Task completion criteria:
#   ✅ archive-folders job passes = TASK COMPLETE
#   ❌ Any job fails = Trigger localstack-fixer, retry
# ═══════════════════════════════════════════════════════════════

if [ "$MIGRATION_STATUS" = "success" ]; then
  log_header "🔄 STEP 12: MONITORING CI/CD UNTIL TASK COMPLETION"
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ⚠️  PR CREATED - BUT TASK IS NOT YET COMPLETE!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  Task completion requires: archive-folders job to PASS"
  echo ""
  echo "  The orchestrator will now:"
  echo "    1. Monitor the CI/CD pipeline"
  echo "    2. If any job fails → trigger localstack-fixer"
  echo "    3. Push fixes and wait for new pipeline run"
  echo "    4. Repeat until archive-folders passes"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Configuration for monitoring
  MAX_FIX_ITERATIONS=5
  PIPELINE_TIMEOUT=2700  # 45 minutes
  POLL_INTERVAL=45
  WAIT_AFTER_PUSH=60
  
  # Job order for progress tracking
  JOB_ORDER=(
    "detect-metadata"
    "claude-review-prompt-quality"
    "validate-commit-message"
    "validate-jest-config"
    "build"
    "synth"
    "deploy"
    "lint"
    "unit-tests"
    "integration-tests-live"
    "claude-code-action"
    "cleanup"
    "claude-review-ideal-response"
    "archive-folders"  # FINAL CHECKPOINT
  )
  
  FINAL_CHECKPOINT="archive-folders"
  FIX_ITERATION=0
  START_TIME=$(date +%s)
  TASK_COMPLETE=false
  
  # Wait for CI to start
  log_info "Waiting ${WAIT_AFTER_PUSH}s for CI/CD pipeline to start..."
  sleep $WAIT_AFTER_PUSH
  
  # Main monitoring loop
  while [ "$TASK_COMPLETE" = "false" ]; do
    ELAPSED=$(($(date +%s) - START_TIME))
    
    # Check timeout
    if [ "$ELAPSED" -ge "$PIPELINE_TIMEOUT" ]; then
      log_error "Pipeline timeout reached after ${ELAPSED}s"
      log_error "Task is NOT complete - manual intervention required"
      break
    fi
    
    # Check max iterations
    if [ "$FIX_ITERATION" -ge "$MAX_FIX_ITERATIONS" ]; then
      log_error "Maximum fix iterations ($MAX_FIX_ITERATIONS) reached"
      log_error "Task is NOT complete - manual intervention required"
      break
    fi
    
    log_info "Checking pipeline status... (elapsed: ${ELAPSED}s, iteration: $FIX_ITERATION)"
    
    # Get PR branch
    PR_BRANCH=$(gh pr view "$NEW_PR_NUMBER" --repo "$GITHUB_REPO" --json headRefName -q '.headRefName' 2>/dev/null || echo "")
    
    if [ -z "$PR_BRANCH" ]; then
      log_warning "Could not get PR branch, retrying..."
      sleep $POLL_INTERVAL
      continue
    fi
    
    # Get latest workflow run
    WORKFLOW_RUN=$(gh run list --repo "$GITHUB_REPO" --branch "$PR_BRANCH" --limit 1 --json databaseId,status,conclusion 2>/dev/null || echo "[]")
    
    if [ "$WORKFLOW_RUN" = "[]" ] || [ -z "$WORKFLOW_RUN" ]; then
      log_warning "No workflow runs found, waiting..."
      sleep $POLL_INTERVAL
      continue
    fi
    
    RUN_ID=$(echo "$WORKFLOW_RUN" | jq -r '.[0].databaseId')
    RUN_STATUS=$(echo "$WORKFLOW_RUN" | jq -r '.[0].status')
    RUN_CONCLUSION=$(echo "$WORKFLOW_RUN" | jq -r '.[0].conclusion // "in_progress"')
    
    # Get job statuses
    JOBS=$(gh run view "$RUN_ID" --repo "$GITHUB_REPO" --json jobs 2>/dev/null | jq '.jobs // []' || echo "[]")
    
    # Check archive-folders status
    ARCHIVE_STATUS=$(echo "$JOBS" | jq -r '.[] | select(.name == "archive-folders") | .conclusion // "pending"')
    
    # Check for any failures
    FAILED_JOBS=$(echo "$JOBS" | jq -r '[.[] | select(.conclusion == "failure")] | length')
    RUNNING_JOBS=$(echo "$JOBS" | jq -r '[.[] | select(.status == "in_progress" or .status == "queued")] | length')
    FIRST_FAILED=$(echo "$JOBS" | jq -r '[.[] | select(.conclusion == "failure")][0].name // ""')
    
    # Display progress
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│  📊 PIPELINE PROGRESS - PR #$NEW_PR_NUMBER"
    echo "├─────────────────────────────────────────────────────────────┤"
    
    for job in "${JOB_ORDER[@]}"; do
      JOB_STATUS=$(echo "$JOBS" | jq -r --arg name "$job" '.[] | select(.name == $name) | .conclusion // .status // "pending"')
      case "$JOB_STATUS" in
        success) ICON="✅" ;;
        failure) ICON="❌" ;;
        in_progress|queued) ICON="🔄" ;;
        skipped) ICON="⏭️ " ;;
        *) ICON="⏳" ;;
      esac
      if [ "$job" = "$FINAL_CHECKPOINT" ]; then
        echo "│  $ICON $job [FINAL]"
      else
        echo "│  $ICON $job"
      fi
    done
    
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""
    
    # Check if task is complete
    if [ "$ARCHIVE_STATUS" = "success" ]; then
      TASK_COMPLETE=true
      
      log_header "🎉 TASK COMPLETE - ARCHIVE STAGE REACHED!"
      echo ""
      echo "   PR #$NEW_PR_NUMBER is now PRODUCTION READY!"
      echo "   Total fix iterations: $FIX_ITERATION"
      echo "   Total time: ${ELAPSED}s"
      echo ""
      echo "   The task has passed all CI/CD checkpoints and is ready for manual review."
      echo ""
      
      # Update migration log with completion status
      "$PROJECT_ROOT/.claude/scripts/localstack-update-log.sh" \
        --task-path "$TASK_PATH" \
        --status "completed" \
        --pr-url "${NEW_PR_URL:-}" \
        --pr-number "${NEW_PR_NUMBER:-}" \
        --iterations "$FIX_ITERATION" 2>/dev/null || true
      
      break
      
    elif [ "$FAILED_JOBS" -gt 0 ]; then
      # Pipeline failed - trigger auto-fix
      FIX_ITERATION=$((FIX_ITERATION + 1))
      
      log_warning "Pipeline failed at: $FIRST_FAILED"
      log_fix "Triggering auto-fix iteration $FIX_ITERATION..."
      echo ""
      echo "═══════════════════════════════════════════════════════════════"
      echo "  🤖 INVOKING LOCALSTACK-FIXER AGENT"
      echo "═══════════════════════════════════════════════════════════════"
      echo ""
      echo "  Target PR: #$NEW_PR_NUMBER"
      echo "  Failed Job: $FIRST_FAILED"
      echo "  Iteration: $FIX_ITERATION of $MAX_FIX_ITERATIONS"
      echo ""
      echo "  The fixer agent will:"
      echo "    1. Fetch error logs from failed job"
      echo "    2. Analyze errors and identify fixes"
      echo "    3. Apply batch fixes"
      echo "    4. Run local pre-validation"
      echo "    5. Push fixes to trigger new CI run"
      echo ""
      echo "═══════════════════════════════════════════════════════════════"
      echo ""
      
      # >>> INVOKE LOCALSTACK-FIXER AGENT HERE <<<
      # The agent system will pick up this invocation
      # Agent context: Fix PR #$NEW_PR_NUMBER, failed at $FIRST_FAILED
      
      # Wait for fix to be applied and new CI run to start
      log_info "Waiting ${WAIT_AFTER_PUSH}s for new CI run after fix..."
      sleep $WAIT_AFTER_PUSH
      
    elif [ "$RUNNING_JOBS" -gt 0 ]; then
      # Pipeline still running
      log_info "Pipeline running... waiting ${POLL_INTERVAL}s"
      sleep $POLL_INTERVAL
      
    else
      # Pipeline completed but archive not reached - check again
      log_info "Pipeline completed, checking archive status..."
      sleep $POLL_INTERVAL
    fi
  done
  
  # Final status
  if [ "$TASK_COMPLETE" = "true" ]; then
    exit 0
  else
    log_error "Task did NOT complete - archive stage not reached"
    log_info "Manual intervention required for PR #$NEW_PR_NUMBER"
    exit 1
  fi
  
else
  log_header "❌ MIGRATION FAILED - PR NOT CREATED"
  
  echo "   Task:   $TASK_PATH"
  echo "   Reason: $MIGRATION_REASON"
  echo ""
  echo "💡 Next steps:"
  echo "   - Review errors in migration log"
  echo "   - Try manual migration"
  echo "   - Check if services are supported in LocalStack Community"
  
  exit 1
fi
```

## Task Completion Criteria

**IMPORTANT**: A localstack-migrate task is NOT complete until:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TASK COMPLETION STAGES                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ❌ PR Created                    → PARTIAL (not complete)                  │
│  ❌ Deployment passed             → PARTIAL (not complete)                  │
│  ❌ Tests passed                  → PARTIAL (not complete)                  │
│  ❌ Claude review passed          → PARTIAL (not complete)                  │
│  ✅ archive-folders job passed    → COMPLETE (production ready)             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

The orchestrator will automatically:
1. Monitor the CI/CD pipeline after PR creation
2. Detect any failures at any checkpoint
3. Invoke the localstack-fixer agent to fix issues
4. Push fixes and wait for new pipeline run
5. Repeat until archive-folders passes (max 5 iterations)

## CI/CD Pipeline Compliance

The localstack-migrate command automatically ensures that created PRs will pass the CI/CD pipeline's "Detect Project Files" job. Here's what happens:

### Pre-Flight Validation

Before creating a PR, the script validates:

1. **File Locations**: All files must be in allowed folders (`bin/`, `lib/`, `test/`, `tests/`, `cli/`, `scripts/`, `.github/`) or be allowed root files
2. **Metadata Schema**: `metadata.json` must have all required fields and valid enum values
3. **Required Documentation**: For synthetic tasks (team starting with `synth`), ensures `lib/PROMPT.md` and `lib/MODEL_RESPONSE.md` exist

### Automatic Fixes

The PR creation script automatically:

| Issue | Auto-Fix |
| ----- | -------- |
| Missing `PROMPT.md` | Creates placeholder with task context |
| Missing `MODEL_RESPONSE.md` | Creates placeholder with migration summary |
| Invalid metadata fields | Sanitizes to valid enum values via `localstack-sanitize-metadata.sh` |
| Missing `wave` field | Defaults to "P1" |
| Invalid `subtask` values | Maps to closest valid subtask |
| Invalid `subject_labels` | Maps to closest valid labels |

### Pipeline Job Dependencies

Understanding the CI/CD job flow helps diagnose issues:

```
detect-metadata (Detect Project Files)
    ├── Validates metadata.json against schema
    ├── Checks file locations (check-project-files.sh)
    ├── Validates required docs for synth tasks
    └── Outputs: platform, language, provider, subject_labels
         │
         ▼
claude-review-prompt-quality
         │
         ▼
validate-commit-message → validate-jest-config (JS/TS only)
         │
         ▼
      build
         │
         ▼
    synth (CDK/CDKTF only)
         │
         ▼
      deploy → lint → unit-tests
         │
         ▼
integration-tests-live
         │
         ▼
  claude-code-action
         │
         ▼
      cleanup → claude-review-ideal-response
         │
         ▼
  archive-folders
```

### Troubleshooting CI/CD Failures

If the "Detect Project Files" job fails:

1. **Check metadata.json schema**: Run the schema validator locally
   ```bash
   npm install -g ajv-cli
   ajv validate -s config/schemas/metadata.schema.json -d metadata.json
   ```

2. **Verify file locations**: Run the check script
   ```bash
   ./scripts/check-project-files.sh
   ```

3. **Check required docs for synth tasks**:
   ```bash
   # For team starting with "synth"
   ls -la lib/PROMPT.md lib/MODEL_RESPONSE.md
   ```

4. **Re-run sanitization manually**:
   ```bash
   .claude/scripts/localstack-sanitize-metadata.sh metadata.json
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
