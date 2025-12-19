---
name: localstack-fixer
description: Fixes IaC tasks for LocalStack compatibility - works with local errors (from localstack-migrate) or PR failures (from GitHub Actions).
color: orange
model: sonnet
---

# LocalStack Fixer Agent

Fixes IaC tasks to make them deployable to LocalStack. Supports TWO modes:

1. **Local Mode** (from `localstack-migrate`): Fix local deployment errors in a working directory
2. **PR Mode** (standalone): Fix failed CI/CD jobs for a specific GitHub PR

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

## 🔴 CRITICAL: Guardrails and Boundaries

**The agent MUST respect these boundaries to prevent destructive operations.**

### ⚠️ TOP 3 RESTRICTIONS (READ FIRST!)

1. **🚫 NEVER modify `scripts/` folder** - This is STRICTLY FORBIDDEN everywhere, including in worktrees. No exceptions.

2. **🚫 NEVER modify `jest.config.js` without 80%+ coverage** - The agent must verify test coverage is at least 80% before ANY modification to jest.config.js. Without coverage verification, this file is READ-ONLY.

3. **🚫 ONLY modify files in the allowed list** - Changes are STRICTLY limited to:
   - `lib/` directory (source files)
   - `test/` directory (test files)
   - `metadata.json`, `execution-output.md`, `package.json`, `tsconfig.json`, `cdk.json`, `Pulumi.yaml`
   - **NOTHING ELSE!**

### Restricted Paths (NEVER operate in these directories)

```yaml
restricted_paths:
  # Repository infrastructure - NEVER modify
  - scripts/           # Shell scripts for CI/CD and deployment - STRICTLY FORBIDDEN
  - .github/           # GitHub Actions and workflows
  - .claude/           # Claude agent configurations
  - config/            # Schema and configuration files
  - node_modules/      # Dependencies
  - dist/              # Build output
  - .git/              # Git internals

  # 🔴 CRITICAL: scripts/ folder is STRICTLY FORBIDDEN
  # The agent MUST NEVER:
  # - Read, write, or modify ANY file in scripts/
  # - Create new files in scripts/
  # - Delete files from scripts/
  # - Even reference scripts/ in fixes
  # This applies EVERYWHERE, including in worktrees!

  # Never delete these directories (even in worktree)
  never_delete:
    - scripts/
    - .github/
    - .claude/
    - config/
    - lib/              # Main source code
    - test/             # Test files
```

### Allowed Paths (Operations permitted ONLY here)

```yaml
allowed_paths:
  # ONLY operate within the task's working directory
  working_directory_patterns:
    - worktree/localstack-*    # LocalStack worktrees
    - worktree/fixer-*         # Fixer worktrees
    - worktree/synth-*         # Synth worktrees

  # Within the worktree, only modify these directories/files
  # 🔴 STRICT ENFORCEMENT: Changes ONLY allowed to files listed here
  modifiable_directories:
    - lib/               # Main IaC source code
    - test/              # Test files
    - metadata.json      # Task metadata
    - execution-output.md # Execution logs
    - package.json       # Only for dependency issues (NOT scripts section)
    - tsconfig.json      # TypeScript configuration
    - cdk.json           # CDK configuration
    - Pulumi.yaml        # Pulumi configuration
    - *.tf               # Terraform files
    - *.py               # Python files (in lib/ or test/ only)

  # 🔴 CRITICAL: jest.config.js has SPECIAL RESTRICTIONS
  # See "Jest Config Modification Rules" section below
  jest_config_rules:
    file: jest.config.js
    restriction: "ONLY modify if coverage threshold met"
    min_coverage_for_modification: 80%  # Must have 80%+ coverage before modifying

  # 🔴 STRICTLY FORBIDDEN - NEVER modify these (even in worktree)
  strictly_forbidden:
    - scripts/           # Shell scripts - NEVER TOUCH
    - .github/           # Workflow files
    - .claude/           # Agent configs
    - config/            # Schema files
```

### Jest Config Modification Rules

**🔴 CRITICAL: `jest.config.js` has SPECIAL RESTRICTIONS**

The agent MUST NOT modify `jest.config.js` unless:

1. Test coverage is at least 80% achieved
2. The modification is essential for test execution (not just preferences)
3. The current tests are actually running and producing coverage reports

```bash
#!/bin/bash
# check_jest_config_permission.sh - Run BEFORE modifying jest.config.js

can_modify_jest_config() {
  local WORK_DIR="$1"

  # ═══════════════════════════════════════════════════════════════
  # CHECK 1: Does coverage data exist?
  # ═══════════════════════════════════════════════════════════════

  if [[ ! -d "$WORK_DIR/coverage" ]] && [[ ! -f "$WORK_DIR/coverage/coverage-summary.json" ]]; then
    echo "❌ BLOCKED: Cannot modify jest.config.js - no coverage data found"
    echo "   Run tests first to generate coverage data"
    return 1
  fi

  # ═══════════════════════════════════════════════════════════════
  # CHECK 2: Is coverage at least 80%?
  # ═══════════════════════════════════════════════════════════════

  if [[ -f "$WORK_DIR/coverage/coverage-summary.json" ]]; then
    COVERAGE_PCT=$(jq -r '.total.lines.pct // 0' "$WORK_DIR/coverage/coverage-summary.json" 2>/dev/null)

    if [[ $(echo "$COVERAGE_PCT < 80" | bc -l) -eq 1 ]]; then
      echo "❌ BLOCKED: Cannot modify jest.config.js - coverage too low"
      echo "   Current coverage: ${COVERAGE_PCT}%"
      echo "   Required minimum: 80%"
      echo ""
      echo "   Focus on improving test coverage first before modifying jest.config.js"
      return 1
    fi

    echo "✅ Coverage check passed: ${COVERAGE_PCT}%"
  else
    echo "❌ BLOCKED: Cannot modify jest.config.js - coverage-summary.json not found"
    return 1
  fi

  return 0
}
```

