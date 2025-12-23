---
name: localstack-batch-fix
description: Batch fix multiple LocalStack PRs in parallel (up to 20 concurrent agents) with caching and template application
color: purple
model: sonnet
---

# LocalStack Batch Fix Command

Process and fix multiple LocalStack PRs in parallel with optimized caching, template application, and comprehensive error fixing. Designed for **up to 20 concurrent agents** for maximum throughput.

## Features

- **20 Concurrent Agents**: Process up to 20 PRs simultaneously
- **Dependency Caching**: Shared NPM cache for fast installs
- **Fix Templates**: Auto-apply platform-specific templates
- **Batch Fix Strategy**: Apply ALL fixes preventively before deployment
- **Progress Tracking**: Real-time status and reporting
- **Resource Management**: Automatic memory/CPU monitoring

## Usage

```bash
# Fix up to 20 PRs in parallel
/localstack-batch-fix 7179 7180 7181 7182 7183 7184 7185 7186 7187 7188 7189 7190 7191 7192 7193 7194 7195 7196 7197 7198

# Fix PRs from a file (one PR per line)
/localstack-batch-fix --from-file prs.txt

# Fix with custom concurrency
/localstack-batch-fix -j 10 PR1 PR2 PR3 ...

# Show current batch status
/localstack-batch-fix --status

# Re-process only failed PRs
/localstack-batch-fix --failed-only

# Wait for CI/CD after each fix
/localstack-batch-fix --wait-cicd PR1 PR2 ...
```

## Pre-Requisites

Before running batch fixes, ensure LocalStack is warmed up:

```bash
# Run the warmup script (recommended before batch fixes)
.claude/scripts/localstack-watchdog.sh warmup
```

## Workflow

### Step 1: Initialize Environment

```bash
#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LocalStack Batch Fix - Main Workflow
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

cd "$PROJECT_ROOT"

# Parse command arguments
PRS=()
MAX_CONCURRENT=20
FROM_FILE=""
SHOW_STATUS=false
FAILED_ONLY=false
WAIT_CICD=false

for arg in "$@"; do
  case "$arg" in
    --status|-s)
      SHOW_STATUS=true
      ;;
    --failed-only)
      FAILED_ONLY=true
      ;;
    --from-file|-f)
      shift
      FROM_FILE="$1"
      ;;
    --wait-cicd)
      WAIT_CICD=true
      ;;
    -j)
      shift
      MAX_CONCURRENT="$1"
      ;;
    *)
      # Parse PR number
      PR="${arg#Pr}"
      PR="${PR#\#}"
      if [[ "$PR" =~ ^[0-9]+$ ]]; then
        PRS+=("$PR")
      fi
      ;;
  esac
done

# Read from file if specified
if [[ -n "$FROM_FILE" ]] && [[ -f "$FROM_FILE" ]]; then
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    [[ "$line" == \#* ]] && continue
    PR="${line#Pr}"
    PR="${PR#\#}"
    if [[ "$PR" =~ ^[0-9]+$ ]]; then
      PRS+=("$PR")
    fi
  done < "$FROM_FILE"
fi

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "🚀 LOCALSTACK BATCH FIX (UP TO 20 CONCURRENT AGENTS)"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "PRs to process: ${#PRS[@]}"
echo "Max concurrent: $MAX_CONCURRENT"
echo ""
```

### Step 2: Warmup LocalStack and Caches

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Warmup LocalStack and dependency caches
# ═══════════════════════════════════════════════════════════════════════════════

echo "🔥 Warming up LocalStack and caches..."

WATCHDOG_SCRIPT="$PROJECT_ROOT/.claude/scripts/localstack-watchdog.sh"
CACHE_MANAGER="$PROJECT_ROOT/.claude/scripts/localstack-cache-manager.sh"

# Start LocalStack if not running
if [[ -x "$WATCHDOG_SCRIPT" ]]; then
  if ! "$WATCHDOG_SCRIPT" health 2>/dev/null; then
    echo "   Starting LocalStack..."
    "$WATCHDOG_SCRIPT" start
  fi
  
  # Run warmup for 20 agents
  "$WATCHDOG_SCRIPT" warmup 2>&1 | tail -20
fi

# Setup dependency caching
if [[ -x "$CACHE_MANAGER" ]]; then
  source "$CACHE_MANAGER"
  setup_npm_cache_env
  setup_cdk_cache_env
fi

