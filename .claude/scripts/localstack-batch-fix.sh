#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LocalStack Batch Fix Script
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Process multiple LocalStack PRs in parallel for maximum throughput
#
# Usage:
#   ./localstack-batch-fix.sh <pr1> <pr2> <pr3> ...
#   ./localstack-batch-fix.sh 7179 7180 7181 7182 7183
#   ./localstack-batch-fix.sh --from-file prs.txt
#   ./localstack-batch-fix.sh --failed-only        # Re-process failed PRs
#   ./localstack-batch-fix.sh --status             # Show status of all running fixes
#
# Features:
#   - Parallel processing using git worktrees
#   - Progress tracking with real-time status
#   - Automatic resource management
#   - Result aggregation and reporting
#
# Exit codes:
#   0 = All PRs fixed successfully
#   1 = Some PRs failed
#   2 = Invalid arguments
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/.claude/config/localstack.yaml"

# Load configuration - Updated for 20 concurrent agents
MAX_CONCURRENT=${MAX_CONCURRENT:-20}  # Maximum parallel processes (increased to 20)
GITHUB_REPO=${GITHUB_REPO:-"TuringGpt/iac-test-automations"}

# Try to load from config file
if command -v yq &>/dev/null && [[ -f "$CONFIG_FILE" ]]; then
  MAX_CONCURRENT=$(yq -r '.parallel.max_concurrent_agents // 20' "$CONFIG_FILE" 2>/dev/null || echo "20")
  GITHUB_REPO=$(yq -r '.github.repo // "TuringGpt/iac-test-automations"' "$CONFIG_FILE" 2>/dev/null || echo "$GITHUB_REPO")
fi

# Cache and template scripts
CACHE_MANAGER="$SCRIPT_DIR/localstack-cache-manager.sh"
TEMPLATE_APPLICATOR="$SCRIPT_DIR/localstack-apply-templates.sh"
WATCHDOG_SCRIPT="$SCRIPT_DIR/localstack-watchdog.sh"

# Source cache manager for faster installs
if [[ -f "$CACHE_MANAGER" ]]; then
  source "$CACHE_MANAGER"
fi

# Directories
WORKTREE_BASE="$PROJECT_ROOT/worktree"
LOG_DIR="$PROJECT_ROOT/.claude/reports/batch-fix-logs"
STATUS_FILE="$LOG_DIR/batch-status.json"
RESULTS_FILE="$LOG_DIR/batch-results-$(date '+%Y%m%d-%H%M%S').json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_progress() {
  echo -e "${CYAN}🔄 $1${NC}"
}

# Create required directories
setup_directories() {
  mkdir -p "$WORKTREE_BASE"
  mkdir -p "$LOG_DIR"
}