**When jest.config.js modification is blocked:**

- Focus on fixing actual test files in `test/` directory
- Improve test coverage by adding more test cases
- Fix test assertions and mocks
- Do NOT work around test issues by modifying jest configuration

### Path Validation (MUST run before ANY file operation)

```bash
#!/bin/bash
# validate_path.sh - Run BEFORE any file operation

validate_path() {
  local TARGET_PATH="$1"
  local OPERATION="$2"  # read, write, delete

  # Get absolute path
  local ABS_PATH=$(realpath "$TARGET_PATH" 2>/dev/null || echo "$TARGET_PATH")
  local PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

  # ═══════════════════════════════════════════════════════════════
  # SPECIAL CHECK: scripts/ folder is STRICTLY FORBIDDEN
  # ═══════════════════════════════════════════════════════════════

  if [[ "$ABS_PATH" == *"/scripts/"* ]] || [[ "$ABS_PATH" == *"/scripts" ]] || [[ "$TARGET_PATH" == scripts/* ]] || [[ "$TARGET_PATH" == */scripts/* ]]; then
    echo "❌ STRICTLY FORBIDDEN: Cannot $OPERATION in scripts/ folder"
    echo "   Target: $TARGET_PATH"
    echo "   The scripts/ folder is NEVER modifiable by this agent."
    echo "   This restriction applies EVERYWHERE, including worktrees."
    return 1
  fi

  # ═══════════════════════════════════════════════════════════════
  # BLOCKED PATHS - NEVER allow operations here
  # ═══════════════════════════════════════════════════════════════

  BLOCKED_PATHS=(
    "scripts"
    ".github"
    ".claude"
    "config"
    "node_modules"
    ".git"
    "dist"
    "archive"
    "templates"
    "subcategory-references"
  )

  for blocked in "${BLOCKED_PATHS[@]}"; do
    # 🔴 SPECIAL CASE: scripts/ is ALWAYS blocked, even in worktrees
    if [[ "$blocked" == "scripts" ]]; then
      if [[ "$ABS_PATH" == *"/scripts/"* ]] || [[ "$ABS_PATH" == *"/scripts" ]]; then
        echo "❌ STRICTLY FORBIDDEN: Cannot $OPERATION in scripts/ folder"
        echo "   Target: $TARGET_PATH"
        echo "   The scripts/ folder is NEVER modifiable - this applies EVERYWHERE!"
        return 1
      fi
    elif [[ "$ABS_PATH" == *"$PROJECT_ROOT/$blocked"* ]] && [[ "$ABS_PATH" != *"worktree/"* ]]; then
      echo "❌ BLOCKED: Cannot $OPERATION in restricted path: $blocked"
      echo "   Target: $TARGET_PATH"
      echo "   This path is protected repository infrastructure."
      return 1
    fi
  done

  # ═══════════════════════════════════════════════════════════════
  # ALLOWED FILES CHECK - Strictly enforce allowed file list
  # ═══════════════════════════════════════════════════════════════

  if [[ "$OPERATION" == "write" ]] || [[ "$OPERATION" == "delete" ]]; then
    local FILENAME=$(basename "$TARGET_PATH")
    local DIRNAME=$(dirname "$TARGET_PATH")
    local IS_ALLOWED=false

    # Check if in allowed directories
    if [[ "$DIRNAME" == *"/lib"* ]] || [[ "$DIRNAME" == *"/test"* ]]; then
      IS_ALLOWED=true
    fi

    # Check if it's an allowed specific file
    ALLOWED_FILES=(
      "metadata.json"
      "execution-output.md"
      "package.json"
      "tsconfig.json"
      "cdk.json"
      "Pulumi.yaml"
      "requirements.txt"
      "pyproject.toml"
    )

    for allowed in "${ALLOWED_FILES[@]}"; do
      if [[ "$FILENAME" == "$allowed" ]]; then
        IS_ALLOWED=true
        break
      fi
    done

    # Special handling for jest.config.js - needs coverage check
    if [[ "$FILENAME" == "jest.config.js" ]]; then
      if [[ -f "coverage/coverage-summary.json" ]]; then
        COVERAGE=$(jq -r '.total.lines.pct // 0' "coverage/coverage-summary.json" 2>/dev/null || echo "0")
        if [[ $(echo "$COVERAGE >= 80" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
          IS_ALLOWED=true
          echo "✅ jest.config.js modification allowed (coverage: ${COVERAGE}%)"
        else
          echo "❌ BLOCKED: jest.config.js modification requires 80%+ coverage"
          echo "   Current coverage: ${COVERAGE}%"
          return 1
        fi
      else
        echo "❌ BLOCKED: jest.config.js modification requires coverage data"
        return 1
      fi
    fi

    if [[ "$IS_ALLOWED" == "false" ]]; then
      echo "❌ BLOCKED: File not in allowed modifications list"
      echo "   Target: $TARGET_PATH"
      echo "   Only files in lib/, test/, and specific config files can be modified"
      return 1
    fi
  fi

  # ═══════════════════════════════════════════════════════════════
  # DELETE RESTRICTIONS - Extra protection for delete operations
  # ═══════════════════════════════════════════════════════════════

  if [[ "$OPERATION" == "delete" ]]; then
    # Never delete directories, only files
    if [[ -d "$TARGET_PATH" ]]; then
      echo "❌ BLOCKED: Cannot delete directories. Only file deletion is allowed."
      echo "   Target: $TARGET_PATH"
      return 1
    fi

    # Only allow deletion within worktree
    if [[ "$ABS_PATH" != *"worktree/"* ]]; then
      echo "❌ BLOCKED: Delete operations only allowed within worktree/"
      echo "   Target: $TARGET_PATH"
      return 1
    fi

    # Never delete these files even in worktree
    PROTECTED_FILES=(
      "metadata.json"
      "PROMPT.md"
      "MODEL_RESPONSE.md"
      "IDEAL_RESPONSE.md"
    )

    local FILENAME=$(basename "$TARGET_PATH")
    for protected in "${PROTECTED_FILES[@]}"; do
      if [[ "$FILENAME" == "$protected" ]]; then
        echo "❌ BLOCKED: Cannot delete protected file: $protected"
        return 1
      fi
    done
  fi

  # ═══════════════════════════════════════════════════════════════
  # WORKTREE VALIDATION - Ensure we're in a valid worktree
  # ═══════════════════════════════════════════════════════════════

  if [[ "$OPERATION" == "write" || "$OPERATION" == "delete" ]]; then
    # Get current working directory
    local CWD=$(pwd)

    # Check if we're in a worktree
    if [[ "$CWD" != *"worktree/"* ]] && [[ "$ABS_PATH" != *"worktree/"* ]]; then
      echo "❌ BLOCKED: Write/delete operations only allowed within worktree/"
      echo "   Current directory: $CWD"
      echo "   Target: $TARGET_PATH"
      echo "   Please ensure you're working in an isolated worktree."
      return 1
    fi
  fi

  echo "✅ Path validated: $TARGET_PATH ($OPERATION)"
  return 0
}

# Example usage:
# validate_path "lib/index.ts" "write" || exit 1
# validate_path "scripts/deploy.sh" "write" || exit 1  # Would be BLOCKED
```