echo "✅ Environment ready for 20 concurrent agents"
echo ""
```

### Step 3: Execute Batch Fix Script

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Execute batch fix with all PRs
# ═══════════════════════════════════════════════════════════════════════════════

BATCH_FIX_SCRIPT="$PROJECT_ROOT/.claude/scripts/localstack-batch-fix.sh"

if [[ ${#PRS[@]} -eq 0 ]]; then
  echo "❌ No PRs specified"
  echo ""
  echo "Usage: /localstack-batch-fix PR1 PR2 PR3 ..."
  echo "       /localstack-batch-fix --from-file prs.txt"
  exit 1
fi

# Limit to 20 PRs max per batch for safety
if [[ ${#PRS[@]} -gt 20 ]]; then
  echo "⚠️ More than 20 PRs specified - processing first 20"
  PRS=("${PRS[@]:0:20}")
fi

# Build command
CMD="$BATCH_FIX_SCRIPT -j $MAX_CONCURRENT"
[[ "$WAIT_CICD" == "true" ]] && CMD="$CMD --wait-cicd"

for pr in "${PRS[@]}"; do
  CMD="$CMD $pr"
done

echo "Executing: $CMD"
echo ""

# Run the batch fix
eval "$CMD"
```

### Step 4: Summary and Next Steps

After the batch fix completes, review the results:

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Summary and next steps
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "📊 BATCH FIX COMPLETE"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Show status
"$BATCH_FIX_SCRIPT" --status 2>/dev/null || true

echo ""
echo "💡 Next Steps:"
echo "   1. Review PR status: gh pr list --repo TuringGpt/iac-test-automations --state open"
echo "   2. Re-run failed PRs: /localstack-batch-fix --failed-only"
echo "   3. Check CI/CD status on GitHub"
echo ""
```

## Configuration

This command uses settings from `.claude/config/localstack.yaml`:

```yaml
parallel:
  enabled: true
  max_concurrent_agents: 20  # Maximum parallel agents
  use_git_worktrees: true    # Use git worktrees for isolation
  use_file_locking: true     # Lock migration log for concurrent writes

batch_fix:
  enabled: true
  apply_preventive_fixes: true    # Apply fixes even without specific errors
  single_comprehensive_push: true # Apply ALL fixes in single commit
```

## What Gets Fixed

Each PR goes through these automated fixes:

### 1. Metadata Fixes (Always Applied)
- Schema compliance for CI/CD
- Remove disallowed fields
- Fix subtask values
- Set provider to "localstack"
- Set team to "synth-2"

### 2. TypeScript Fixes
- Compile with `tsc --noEmit`
- Fix type errors
- Update imports

### 3. Lint Fixes
- Run `npm run lint:fix`
- Auto-format code

### 4. LocalStack Template Fixes
- Endpoint configuration
- S3 path-style access
- RemovalPolicy.DESTROY
- Test endpoint configuration

### 5. Jest Configuration
- Fix roots directory (test vs tests)
- Add coverage configuration

## Monitoring

### Real-Time Dashboard

```bash
# Watch batch progress
.claude/scripts/localstack-dashboard.sh

# One-time status check
.claude/scripts/localstack-batch-fix.sh --status
```

### Log Files

Logs are stored in `.claude/reports/batch-fix-logs/`:
- `pr-{number}.log` - Individual PR logs
- `batch-status.json` - Current batch status
- `batch-results-{timestamp}.json` - Final results

## Troubleshooting

### Common Issues

**"LocalStack not running"**
```bash
.claude/scripts/localstack-watchdog.sh start
```

**"Too many concurrent agents"**
```bash
# Reduce concurrency
/localstack-batch-fix -j 10 PR1 PR2 ...
```

**"Git worktree conflicts"**
```bash
git worktree prune
rm -rf worktree/batch-fix-*
```

**"NPM install slow"**
```bash
# Warm the cache first
.claude/scripts/localstack-cache-manager.sh warm
```

### Re-Running Failed PRs

```bash
# Show which PRs failed
.claude/scripts/localstack-batch-fix.sh --status

# Re-run only failed ones
/localstack-batch-fix --failed-only
```

## Performance Tips

1. **Run warmup first**: `./localstack-watchdog.sh warmup`
2. **Use cached installs**: Cache is shared across all agents
3. **Skip CI/CD wait**: Remove `--wait-cicd` for faster throughput
4. **Monitor resources**: Check CPU/memory with `./localstack-watchdog.sh status`

## Related Commands

- `/localstack-migrate` - Migrate individual tasks
- `/localstack-fix` - Fix individual PRs
- `localstack-watchdog.sh` - Manage LocalStack daemon
- `localstack-cache-manager.sh` - Manage dependency caches

## Example: Process 20 PRs

```bash
# Start fresh with warmup
.claude/scripts/localstack-watchdog.sh warmup

# Process 20 PRs in parallel
/localstack-batch-fix 7179 7180 7181 7182 7183 7184 7185 7186 7187 7188 7189 7190 7191 7192 7193 7194 7195 7196 7197 7198

# Check results
.claude/scripts/localstack-batch-fix.sh --status

# Re-run any failures
/localstack-batch-fix --failed-only
```