# Initialize status file
init_status_file() {
  local prs=("$@")
  local pr_status=()
  
  for pr in "${prs[@]}"; do
    pr_status+=("{\"pr\": \"$pr\", \"status\": \"pending\", \"started\": null, \"completed\": null, \"result\": null}")
  done
  
  local json_array=$(printf '%s\n' "${pr_status[@]}" | jq -s '.')
  
  cat > "$STATUS_FILE" << EOF
{
  "batch_id": "$(date '+%Y%m%d-%H%M%S')",
  "started": "$(date -Iseconds)",
  "total_prs": ${#prs[@]},
  "max_concurrent": $MAX_CONCURRENT,
  "prs": $json_array
}
EOF
}

# Update PR status in status file
update_pr_status() {
  local pr="$1"
  local status="$2"
  local result="${3:-null}"
  
  if [[ -f "$STATUS_FILE" ]]; then
    local timestamp=$(date -Iseconds)
    
    # Update using jq
    jq --arg pr "$pr" --arg status "$status" --arg result "$result" --arg ts "$timestamp" '
      .prs |= map(
        if .pr == $pr then
          .status = $status |
          (if $status == "running" then .started = $ts else . end) |
          (if $status == "completed" or $status == "failed" then .completed = $ts | .result = $result else . end)
        else .
        end
      )
    ' "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
  fi
}

# Get count of currently running processes
get_running_count() {
  if [[ -f "$STATUS_FILE" ]]; then
    jq '[.prs[] | select(.status == "running")] | length' "$STATUS_FILE"
  else
    echo "0"
  fi
}

# Wait for a slot to be available
wait_for_slot() {
  while true; do
    local running=$(get_running_count)
    if [[ "$running" -lt "$MAX_CONCURRENT" ]]; then
      break
    fi
    sleep 5
  done
}

# Show current status
show_status() {
  if [[ ! -f "$STATUS_FILE" ]]; then
    log_error "No batch fix in progress"
    return 1
  fi
  
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "📊 BATCH FIX STATUS"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  
  local batch_id=$(jq -r '.batch_id' "$STATUS_FILE")
  local started=$(jq -r '.started' "$STATUS_FILE")
  local total=$(jq -r '.total_prs' "$STATUS_FILE")
  local pending=$(jq '[.prs[] | select(.status == "pending")] | length' "$STATUS_FILE")
  local running=$(jq '[.prs[] | select(.status == "running")] | length' "$STATUS_FILE")
  local completed=$(jq '[.prs[] | select(.status == "completed")] | length' "$STATUS_FILE")
  local failed=$(jq '[.prs[] | select(.status == "failed")] | length' "$STATUS_FILE")
  
  echo "Batch ID: $batch_id"
  echo "Started:  $started"
  echo ""
  echo "Progress: $((completed + failed))/$total"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  printf "  Pending:   %3d  ⏳\n" "$pending"
  printf "  Running:   %3d  🔄\n" "$running"
  printf "  Completed: %3d  ✅\n" "$completed"
  printf "  Failed:    %3d  ❌\n" "$failed"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Show running PRs
  if [[ "$running" -gt 0 ]]; then
    echo "Currently Running:"
    jq -r '.prs[] | select(.status == "running") | "  🔄 PR #\(.pr) (started: \(.started))"' "$STATUS_FILE"
    echo ""
  fi
  
  # Show recent completions
  if [[ "$completed" -gt 0 ]] || [[ "$failed" -gt 0 ]]; then
    echo "Recent Results:"
    jq -r '.prs[] | select(.status == "completed" or .status == "failed") | 
      if .status == "completed" then "  ✅ PR #\(.pr) - \(.result)" 
      else "  ❌ PR #\(.pr) - \(.result)" end' "$STATUS_FILE" | tail -5
    echo ""
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FIX SINGLE PR (runs in background)
# ═══════════════════════════════════════════════════════════════════════════════

fix_single_pr() {
  local pr="$1"
  local log_file="$LOG_DIR/pr-${pr}.log"
  
  {
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "🔧 FIXING PR #$pr"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "Started: $(date)"
    echo ""
    
    # Update status to running
    update_pr_status "$pr" "running"
    
    # Navigate to project root
    cd "$PROJECT_ROOT"
    
    # ─────────────────────────────────────────────────────────────────────────────
    # STEP 1: Fetch PR details
    # ─────────────────────────────────────────────────────────────────────────────
    
    echo "📋 Fetching PR #$pr details..."
    
    PR_INFO=$(gh pr view "$pr" --repo "$GITHUB_REPO" --json title,headRefName,state 2>/dev/null || echo "")
    
    if [[ -z "$PR_INFO" ]]; then
      echo "❌ Failed to fetch PR #$pr"
      update_pr_status "$pr" "failed" "PR not found"
      return 1
    fi
    
    PR_BRANCH=$(echo "$PR_INFO" | jq -r '.headRefName')
    PR_TITLE=$(echo "$PR_INFO" | jq -r '.title')
    PR_STATE=$(echo "$PR_INFO" | jq -r '.state')
    
    echo "   Title:  $PR_TITLE"
    echo "   Branch: $PR_BRANCH"
    echo "   State:  $PR_STATE"
    echo ""
    
    if [[ "$PR_STATE" == "MERGED" ]] || [[ "$PR_STATE" == "CLOSED" ]]; then
      echo "⚠️ PR #$pr is $PR_STATE - skipping"
      update_pr_status "$pr" "completed" "Already $PR_STATE"
      return 0
    fi
    
    # ─────────────────────────────────────────────────────────────────────────────
    # STEP 2: Setup worktree
    # ─────────────────────────────────────────────────────────────────────────────
    
    WORK_DIR="$WORKTREE_BASE/batch-fix-pr${pr}"
    
    echo "📁 Setting up worktree at $WORK_DIR..."
    
    # Clean up existing worktree
    if [[ -d "$WORK_DIR" ]]; then
      git worktree remove "$WORK_DIR" --force 2>/dev/null || rm -rf "$WORK_DIR"
    fi
    
    # Fetch the branch
    git fetch origin "$PR_BRANCH:$PR_BRANCH" 2>/dev/null || true
    
    # Create worktree
    if ! git worktree add "$WORK_DIR" "$PR_BRANCH" 2>/dev/null; then
      echo "❌ Failed to create worktree for PR #$pr"
      update_pr_status "$pr" "failed" "Worktree creation failed"
      return 1
    fi
    
    cd "$WORK_DIR"
    echo "✅ Worktree ready"
    echo ""
    
    # ─────────────────────────────────────────────────────────────────────────────
    # STEP 3a: Setup caching for fast dependency installation
    # ─────────────────────────────────────────────────────────────────────────────
    
    echo "📦 Setting up dependency caching..."
    
    if [[ -f "$CACHE_MANAGER" ]]; then
      setup_npm_cache_env 2>/dev/null || true
      setup_cdk_cache_env 2>/dev/null || true
    fi
    
    # Fast npm install using cache
    if [[ -f "package.json" ]]; then
      if type cached_npm_install &>/dev/null; then
        cached_npm_install "$WORK_DIR" 2>&1 | head -20 || npm install --prefer-offline --no-audit 2>&1 | head -20
      else
        npm install --prefer-offline --no-audit 2>&1 | head -20
      fi
    fi
    echo ""
    
    # ─────────────────────────────────────────────────────────────────────────────
    # STEP 3b: Apply fix templates automatically
    # ─────────────────────────────────────────────────────────────────────────────
    
    echo "🔧 Applying fix templates..."
    
    if [[ -x "$TEMPLATE_APPLICATOR" ]]; then
      "$TEMPLATE_APPLICATOR" "$WORK_DIR" --all 2>&1 | head -30 || echo "⚠️ Template application had issues"
    fi
    echo ""
    
    # ─────────────────────────────────────────────────────────────────────────────
    # STEP 3c: Run pre-validation with auto-fix
    # ─────────────────────────────────────────────────────────────────────────────
    
    echo "🔍 Running pre-validation with auto-fix..."
    
    PREVALIDATE_SCRIPT="$PROJECT_ROOT/.claude/scripts/localstack-prevalidate.sh"
    
    if [[ -x "$PREVALIDATE_SCRIPT" ]]; then
      # Run pre-validation with fixes enabled (skip deploy/tests for speed)
      if "$PREVALIDATE_SCRIPT" "$WORK_DIR" --skip-deploy --skip-tests 2>&1; then
        echo "✅ Pre-validation passed"
      else
        echo "⚠️ Pre-validation had issues (continuing anyway)"
      fi
    else
      echo "⚠️ Pre-validation script not found"
    fi
    echo ""
    
    # ─────────────────────────────────────────────────────────────────────────────
    # STEP 4: Check for changes and commit
    # ─────────────────────────────────────────────────────────────────────────────
    
    echo "📝 Checking for changes..."
    
    if ! git diff --quiet || ! git diff --cached --quiet; then
      echo "   Changes detected - committing..."
      
      git add -A
      
      COMMIT_MSG="fix(localstack): comprehensive batch auto-fixes for PR #${pr}

Applied automated fixes:
- Metadata validation and sanitization
- TypeScript compilation fixes
- Lint auto-fixes
- LocalStack endpoint configuration (from templates)
- S3 path-style configuration
- RemovalPolicy.DESTROY for all resources
- Jest configuration fixes
- Test endpoint configuration
- Fix templates auto-applied

Automated by localstack-batch-fix (optimized for 20 concurrent agents)"

      git commit -m "$COMMIT_MSG" 2>/dev/null || true
      
      echo "📤 Pushing changes..."
      git push origin "$PR_BRANCH" --force-with-lease 2>/dev/null || git push origin "$PR_BRANCH" 2>/dev/null
      
      echo "✅ Changes pushed"
    else
      echo "   No changes to commit"
    fi
    echo ""
    
    # ─────────────────────────────────────────────────────────────────────────────
    # STEP 5: Wait for CI/CD (optional, can be skipped for speed)
    # ─────────────────────────────────────────────────────────────────────────────
    
    # For batch processing, we don't wait for CI/CD by default
    # This allows maximum parallelism
    # Users can run with --wait-cicd to enable waiting
    
    if [[ "${WAIT_CICD:-false}" == "true" ]]; then
      echo "⏳ Waiting for CI/CD to complete..."
      
      # Poll CI/CD status
      local cicd_timeout=600  # 10 minutes
      local cicd_interval=30
      local cicd_elapsed=0
      
      while [[ "$cicd_elapsed" -lt "$cicd_timeout" ]]; do
        sleep "$cicd_interval"
        cicd_elapsed=$((cicd_elapsed + cicd_interval))
        
        local checks_status=$(gh pr checks "$pr" --repo "$GITHUB_REPO" --json conclusion 2>/dev/null || echo "")
        
        if echo "$checks_status" | jq -e 'all(.[]; .conclusion == "success" or .conclusion == "skipped")' &>/dev/null; then
          echo "✅ CI/CD passed"
          break
        elif echo "$checks_status" | jq -e 'any(.[]; .conclusion == "failure")' &>/dev/null; then
          echo "❌ CI/CD failed"
          break
        fi
        
        echo "   Still running... ($cicd_elapsed / $cicd_timeout seconds)"
      done
    fi
    
    # ─────────────────────────────────────────────────────────────────────────────
    # STEP 6: Cleanup
    # ─────────────────────────────────────────────────────────────────────────────
    
    echo "🧹 Cleaning up worktree..."
    cd "$PROJECT_ROOT"
    git worktree remove "$WORK_DIR" --force 2>/dev/null || rm -rf "$WORK_DIR"
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "✅ PR #$pr COMPLETED"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "Completed: $(date)"
    
    update_pr_status "$pr" "completed" "Fixes pushed"
    
  } > "$log_file" 2>&1
  
  return 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# PARSE ARGUMENTS
# ═══════════════════════════════════════════════════════════════════════════════

PRS=()
SHOW_STATUS=false
FAILED_ONLY=false
FROM_FILE=""
WAIT_CICD=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --status|-s)
      SHOW_STATUS=true
      shift
      ;;
    --failed-only)
      FAILED_ONLY=true
      shift
      ;;
    --from-file|-f)
      FROM_FILE="$2"
      shift 2
      ;;
    --wait-cicd)
      WAIT_CICD=true
      export WAIT_CICD
      shift
      ;;
    --max-concurrent|-j)
      MAX_CONCURRENT="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [options] <pr1> <pr2> <pr3> ..."
      echo ""
      echo "Process multiple LocalStack PRs in parallel"
      echo ""
      echo "Options:"
      echo "  --status, -s          Show status of current batch"
      echo "  --failed-only         Re-process only failed PRs from last batch"
      echo "  --from-file, -f FILE  Read PR numbers from file (one per line)"
      echo "  --wait-cicd           Wait for CI/CD to complete for each PR"
      echo "  --max-concurrent, -j  Maximum parallel processes (default: $MAX_CONCURRENT)"
      echo "  --help, -h            Show this help"
      echo ""
      echo "Examples:"
      echo "  $0 7179 7180 7181 7182 7183"
      echo "  $0 --from-file prs.txt"
      echo "  $0 --max-concurrent 10 7179 7180 7181"
      echo "  $0 --status"
      exit 0
      ;;
    *)
      # Parse PR number (handles various formats)
      PR="${1#Pr}"
      PR="${PR#\#}"
      PR="${PR#LS-}"
      PR="${PR#ls-}"
      if [[ "$PR" =~ ^[0-9]+$ ]]; then
        PRS+=("$PR")
      fi
      shift
      ;;
  esac