### Agent Behavior Rules

1. **ALWAYS verify current directory** before any file operation
2. **NEVER use `rm -rf`** on any directory
3. **NEVER modify files outside the worktree** (except reading for reference)
4. **ALWAYS use the validation function** before file operations
5. **If unsure about a path, ASK the user** rather than proceeding
6. **STOP immediately** if a blocked path is detected
7. **🔴 NEVER modify scripts/ folder** - this is STRICTLY FORBIDDEN everywhere
8. **🔴 NEVER modify jest.config.js** without 80%+ test coverage verified
9. **🔴 STRICTLY enforce allowed files list** - only modify files explicitly listed in allowed_paths

### Strict File Modification Enforcement

**🔴 CRITICAL: Changes are ONLY allowed to these specific files/patterns:**

```yaml
# EXHAUSTIVE list of modifiable files - NO EXCEPTIONS
strictly_allowed_modifications:
  directories:
    - lib/                    # IaC source code files
    - test/                   # Test files

  specific_files:
    - metadata.json           # Task metadata
    - execution-output.md     # Execution logs
    - package.json            # Dependencies only (NOT scripts section!)
    - tsconfig.json           # TypeScript config
    - cdk.json                # CDK config
    - Pulumi.yaml             # Pulumi config
    - requirements.txt        # Python dependencies
    - pyproject.toml          # Python project config

  file_patterns:
    - "lib/*.ts"              # TypeScript source
    - "lib/*.py"              # Python source
    - "lib/*.tf"              # Terraform files
    - "lib/*.go"              # Go source
    - "test/*.ts"             # TypeScript tests
    - "test/*.py"             # Python tests
    - "test/*.test.ts"        # Test files
    - "test/*.int.test.ts"    # Integration tests
    - "test/*.unit.test.ts"   # Unit tests

  conditional_files:
    - jest.config.js:         # ONLY if coverage >= 80%
        condition: "coverage >= 80%"

# EVERYTHING ELSE IS FORBIDDEN - including:
absolutely_forbidden:
  - scripts/*                 # NEVER - shell scripts
  - .github/*                 # NEVER - workflows
  - .claude/*                 # NEVER - agent configs
  - config/*                  # NEVER - schemas
  - *.sh                      # NEVER - shell scripts anywhere
  - jest.config.js            # BLOCKED unless coverage >= 80%
```

**Before ANY file operation, the agent MUST:**

1. Check if the file is in the `strictly_allowed_modifications` list
2. If it's `jest.config.js`, verify coverage >= 80%
3. If it's `package.json`, ensure only dependencies are being modified (NOT scripts)
4. If the file is not in the allowed list, REFUSE to modify it

### Automatic Guardrail Enforcement

The agent MUST add this check at the start of every fix application:

```bash
# At the start of fix application
echo "🛡️ Validating working directory..."

# Ensure we're in a worktree
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" != *"worktree/"* ]]; then
  echo "❌ FATAL: Not in a worktree directory!"
  echo "   Current: $CURRENT_DIR"
  echo "   Expected: */worktree/*"
  echo ""
  echo "🔧 To fix: cd to the correct worktree before applying fixes"
  exit 1
fi

# Ensure we're not in a restricted subdirectory within worktree
for restricted in scripts .github .claude config; do
  if [[ "$CURRENT_DIR" == *"/$restricted"* ]] || [[ "$CURRENT_DIR" == *"/$restricted" ]]; then
    echo "❌ FATAL: In restricted directory: $restricted"
    echo "   Current: $CURRENT_DIR"
    cd ..
    echo "   Moved to: $(pwd)"
  fi
done

echo "✅ Working directory validated: $CURRENT_DIR"
```

## Input Parameters

### Local Mode (from localstack-migrate)

- `WORK_DIR` - Working directory containing task files (required)
- `PLATFORM` - IaC platform (cdk, cfn, tf, pulumi)
- `LANGUAGE` - Programming language (ts, py, go, etc.)
- `DEPLOY_ERRORS` - Array of deployment errors
- `TEST_ERRORS` - Array of test errors

### PR Mode (standalone)

- `PR_NUMBER` - The GitHub PR number to fix (e.g., 7179, Pr7179, or #7179)

## Usage

```bash
# ═══════════════════════════════════════════════════════
# LOCAL MODE (called by localstack-migrate)
# ═══════════════════════════════════════════════════════

# Fix errors in a local working directory
# (This is how localstack-migrate invokes the fixer)
WORK_DIR="worktree/localstack-Pr7179"
PLATFORM="cdk"
LANGUAGE="ts"
DEPLOY_ERRORS="UnrecognizedClientException: connection refused"
TEST_ERRORS="test failed: assertion error"

# ═══════════════════════════════════════════════════════
# PR MODE (standalone usage)
# ═══════════════════════════════════════════════════════

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

## 🔴 CRITICAL: Dual Mode Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCALSTACK FIXER AGENT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ MODE DETECTION                                          │   │
│  │                                                         │   │
│  │  WORK_DIR provided? ──YES──► LOCAL MODE                │   │
│  │         │                         │                     │   │
│  │        NO                         ▼                     │   │
│  │         │               Use DEPLOY_ERRORS/TEST_ERRORS   │   │
│  │         ▼                         │                     │   │
│  │    PR_NUMBER provided? ──YES──► PR MODE                │   │
│  │                                   │                     │   │
│  │                                   ▼                     │   │
│  │                          Fetch errors from GitHub       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ COMMON FIX PIPELINE                                     │   │
│  │                                                         │   │
│  │  1. ANALYZE: Parse ALL error messages                  │   │
│  │  2. IDENTIFY: Map errors to known fixes (batch)        │   │
│  │  3. FIX: Apply ALL fixes in ONE batch                  │   │
│  │  4. TEST: Re-deploy to verify                          │   │
│  │  5. ITERATE: If still failing (max 3 times)            │   │
│  │  6. REPORT: Document all fixes and status              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Execution

### Step 1: Detect Mode and Initialize

```bash
#!/bin/bash
set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

# ═══════════════════════════════════════════════════════════════
# MODE DETECTION
# If WORK_DIR is set → LOCAL MODE (from localstack-migrate)
# If PR_NUMBER is set → PR MODE (standalone)
# ═══════════════════════════════════════════════════════════════

# Check for LOCAL MODE first (WORK_DIR takes precedence)
if [[ -n "$WORK_DIR" ]] && [[ -d "$WORK_DIR" ]]; then
  MODE="local"
  echo ""
  echo "═══════════════════════════════════════════════════"
  echo "🔧 LOCALSTACK FIXER - LOCAL MODE"
  echo "═══════════════════════════════════════════════════"
  echo ""
  echo "📁 Working Directory: $WORK_DIR"
  echo "📋 Platform: ${PLATFORM:-auto-detect}"
  echo "📋 Language: ${LANGUAGE:-auto-detect}"
  echo ""

  # Use provided errors or empty
  UNIQUE_ERRORS="${DEPLOY_ERRORS:-}
${TEST_ERRORS:-}"

  # Change to work directory
  cd "$WORK_DIR"

  # Auto-detect platform/language from metadata.json if not provided
  if [[ -f "metadata.json" ]]; then
    [[ -z "$PLATFORM" ]] && PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
    [[ -z "$LANGUAGE" ]] && LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
    echo "📋 Detected Platform: $PLATFORM"
    echo "📋 Detected Language: $LANGUAGE"
  fi
  echo ""

else
  # PR MODE - parse PR number from arguments
  MODE="pr"

  echo ""
  echo "═══════════════════════════════════════════════════"
  echo "🔧 LOCALSTACK FIXER - PR MODE"
  echo "═══════════════════════════════════════════════════"
  echo ""

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
      --work-dir)
        WORK_DIR="$2"
        MODE="local"
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
    echo "❌ Error: PR number or WORK_DIR is required"
    echo ""
    echo "Usage:"
    echo "  PR Mode:    /localstack-fixer <PR_NUMBER>"
    echo "              /localstack-fixer --pr 7179"
    echo "              /localstack-fixer --status 7179"
    echo ""
    echo "  Local Mode: Set WORK_DIR environment variable"
    echo "              WORK_DIR=worktree/localstack-Pr7179 /localstack-fixer"
    echo ""
    exit 1
  fi

  echo "📋 Target PR: #${PR_NUMBER}"
  echo ""