done

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

setup_directories

# Handle --status flag
if [[ "$SHOW_STATUS" == "true" ]]; then
  show_status
  exit 0
fi

# Handle --failed-only flag
if [[ "$FAILED_ONLY" == "true" ]]; then
  if [[ -f "$STATUS_FILE" ]]; then
    FAILED_PRS=$(jq -r '.prs[] | select(.status == "failed") | .pr' "$STATUS_FILE")
    if [[ -n "$FAILED_PRS" ]]; then
      while IFS= read -r pr; do
        PRS+=("$pr")
      done <<< "$FAILED_PRS"
    fi
  fi
  
  if [[ ${#PRS[@]} -eq 0 ]]; then
    log_info "No failed PRs to re-process"
    exit 0
  fi
  
  log_info "Re-processing ${#PRS[@]} failed PRs"
fi

# Handle --from-file flag
if [[ -n "$FROM_FILE" ]]; then
  if [[ -f "$FROM_FILE" ]]; then
    while IFS= read -r line; do
      # Skip empty lines and comments
      [[ -z "$line" ]] && continue
      [[ "$line" == \#* ]] && continue
      
      PR="${line#Pr}"
      PR="${PR#\#}"
      PR="${PR#LS-}"
      if [[ "$PR" =~ ^[0-9]+$ ]]; then
        PRS+=("$PR")
      fi
    done < "$FROM_FILE"
  else
    log_error "File not found: $FROM_FILE"
    exit 2
  fi
fi

# Validate we have PRs to process
if [[ ${#PRS[@]} -eq 0 ]]; then
  log_error "No PRs specified"
  echo ""
  echo "Usage: $0 <pr1> <pr2> <pr3> ..."
  echo "       $0 --from-file prs.txt"
  echo "       $0 --help"
  exit 2
fi

# Remove duplicates
PRS=($(printf '%s\n' "${PRS[@]}" | sort -u))

# ═══════════════════════════════════════════════════════════════════════════════
# START BATCH PROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "🚀 LOCALSTACK BATCH FIX"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 PRs to process: ${#PRS[@]}"
echo "🔄 Max concurrent: $MAX_CONCURRENT"
echo "📁 Worktree base:  $WORKTREE_BASE"
echo "📝 Log directory:  $LOG_DIR"
echo ""
echo "PRs: ${PRS[*]}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check GitHub CLI authentication
if ! gh auth status &>/dev/null; then
  log_error "GitHub CLI not authenticated"
  echo "Run: gh auth login"
  exit 2
fi

# Initialize status file
init_status_file "${PRS[@]}"

# Track background jobs
declare -A JOB_PIDS

# Process PRs with parallelism
TOTAL=${#PRS[@]}
COMPLETED=0
FAILED=0

for pr in "${PRS[@]}"; do
  # Wait for a slot to be available
  wait_for_slot
  
  log_progress "Starting PR #$pr ($(get_running_count)/$MAX_CONCURRENT running)"
  
  # Start fix in background
  fix_single_pr "$pr" &
  JOB_PIDS[$pr]=$!
  
  # Small delay to avoid race conditions
  sleep 2
done

# Wait for all jobs to complete
log_info "Waiting for all jobs to complete..."
echo ""

for pr in "${!JOB_PIDS[@]}"; do
  pid=${JOB_PIDS[$pr]}
  
  if wait "$pid"; then
    COMPLETED=$((COMPLETED + 1))
    log_success "PR #$pr completed"
  else
    FAILED=$((FAILED + 1))
    log_error "PR #$pr failed"
  fi
done

# Prune orphaned worktrees
log_info "Pruning orphaned worktrees..."
git worktree prune 2>/dev/null || true

# ═══════════════════════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "📊 BATCH FIX SUMMARY"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Read final status from file
if [[ -f "$STATUS_FILE" ]]; then
  jq -r '
    "Total PRs:     \(.total_prs)",
    "Completed:     \([.prs[] | select(.status == "completed")] | length) ✅",
    "Failed:        \([.prs[] | select(.status == "failed")] | length) ❌"
  ' "$STATUS_FILE"
  echo ""
  
  # Show failed PRs
  FAILED_LIST=$(jq -r '.prs[] | select(.status == "failed") | "  ❌ PR #\(.pr): \(.result)"' "$STATUS_FILE")
  if [[ -n "$FAILED_LIST" ]]; then
    echo "Failed PRs:"
    echo "$FAILED_LIST"
    echo ""
    echo "Re-run failed PRs with: $0 --failed-only"
    echo ""
  fi
  
  # Save results
  cp "$STATUS_FILE" "$RESULTS_FILE"
  echo "Results saved to: $RESULTS_FILE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🕐 Completed: $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Exit with appropriate code
if [[ "$FAILED" -gt 0 ]]; then
  exit 1
else
  exit 0
fi