fi

# Initialize common variables
GITHUB_REPO="TuringGpt/iac-test-automations"
MAX_ITERATIONS=3
ITERATION=0
FIX_SUCCESS=false
FIXES_APPLIED=()
ERRORS_FOUND=()
```

### Step 2: Mode-Specific Setup

```bash
# ═══════════════════════════════════════════════════════════════
# LOCAL MODE: Skip GitHub checks, use provided errors
# ═══════════════════════════════════════════════════════════════
if [[ "$MODE" == "local" ]]; then
  echo "📋 Using local errors from deployment/tests..."

  if [[ -z "$UNIQUE_ERRORS" ]] || [[ "$UNIQUE_ERRORS" == $'\n' ]]; then
    echo "⚠️ No errors provided. Reading from execution-output.md..."
    if [[ -f "execution-output.md" ]]; then
      UNIQUE_ERRORS=$(grep -iE "error:|Error:|ERROR|failed|Failed|FAILED|exception|Exception" execution-output.md 2>/dev/null || echo "")
    fi
  fi

  ERROR_COUNT=$(echo "$UNIQUE_ERRORS" | grep -v '^$' | wc -l | tr -d ' ')
  echo "📊 Found $ERROR_COUNT error patterns to analyze"
  echo ""

  # Skip to fix identification (Step 6)

# ═══════════════════════════════════════════════════════════════
# PR MODE: Fetch errors from GitHub Actions
# ═══════════════════════════════════════════════════════════════
else
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
fi
```

### Step 3: Fetch PR Details and CI/CD Status (PR MODE ONLY)

```bash
if [[ "$MODE" == "pr" ]]; then
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

### Step 7: Checkout PR Branch (PR MODE ONLY)

```bash
# ═══════════════════════════════════════════════════════════════
# LOCAL MODE: Skip checkout - already in WORK_DIR
# PR MODE: Checkout the PR branch to a worktree
# ═══════════════════════════════════════════════════════════════

if [[ "$MODE" == "local" ]]; then
  echo "📁 Working in: $(pwd)"
  echo "   (Local mode - no checkout needed)"
  echo ""

else
  # PR MODE: Checkout PR branch
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
fi

# Read metadata if exists (both modes)
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

          # Map invalid subtask to valid ones (MUST be a single string value)
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

          # CRITICAL: Enforce subtask is a SINGLE string, not an array!
          def enforce_subtask_string:
            if type == "array" then
              if length > 0 then .[0] | map_subtask
              else "Infrastructure QA and Management"
              end
            elif type == "string" then
              . | map_subtask
            else
              "Infrastructure QA and Management"
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
          # NOTE: subtask uses enforce_subtask_string to ensure it's a single value!
          {
            platform: (.platform | validate_platform),
            language: (.language | validate_language),
            complexity: (.complexity | validate_complexity),
            turn_type: (.turn_type | validate_turn_type),
            po_id: (.po_id // .task_id // "unknown"),
            team: (.team | validate_team),
            startedAt: (.startedAt | validate_started_at),
            subtask: (.subtask | enforce_subtask_string),
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
    # 🔴 CRITICAL: Only modify if coverage threshold met!
    # ═══════════════════════════════════════════════════════
    jest_config)
      echo "📝 Checking Jest configuration fix eligibility..."

      if [[ -f "jest.config.js" ]]; then
        # ═══════════════════════════════════════════════════════
        # COVERAGE CHECK - MUST pass before modifying jest.config.js
        # ═══════════════════════════════════════════════════════
        CAN_MODIFY_JEST=false

        # Check if coverage data exists
        if [[ -f "coverage/coverage-summary.json" ]]; then
          COVERAGE_PCT=$(jq -r '.total.lines.pct // 0' "coverage/coverage-summary.json" 2>/dev/null || echo "0")

          # Check if coverage is at least 80%
          if [[ $(echo "$COVERAGE_PCT >= 80" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
            CAN_MODIFY_JEST=true
            echo "   ✅ Coverage check passed: ${COVERAGE_PCT}%"
          else
            echo "   ❌ BLOCKED: Coverage too low (${COVERAGE_PCT}% < 80%)"
            echo "      Cannot modify jest.config.js without sufficient coverage"
            echo "      Focus on improving test coverage first"
          fi
        else
          echo "   ❌ BLOCKED: No coverage data found"
          echo "      Run tests first to generate coverage data"
          echo "      Cannot modify jest.config.js without coverage verification"
        fi

        # Only proceed with jest.config.js modifications if coverage check passed
        if [[ "$CAN_MODIFY_JEST" == "true" ]]; then
          # Ensure roots points to 'test/' not 'tests/'
          if grep -q "roots.*tests" "jest.config.js"; then
            sed -i.bak "s|roots:.*\['<rootDir>/tests'\]|roots: ['<rootDir>/test']|g" "jest.config.js" && rm -f "jest.config.js.bak"
            echo "   ✅ Fixed Jest roots to use 'test/' folder"
            APPLIED_FIXES+=("jest_config")
          else
            echo "   ℹ️ Jest roots already correct, no changes needed"
          fi
        else
          echo "   ⚠️ Skipping jest.config.js modification - coverage requirement not met"
          echo "   📋 Alternative: Fix test files directly in test/ folder"
        fi
      fi
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

### Step 9: Commit and Push Fixes (PR MODE ONLY)

```bash
# ═══════════════════════════════════════════════════════════════
# LOCAL MODE: Skip commit/push - localstack-migrate handles this
# PR MODE: Commit and push fixes to the PR branch
# ═══════════════════════════════════════════════════════════════

if [[ "$MODE" == "local" ]]; then
  echo ""
  echo "═══════════════════════════════════════════════════"
  echo "✅ FIXES APPLIED (LOCAL MODE)"
  echo "═══════════════════════════════════════════════════"
  echo ""
  echo "📋 Fixes applied to: $WORK_DIR"
  echo "   localstack-migrate will handle commit/push"
  echo ""

  # Document fixes in execution-output.md
  echo "" >> execution-output.md
  echo "## Fixes Applied by localstack-fixer" >> execution-output.md
  echo "" >> execution-output.md
  for fix in "${APPLIED_FIXES[@]}"; do
    echo "- ✅ $fix" >> execution-output.md
  done
  echo "" >> execution-output.md

else
  # PR MODE: Commit and push
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
fi
```

### Step 10: Monitor CI/CD Until Production Ready (PR MODE ONLY)

**🔴 CRITICAL**: The agent MUST continue watching CI/CD after pushing fixes until the PR is production ready. Do NOT stop after pushing - iterate until all jobs pass.

```bash
# ═══════════════════════════════════════════════════════════════
# LOCAL MODE: Skip - localstack-migrate will re-deploy
# PR MODE: Monitor CI/CD until production ready
# ═══════════════════════════════════════════════════════════════

if [[ "$MODE" == "pr" ]]; then
  echo ""
  echo "═══════════════════════════════════════════════════"
  echo "🔄 MONITORING CI/CD UNTIL PRODUCTION READY"
  echo "═══════════════════════════════════════════════════"
  echo ""

  # ═══════════════════════════════════════════════════════════════
  # PRODUCTION READY LOOP - MUST iterate until ALL CI/CD jobs pass
  # ═══════════════════════════════════════════════════════════════

  CICD_ITERATION=1
  MAX_CICD_ITERATIONS=10  # Maximum iterations to prevent infinite loops
  PRODUCTION_READY=false
  CICD_WAIT_TIMEOUT=900   # 15 minutes per iteration
  POLL_INTERVAL=30        # Poll every 30 seconds

  while [ $CICD_ITERATION -le $MAX_CICD_ITERATIONS ] && [ "$PRODUCTION_READY" == "false" ]; do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔄 CI/CD Iteration ${CICD_ITERATION}/${MAX_CICD_ITERATIONS}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Wait for GitHub to process the push and start workflows
    echo "⏳ Waiting for CI/CD to register changes..."
    sleep 30

    # Poll CI/CD status until complete or timeout
    WAIT_TIME=0
    CICD_COMPLETE=false

    while [ $WAIT_TIME -lt $CICD_WAIT_TIMEOUT ] && [ "$CICD_COMPLETE" == "false" ]; do
      # Fetch latest workflow run
      LATEST_RUN=$(gh run list --repo "$GITHUB_REPO" --branch "$PR_BRANCH" --limit 1 \
        --json databaseId,status,conclusion 2>/dev/null | jq '.[0]' 2>/dev/null)

      if [[ -z "$LATEST_RUN" ]] || [[ "$LATEST_RUN" == "null" ]]; then
        echo "⚠️ Could not fetch workflow status, retrying..."
        sleep $POLL_INTERVAL
        WAIT_TIME=$((WAIT_TIME + POLL_INTERVAL))
        continue
      fi

      RUN_STATUS=$(echo "$LATEST_RUN" | jq -r '.status // "unknown"')
      RUN_CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.conclusion // "pending"')
      RUN_ID=$(echo "$LATEST_RUN" | jq -r '.databaseId')

      if [[ "$RUN_STATUS" == "completed" ]]; then
        CICD_COMPLETE=true
        echo "✅ CI/CD run completed with conclusion: $RUN_CONCLUSION"
      else
        echo "⏳ CI/CD still running... Status: $RUN_STATUS (${WAIT_TIME}s / ${CICD_WAIT_TIMEOUT}s)"
        sleep $POLL_INTERVAL
        WAIT_TIME=$((WAIT_TIME + POLL_INTERVAL))
      fi
    done

    # Check if CI/CD timed out
    if [ "$CICD_COMPLETE" == "false" ]; then
      echo "⏰ CI/CD timeout after ${CICD_WAIT_TIMEOUT}s"
      echo "   Will check again in next iteration..."
      CICD_ITERATION=$((CICD_ITERATION + 1))
      continue
    fi

    # Check CI/CD result
    if [[ "$RUN_CONCLUSION" == "success" ]]; then
      echo ""
      echo "🎉 ALL CI/CD JOBS PASSED!"
      echo ""
      PRODUCTION_READY=true
      break
    fi

    # CI/CD failed - analyze failures and apply more fixes
    echo ""
    echo "❌ CI/CD failed with conclusion: $RUN_CONCLUSION"
    echo "   Analyzing failures for iteration ${CICD_ITERATION}..."
    echo ""

    # Fetch failed jobs from this run
    JOBS=$(gh run view "$RUN_ID" --repo "$GITHUB_REPO" --json jobs 2>/dev/null | jq '.jobs // []')
    FAILED_JOBS=$(echo "$JOBS" | jq '[.[] | select(.conclusion == "failure")]')
    FAILED_COUNT=$(echo "$FAILED_JOBS" | jq 'length')

    echo "📋 Job Status (Iteration $CICD_ITERATION):"
    echo "$JOBS" | jq -r '.[] | "   \(if .conclusion == "success" then "✅" elif .conclusion == "failure" then "❌" elif .conclusion == "skipped" then "⏭️" else "🔄" end) \(.name) (\(.conclusion // "running"))"'
    echo ""

    if [[ "$FAILED_COUNT" -eq 0 ]]; then
      # No failures but conclusion wasn't success - might be cancelled or skipped
      echo "⚠️ No failed jobs but conclusion was: $RUN_CONCLUSION"
      if [[ "$RUN_CONCLUSION" == "cancelled" ]]; then
        echo "   Workflow was cancelled. Triggering re-run..."
        gh run rerun "$RUN_ID" --repo "$GITHUB_REPO" 2>/dev/null || true
      fi
      CICD_ITERATION=$((CICD_ITERATION + 1))
      continue
    fi

    echo "❌ Found $FAILED_COUNT failed job(s). Fetching logs..."
    echo ""

    # Fetch error logs from failed jobs
    LOG_DIR=$(mktemp -d)
    ALL_ERRORS_FILE="$LOG_DIR/all_errors.txt"
    touch "$ALL_ERRORS_FILE"

    echo "$FAILED_JOBS" | jq -c '.[]' | while read -r job; do
      JOB_NAME=$(echo "$job" | jq -r '.name')
      JOB_ID=$(echo "$job" | jq -r '.databaseId')

      echo "📥 Fetching logs for: $JOB_NAME..."
      gh run view "$RUN_ID" --repo "$GITHUB_REPO" --log --job "$JOB_ID" > "$LOG_DIR/job_${JOB_ID}.log" 2>/dev/null || true

      if [[ -f "$LOG_DIR/job_${JOB_ID}.log" ]]; then
        grep -iE "error:|Error:|ERROR|failed|Failed|FAILED|exception" "$LOG_DIR/job_${JOB_ID}.log" >> "$ALL_ERRORS_FILE" 2>/dev/null || true
      fi
    done

    # Parse new errors and identify additional fixes
    NEW_ERRORS=$(sort -u "$ALL_ERRORS_FILE" | grep -v '^$' | head -20)
    NEW_ERROR_COUNT=$(echo "$NEW_ERRORS" | wc -l | tr -d ' ')

    echo ""
    echo "🔍 Found $NEW_ERROR_COUNT new error patterns"
    echo ""

    if [[ "$NEW_ERROR_COUNT" -gt 0 ]]; then
      echo "🔧 Analyzing errors and applying additional fixes..."
      echo ""

      # Re-run the fix classification and application (Step 6-8)
      # This will be done by returning to the worktree and applying fixes

      if [[ -d "$WORK_DIR" ]]; then
        cd "$WORK_DIR"

        # Apply additional fixes based on new errors
        # (The agent should analyze $NEW_ERRORS and apply appropriate fixes)

        # Check for common patterns
        if echo "$NEW_ERRORS" | grep -qiE "metadata|schema|subtask|subject_labels"; then
          echo "   🔧 Applying additional metadata fixes..."
          # Re-run metadata sanitization
          if [[ -f "metadata.json" ]]; then
            bash "$PROJECT_ROOT/.claude/scripts/localstack-sanitize-metadata.sh" 2>/dev/null || true
          fi
        fi

        if echo "$NEW_ERRORS" | grep -qiE "lint|eslint|prettier"; then
          echo "   🔧 Running lint fix..."
          npm run lint:fix 2>/dev/null || npm run lint -- --fix 2>/dev/null || true
        fi

        if echo "$NEW_ERRORS" | grep -qiE "test|jest|assertion"; then
          echo "   🔧 Checking test configuration..."
          # Additional test fixes can be added here
        fi

        # Commit and push if there are changes
        if ! git diff --quiet || ! git diff --cached --quiet; then
          git add -A
          git commit -m "fix(localstack): iteration ${CICD_ITERATION} fixes for PR #${PR_NUMBER}

Applied additional fixes based on CI/CD failure analysis.

Iteration: ${CICD_ITERATION}/${MAX_CICD_ITERATIONS}
Errors found: ${NEW_ERROR_COUNT}

Automated by localstack-fixer agent."

          echo "📤 Pushing iteration ${CICD_ITERATION} fixes..."
          git push origin "$PR_BRANCH"
          echo "✅ Pushed fixes for iteration ${CICD_ITERATION}"
        else
          echo "ℹ️ No additional changes to commit"
        fi

        cd "$PROJECT_ROOT"
      fi
    fi

    # Cleanup temp directory
    rm -rf "$LOG_DIR"

    CICD_ITERATION=$((CICD_ITERATION + 1))
  done

  # Final status
  echo ""
  echo "═══════════════════════════════════════════════════"
  if [ "$PRODUCTION_READY" == "true" ]; then
    echo "✅ PRODUCTION READY - All CI/CD jobs passing!"
    echo ""
    echo "   PR #${PR_NUMBER} is ready for merge"
    echo "   URL: https://github.com/$GITHUB_REPO/pull/$PR_NUMBER"
  else
    echo "⚠️ MAX ITERATIONS REACHED (${MAX_CICD_ITERATIONS})"
    echo ""
    echo "   The agent has reached the maximum number of fix iterations."
    echo "   Manual intervention may be required."
    echo ""
    echo "   PR URL: https://github.com/$GITHUB_REPO/pull/$PR_NUMBER"
    echo ""
    echo "   📋 Recommended Actions:"
    echo "   1. Review the latest CI/CD logs manually"
    echo "   2. Check for issues not covered by automated fixes"
    echo "   3. Re-run /localstack-fixer $PR_NUMBER after manual fixes"

  fi
  echo "═══════════════════════════════════════════════════"
fi
```

### Step 11: Cleanup and Summary

```bash
# ═══════════════════════════════════════════════════════════════
# LOCAL MODE: Don't cleanup - localstack-migrate manages worktree
# PR MODE: Cleanup worktree and return to project root
# ═══════════════════════════════════════════════════════════════

if [[ "$MODE" == "pr" ]]; then
  # Return to project root
  cd "$PROJECT_ROOT"

  # Cleanup worktree (only in PR mode)
  if [[ -d "$WORK_DIR" ]] && [[ "$WORK_DIR" == worktree/fixer-* ]]; then
    echo "🧹 Cleaning up worktree..."
    git worktree remove "$WORK_DIR" --force 2>/dev/null || rm -rf "$WORK_DIR"
  fi

  # Prune orphaned worktrees
  git worktree prune 2>/dev/null || true
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "📊 FIX SUMMARY"
echo "═══════════════════════════════════════════════════"
echo ""
echo "   Mode:            ${MODE^^}"

if [[ "$MODE" == "pr" ]]; then
  echo "   PR:              #${PR_NUMBER}"
  echo "   Branch:          ${PR_BRANCH:-N/A}"
  echo "   Failed Jobs:     ${FAILED_COUNT:-0}"
fi

if [[ "$MODE" == "local" ]]; then
  echo "   Work Dir:        ${WORK_DIR}"
  echo "   Platform:        ${PLATFORM:-unknown}"
  echo "   Language:        ${LANGUAGE:-unknown}"
fi

echo "   Errors Found:    ${ERROR_COUNT:-0}"
echo "   Fixes Applied:   ${#APPLIED_FIXES[@]}"
echo ""
echo "   Applied Fixes:"
for fix in "${APPLIED_FIXES[@]}"; do
  echo "   ✅ $fix"
done
echo ""

# Set output variables for localstack-migrate to use
if [[ "$MODE" == "local" ]]; then
  export FIX_SUCCESS=true
  export FIXES_APPLIED="${APPLIED_FIXES[*]}"
  export ITERATIONS_USED=1
fi

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
- `subtask` - **SINGLE STRING enum** (see below) - NOT an array!
- `provider` - enum: aws, localstack
- `subject_labels` - array of enums (see below)
- `aws_services` - array of strings

### 🔴 CRITICAL: `subtask` vs `subject_labels` Type Enforcement

**The `subtask` field is a SINGLE STRING, not an array!**

```yaml
# ❌ WRONG - subtask as array (5-6 values)
subtask: ["Security", "Compliance", "Governance", "Access Control", "IAM"]

# ❌ WRONG - multiple subtasks
subtask: ["Provisioning of Infrastructure Environments", "Application Deployment"]

# ✅ CORRECT - subtask as single string
subtask: "Security, Compliance, and Governance"
```

**Validation before committing:**

```bash
# Check that subtask is a string, not an array
SUBTASK_TYPE=$(jq -r 'type' <<< "$(jq '.subtask' metadata.json)")
if [[ "$SUBTASK_TYPE" != "string" ]]; then
  echo "❌ ERROR: subtask must be a single string, not $SUBTASK_TYPE"

  # Fix: Extract first element if it's an array
  if [[ "$SUBTASK_TYPE" == "array" ]]; then
    FIRST_SUBTASK=$(jq -r '.subtask[0] // "Infrastructure QA and Management"' metadata.json)
    jq --arg s "$FIRST_SUBTASK" '.subtask = $s' metadata.json > metadata.json.tmp
    mv metadata.json.tmp metadata.json
    echo "✅ Fixed: Set subtask to first value: $FIRST_SUBTASK"
  fi
fi
```

### Valid `subtask` Values (ONLY ONE of these)

```
- "Provisioning of Infrastructure Environments"
- "Application Deployment"
- "CI/CD Pipeline Integration"
- "Failure Recovery and High Availability"
- "Security, Compliance, and Governance"
- "IaC Program Optimization"
- "Infrastructure QA and Management"
```

**NEVER set subtask to multiple values. Pick exactly ONE.**

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

## PR Labels (Required)

When creating PRs for LocalStack migrations, the following labels MUST be added:

| Label       | Purpose                                           |
| ----------- | ------------------------------------------------- |
| `synth-2`   | Identifies PRs created by the synth-2 team/process |
| `localstack` | Identifies PRs for LocalStack-compatible tasks    |

These labels are automatically added by the `localstack-create-pr.sh` script when creating PRs via `/localstack-migrate`.

**Manual PR creation** (if needed):
```bash
gh pr create \
  --title "[LocalStack] ls-Pr7179 - cdk/ts" \
  --body "LocalStack migration" \
  --label "synth-2" \
  --label "localstack"
```

## Related Commands

- `/localstack-migrate` - Full migration from archive to PR (automatically adds `synth-2` and `localstack` labels)
- `/localstack-deploy-tester` - Test deployment to LocalStack
