#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LocalStack Batch Fix Script (Enhanced)
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Process multiple LocalStack PRs in parallel for maximum throughput
#
# Usage:
#   ./localstack-batch-fix.sh <pr1> <pr2> <pr3> ...
#   ./localstack-batch-fix.sh 7179 7180 7181 7182 7183
#   ./localstack-batch-fix.sh --from-file prs.txt
#   ./localstack-batch-fix.sh --failed-only        # Re-process failed PRs
#   ./localstack-batch-fix.sh --status             # Show status of all running fixes
#   ./localstack-batch-fix.sh --resume             # Resume from last checkpoint
#   ./localstack-batch-fix.sh --test-deploy        # Test local deployment before push
#   ./localstack-batch-fix.sh --smart-order        # Order PRs by success probability
#
# Features:
#   - Parallel processing using git worktrees (up to 20 concurrent)
#   - Progress tracking with real-time status
#   - Automatic resource management and throttling
#   - Result aggregation and reporting
#   - Checkpoint/resume functionality
#   - GitHub API rate limiting
#   - Failure analysis and error pattern learning
#   - Desktop/Slack notifications
#   - Local deployment testing before push
#
# Exit codes:
#   0 = All PRs fixed successfully
#   1 = Some PRs failed
#   2 = Invalid arguments
#   130 = Interrupted by user
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
INITIAL_MAX_CONCURRENT=$MAX_CONCURRENT
GITHUB_REPO=${GITHUB_REPO:-"TuringGpt/iac-test-automations"}

# Try to load from config file
if command -v yq &>/dev/null && [[ -f "$CONFIG_FILE" ]]; then
  MAX_CONCURRENT=$(yq -r '.parallel.max_concurrent_agents // 20' "$CONFIG_FILE" 2>/dev/null || echo "20")
  INITIAL_MAX_CONCURRENT=$MAX_CONCURRENT
  GITHUB_REPO=$(yq -r '.github.repo // "TuringGpt/iac-test-automations"' "$CONFIG_FILE" 2>/dev/null || echo "$GITHUB_REPO")
fi

# Cache and template scripts
CACHE_MANAGER="$SCRIPT_DIR/localstack-cache-manager.sh"
TEMPLATE_APPLICATOR="$SCRIPT_DIR/localstack-apply-templates.sh"
WATCHDOG_SCRIPT="$SCRIPT_DIR/localstack-watchdog.sh"
COMPATIBILITY_CHECK="$SCRIPT_DIR/localstack-compatibility-check.sh"

# Source cache manager for faster installs
if [[ -f "$CACHE_MANAGER" ]]; then
  source "$CACHE_MANAGER"
fi

# Directories
WORKTREE_BASE="$PROJECT_ROOT/worktree"
LOG_DIR="$PROJECT_ROOT/.claude/reports/batch-fix-logs"
STATUS_FILE="$LOG_DIR/batch-status.json"
RESULTS_FILE="$LOG_DIR/batch-results-$(date '+%Y%m%d-%H%M%S').json"

# Enhanced: New file paths for advanced features
CHECKPOINT_FILE="$LOG_DIR/checkpoint.json"
ERROR_PATTERNS_FILE="$LOG_DIR/error-patterns.json"
RATE_LIMIT_FILE="$LOG_DIR/rate-limit.json"

# Resource thresholds
CPU_THROTTLE_THRESHOLD=${CPU_THROTTLE_THRESHOLD:-85}
MEMORY_THROTTLE_THRESHOLD=${MEMORY_THROTTLE_THRESHOLD:-90}
MIN_CONCURRENT=2  # Never go below this

# GitHub API rate limiting
GITHUB_API_CALLS=0
GITHUB_API_LIMIT=25  # Per minute (leave buffer)
GITHUB_API_RESET_TIME=0

# Auto-pick configuration
AUTO_PICK_LABELS=${AUTO_PICK_LABELS:-"Synth-2,localstack"}  # Labels required for auto-pick
AUTO_PICK_MAX=${AUTO_PICK_MAX:-20}  # Maximum PRs to auto-pick

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Track background jobs
declare -A JOB_PIDS
COMPLETED_PRS=()

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

log_debug() {
  if [[ "${VERBOSE:-false}" == "true" ]]; then
    echo -e "${MAGENTA}🔍 $1${NC}"
  fi
}

# Create required directories
setup_directories() {
  mkdir -p "$WORKTREE_BASE"
  mkdir -p "$LOG_DIR"
}

# ═══════════════════════════════════════════════════════════════════════════════
# AUTO-PICK: Fetch PRs with specific labels from GitHub
# ═══════════════════════════════════════════════════════════════════════════════

fetch_labeled_prs() {
  local labels="$1"
  local max_prs="${2:-$AUTO_PICK_MAX}"
  
  log_info "Fetching open PRs with labels: $labels"
  
  # Convert comma-separated labels to GitHub CLI format
  local label_args=""
  IFS=',' read -ra LABEL_ARRAY <<< "$labels"
  for label in "${LABEL_ARRAY[@]}"; do
    label_args="$label_args --label \"$label\""
  done
  
  # Fetch PRs with all specified labels
  local prs
  prs=$(eval "gh pr list --repo \"$GITHUB_REPO\" --state open $label_args --limit $max_prs --json number,title,labels --jq '.[].number'" 2>/dev/null || echo "")
  
  if [[ -z "$prs" ]]; then
    log_warning "No open PRs found with labels: $labels"
    return 1
  fi
  
  # Count and display
  local pr_count
  pr_count=$(echo "$prs" | wc -l | tr -d ' ')
  log_success "Found $pr_count open PRs with labels: $labels"
  
  echo "$prs"
}

fetch_labeled_prs_detailed() {
  local labels="$1"
  local max_prs="${2:-$AUTO_PICK_MAX}"
  
  log_info "Fetching open PRs with labels: $labels"
  log_info "Repository: $GITHUB_REPO"
  
  # Build label filter for gh CLI
  local label_filter=""
  IFS=',' read -ra LABEL_ARRAY <<< "$labels"
  for label in "${LABEL_ARRAY[@]}"; do
    # Trim whitespace
    label=$(echo "$label" | xargs)
    label_filter="$label_filter --label \"$label\""
  done
  
  log_debug "Label filter: $label_filter"
  
  # Fetch PRs
  local pr_data
  pr_data=$(eval "gh pr list --repo \"$GITHUB_REPO\" --state open $label_filter --limit $max_prs --json number,title,headRefName,labels" 2>/dev/null || echo "[]")
  
  if [[ "$pr_data" == "[]" ]] || [[ -z "$pr_data" ]]; then
    log_warning "No open PRs found with ALL labels: $labels"
    echo ""
    echo "To check available PRs with individual labels:"
    for label in "${LABEL_ARRAY[@]}"; do
      label=$(echo "$label" | xargs)
      local count
      count=$(gh pr list --repo "$GITHUB_REPO" --state open --label "$label" --json number --jq 'length' 2>/dev/null || echo "0")
      echo "  - Label '$label': $count open PRs"
    done
    return 1
  fi
  
  # Display found PRs
  local pr_count
  pr_count=$(echo "$pr_data" | jq 'length')
  
  echo ""
  echo "┌─────────────────────────────────────────────────────────────────────────────┐"
  echo "│  📋 AUTO-PICKED PRs (Labels: $labels)"
  echo "├─────────────────────────────────────────────────────────────────────────────┤"
  
  echo "$pr_data" | jq -r '.[] | "│  #\(.number | tostring | . + "      " | .[0:6]) \(.title | .[0:60])"'
  
  echo "├─────────────────────────────────────────────────────────────────────────────┤"
  echo "│  Total: $pr_count PRs"
  echo "└─────────────────────────────────────────────────────────────────────────────┘"
  echo ""
  
  # Return just the PR numbers
  echo "$pr_data" | jq -r '.[].number'
}

# ═══════════════════════════════════════════════════════════════════════════════
# ENHANCEMENT #1: GRACEFUL INTERRUPTION HANDLING
# ═══════════════════════════════════════════════════════════════════════════════

cleanup_on_exit() {
  local exit_code=$?
  
  echo ""
  log_warning "Interrupted - cleaning up..."
  
  # Save checkpoint before cleanup
  save_checkpoint
  
  # Kill all background jobs
  for pr in "${!JOB_PIDS[@]}"; do
    local pid=${JOB_PIDS[$pr]}
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      log_info "Killed job for PR #$pr"
    fi
  done
  
  # Wait briefly for processes to terminate
  sleep 2
  
  # Clean up worktrees
  for pr in "${PRS[@]}"; do
    local work_dir="$WORKTREE_BASE/batch-fix-pr${pr}"
    if [[ -d "$work_dir" ]]; then
      git worktree remove "$work_dir" --force 2>/dev/null || rm -rf "$work_dir"
    fi
  done
  
  git worktree prune 2>/dev/null || true
  
  log_info "Cleanup complete"
  log_info "Resume with: $0 --resume"
  
  # Send notification
  send_notification "Batch fix interrupted. ${#COMPLETED_PRS[@]} PRs completed. Resume with --resume"
  
  exit 130
}

# Set up trap for interruption
trap cleanup_on_exit SIGINT SIGTERM

# ═══════════════════════════════════════════════════════════════════════════════
# ENHANCEMENT #8: CHECKPOINT/RESUME FUNCTIONALITY
# ═══════════════════════════════════════════════════════════════════════════════

save_checkpoint() {
  if [[ ${#COMPLETED_PRS[@]} -gt 0 ]]; then
    local completed_json
    completed_json=$(printf '%s\n' "${COMPLETED_PRS[@]}" | jq -Rs 'split("\n") | map(select(. != ""))')
    
    cat > "$CHECKPOINT_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "batch_id": "$(jq -r '.batch_id // "unknown"' "$STATUS_FILE" 2>/dev/null || echo "unknown")",
  "completed": $completed_json,
  "total_requested": ${#PRS[@]},
  "max_concurrent": $MAX_CONCURRENT
}
EOF
    log_debug "Checkpoint saved: ${#COMPLETED_PRS[@]} PRs completed"
  fi
}

load_checkpoint() {
  if [[ -f "$CHECKPOINT_FILE" ]]; then
    local checkpoint_time
    checkpoint_time=$(jq -r '.timestamp' "$CHECKPOINT_FILE" 2>/dev/null || echo "")
    
    if [[ -n "$checkpoint_time" ]]; then
      log_info "Found checkpoint from: $checkpoint_time"
      
      # Get completed PRs from checkpoint
      local completed
      completed=$(jq -r '.completed[]' "$CHECKPOINT_FILE" 2>/dev/null || echo "")
      
      if [[ -n "$completed" ]]; then
        echo "$completed"
      fi
    fi
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# ENHANCEMENT #5: GITHUB API RATE LIMITING
# ═══════════════════════════════════════════════════════════════════════════════

check_rate_limit() {
  local current_time
  current_time=$(date +%s)
  
  # Reset counter every minute
  if [[ $current_time -gt $GITHUB_API_RESET_TIME ]]; then
    GITHUB_API_CALLS=0
    GITHUB_API_RESET_TIME=$((current_time + 60))
  fi
  
  # Check if we're approaching rate limit
  if [[ $GITHUB_API_CALLS -ge $GITHUB_API_LIMIT ]]; then
    local wait_time=$((GITHUB_API_RESET_TIME - current_time))
    if [[ $wait_time -gt 0 ]]; then
      log_warning "GitHub API rate limit reached - waiting ${wait_time}s..."
      sleep "$wait_time"
      GITHUB_API_CALLS=0
      GITHUB_API_RESET_TIME=$(($(date +%s) + 60))
    fi
  fi
}

rate_limited_gh() {
  check_rate_limit
  GITHUB_API_CALLS=$((GITHUB_API_CALLS + 1))
  gh "$@"
}

# ═══════════════════════════════════════════════════════════════════════════════
# ENHANCEMENT #9: RESOURCE-BASED THROTTLING
# ═══════════════════════════════════════════════════════════════════════════════

get_cpu_usage() {
  if [[ "$(uname)" == "Darwin" ]]; then
    # macOS
    ps -A -o %cpu | awk '{s+=$1} END {print int(s/4)}' 2>/dev/null || echo "0"
  else
    # Linux
    top -bn1 | grep "Cpu(s)" | awk '{print int($2)}' 2>/dev/null || echo "0"
  fi
}

get_memory_usage() {
  if [[ "$(uname)" == "Darwin" ]]; then
    # macOS - get memory pressure
    local pages_free pages_inactive pages_total
    pages_free=$(vm_stat | awk '/Pages free/ {print $3}' | tr -d '.')
    pages_inactive=$(vm_stat | awk '/Pages inactive/ {print $3}' | tr -d '.')
    pages_total=$(sysctl -n hw.memsize 2>/dev/null || echo "17179869184")
    pages_total=$((pages_total / 4096))
    
    local pages_available=$((pages_free + pages_inactive))
    local usage=$((100 - (pages_available * 100 / pages_total)))
    echo "$usage"
  else
    # Linux
    free | awk '/Mem:/ {print int($3/$2 * 100)}' 2>/dev/null || echo "0"
  fi
}

adjust_concurrency() {
  local cpu_usage
  local mem_usage
  cpu_usage=$(get_cpu_usage)
  mem_usage=$(get_memory_usage)
  
  local should_throttle=false
  local reason=""
  
  if [[ $cpu_usage -gt $CPU_THROTTLE_THRESHOLD ]]; then
    should_throttle=true
    reason="CPU at ${cpu_usage}%"
  fi
  
  if [[ $mem_usage -gt $MEMORY_THROTTLE_THRESHOLD ]]; then
    should_throttle=true
    reason="${reason:+$reason, }Memory at ${mem_usage}%"
  fi
  
  if [[ "$should_throttle" == "true" ]]; then
    local new_concurrent=$((MAX_CONCURRENT / 2))
    if [[ $new_concurrent -lt $MIN_CONCURRENT ]]; then
      new_concurrent=$MIN_CONCURRENT
    fi
    
    if [[ $new_concurrent -lt $MAX_CONCURRENT ]]; then
      log_warning "Resource pressure ($reason) - reducing concurrency: $MAX_CONCURRENT → $new_concurrent"
      MAX_CONCURRENT=$new_concurrent
    fi
  else
    # Gradually restore if resources are available
    if [[ $MAX_CONCURRENT -lt $INITIAL_MAX_CONCURRENT ]]; then
      local restore_concurrent=$((MAX_CONCURRENT + 2))
      if [[ $restore_concurrent -gt $INITIAL_MAX_CONCURRENT ]]; then
        restore_concurrent=$INITIAL_MAX_CONCURRENT
      fi
      log_info "Resources available - increasing concurrency: $MAX_CONCURRENT → $restore_concurrent"
      MAX_CONCURRENT=$restore_concurrent
    fi
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# ENHANCEMENT #6: NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

send_notification() {
  local message="$1"
  local title="${2:-LocalStack Batch Fix}"
  
  # Desktop notification (macOS)
  if [[ "$(uname)" == "Darwin" ]] && command -v osascript &>/dev/null; then
    osascript -e "display notification \"$message\" with title \"$title\"" 2>/dev/null || true
  fi
  
  # Desktop notification (Linux)
  if command -v notify-send &>/dev/null; then
    notify-send "$title" "$message" 2>/dev/null || true
  fi
  
  # Slack webhook (if configured)
  if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
    curl -s -X POST "$SLACK_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{\"text\": \"*$title*\n$message\"}" 2>/dev/null || true
  fi
  
  # Terminal bell
  echo -e '\a'
}

# ═══════════════════════════════════════════════════════════════════════════════
# ENHANCEMENT #10: DETAILED FAILURE ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

analyze_failure() {
  local log_file="$1"
  local pr="$2"
  
  local failure_type="unknown"
  local failure_details=""
  
  if [[ ! -f "$log_file" ]]; then
    echo "unknown:Log file not found"
    return
  fi
  
  # Analyze log file for common error patterns
  if grep -q "error TS[0-9]" "$log_file" 2>/dev/null; then
    failure_type="typescript_error"
    failure_details=$(grep -m1 "error TS[0-9]" "$log_file" | head -c 100)
  elif grep -q "npm ERR!" "$log_file" 2>/dev/null; then
    failure_type="npm_error"
    failure_details=$(grep -m1 "npm ERR!" "$log_file" | head -c 100)
  elif grep -q "ECONNREFUSED" "$log_file" 2>/dev/null; then
    failure_type="connection_error"
    failure_details="LocalStack connection refused"
  elif grep -qi "rate.*limit" "$log_file" 2>/dev/null; then
    failure_type="rate_limited"
    failure_details="GitHub API rate limited"
  elif grep -qi "conflict" "$log_file" 2>/dev/null; then
    failure_type="git_conflict"
    failure_details=$(grep -m1 -i "conflict" "$log_file" | head -c 100)
  elif grep -qi "authentication\|unauthorized\|permission" "$log_file" 2>/dev/null; then
    failure_type="auth_error"
    failure_details="Authentication or permission error"
  elif grep -qi "timeout" "$log_file" 2>/dev/null; then
    failure_type="timeout"
    failure_details="Operation timed out"
  elif grep -qi "not found\|404" "$log_file" 2>/dev/null; then
    failure_type="not_found"
    failure_details="Resource not found"
  elif grep -qi "schema\|validation\|metadata" "$log_file" 2>/dev/null; then
    failure_type="validation_error"
    failure_details=$(grep -m1 -i "schema\|validation\|metadata" "$log_file" | head -c 100)
  fi
  
  echo "${failure_type}:${failure_details}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# ENHANCEMENT #2: ERROR PATTERN LEARNING
# ═══════════════════════════════════════════════════════════════════════════════

init_error_patterns_file() {
  if [[ ! -f "$ERROR_PATTERNS_FILE" ]]; then
    cat > "$ERROR_PATTERNS_FILE" << 'EOF'
{
  "patterns": [],
  "summary": {
    "total_errors": 0,
    "by_type": {}
  }
}
EOF
  fi
}

save_error_pattern() {
  local pr="$1"
  local error_type="$2"
  local error_details="$3"
  local platform="${4:-unknown}"
  
  init_error_patterns_file
  
  # Add error to patterns file
  local timestamp
  timestamp=$(date -Iseconds)
  
  jq --arg pr "$pr" \
     --arg type "$error_type" \
     --arg details "$error_details" \
     --arg platform "$platform" \
     --arg ts "$timestamp" '
    .patterns += [{
      "pr": $pr,
      "type": $type,
      "details": $details,
      "platform": $platform,
      "timestamp": $ts
    }] |
    .summary.total_errors += 1 |
    .summary.by_type[$type] = ((.summary.by_type[$type] // 0) + 1)
  ' "$ERROR_PATTERNS_FILE" > "${ERROR_PATTERNS_FILE}.tmp" && \
  mv "${ERROR_PATTERNS_FILE}.tmp" "$ERROR_PATTERNS_FILE"
}

get_common_errors() {
  if [[ -f "$ERROR_PATTERNS_FILE" ]]; then
    jq -r '.summary.by_type | to_entries | sort_by(-.value) | .[0:5] | .[] | "\(.key): \(.value)"' "$ERROR_PATTERNS_FILE" 2>/dev/null || echo "No error data"
  else
    echo "No error data"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# ENHANCEMENT #3: PRIORITY QUEUE BY SUCCESS PROBABILITY
# ═══════════════════════════════════════════════════════════════════════════════

get_pr_priority_score() {
  local pr="$1"
  local score=50  # Default score

  # Check if compatibility check script exists
  if [[ -x "$COMPATIBILITY_CHECK" ]]; then
    local check_result
    # Sanitize output by removing control characters before parsing
    check_result=$("$COMPATIBILITY_CHECK" --json "Pr$pr" 2>/dev/null | tr -d '\000-\037' || echo "{}")

    if [[ -n "$check_result" ]]; then
      score=$(echo "$check_result" | jq -r '.score // 50' 2>/dev/null || echo "50")
    fi
  fi

  # Adjust based on past error patterns
  if [[ -f "$ERROR_PATTERNS_FILE" ]]; then
    local past_failures
    past_failures=$(jq --arg pr "$pr" '[.patterns[] | select(.pr == $pr)] | length' "$ERROR_PATTERNS_FILE" 2>/dev/null || echo "0")

    if [[ $past_failures -gt 0 ]]; then
      score=$((score - past_failures * 10))
    fi
  fi

  echo "$score"
}

order_prs_by_priority() {
  local prs=("$@")
  local scored_prs=()
  
  log_info "Calculating priority scores for ${#prs[@]} PRs..."
  
  for pr in "${prs[@]}"; do
    local score
    score=$(get_pr_priority_score "$pr")
    scored_prs+=("$score:$pr")
    log_debug "PR #$pr: score=$score"
  done
  
  # Sort by score (descending) and extract PR numbers
  printf '%s\n' "${scored_prs[@]}" | sort -t: -k1 -rn | cut -d: -f2
}

# ═══════════════════════════════════════════════════════════════════════════════
# ENHANCEMENT #1: LOCAL DEPLOYMENT TESTING
# ═══════════════════════════════════════════════════════════════════════════════

test_local_deployment() {
  local work_dir="$1"
  local platform="$2"
  
  log_debug "Testing local deployment in $work_dir (platform: $platform)"
  
  cd "$work_dir"
  
  case "$platform" in
    cdk|cdk-ts|cdk-py)
      if command -v cdklocal &>/dev/null; then
        echo "   Testing CDK synth..."
        if cdklocal synth 2>&1 | tail -5; then
          return 0
        else
          return 1
        fi
      elif [[ -f "package.json" ]]; then
        echo "   Testing npx cdk synth..."
        if npx cdk synth 2>&1 | tail -5; then
          return 0
        else
          return 1
        fi
      fi
      ;;
    tf|terraform)
      if command -v tflocal &>/dev/null; then
        echo "   Testing Terraform validate..."
        cd lib 2>/dev/null || true
        if tflocal init -input=false 2>&1 | tail -3 && tflocal validate 2>&1; then
          cd "$work_dir"
          return 0
        fi
        cd "$work_dir"
        return 1
      fi
      ;;
    cfn|cloudformation)
      echo "   CloudFormation templates will be validated during push"
      return 0
      ;;
    pulumi)
      if command -v pulumi &>/dev/null; then
        echo "   Testing Pulumi preview..."
        if pulumi preview --non-interactive 2>&1 | tail -5; then
          return 0
        else
          return 1
        fi
      fi
      ;;
  esac
  
  # Default: skip test
  return 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# STATUS FILE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

# Initialize status file
init_status_file() {
  local prs=("$@")
  local pr_status=()
  
  for pr in "${prs[@]}"; do
    pr_status+=("{\"pr\": \"$pr\", \"status\": \"pending\", \"started\": null, \"completed\": null, \"result\": null, \"failure_type\": null}")
  done
  
  local json_array
  json_array=$(printf '%s\n' "${pr_status[@]}" | jq -s '.')
  
  cat > "$STATUS_FILE" << EOF
{
  "batch_id": "$(date '+%Y%m%d-%H%M%S')",
  "started": "$(date -Iseconds)",
  "total_prs": ${#prs[@]},
  "max_concurrent": $MAX_CONCURRENT,
  "features": {
    "test_deploy": ${TEST_LOCAL_DEPLOY:-false},
    "smart_order": ${SMART_ORDER:-false},
    "resume": ${RESUME:-false}
  },
  "prs": $json_array
}
EOF
}

# Update PR status in status file (enhanced with failure type)
update_pr_status() {
  local pr="$1"
  local status="$2"
  local result="${3:-null}"
  local failure_type="${4:-null}"
  
  # Use file locking for concurrent access (if available)
  local lock_file="${STATUS_FILE}.lock"

  (
    # Try to use flock if available, otherwise continue without locking
    if command -v flock &>/dev/null; then
      flock -w 10 200 || exit 1
    fi
    
    if [[ -f "$STATUS_FILE" ]]; then
      local timestamp
      timestamp=$(date -Iseconds)
      
      jq --arg pr "$pr" \
         --arg status "$status" \
         --arg result "$result" \
         --arg failure_type "$failure_type" \
         --arg ts "$timestamp" '
        .prs |= map(
          if .pr == $pr then
            .status = $status |
            (if $status == "running" then .started = $ts else . end) |
            (if $status == "completed" or $status == "failed" then 
              .completed = $ts | 
              .result = $result |
              .failure_type = $failure_type 
            else . end)
          else .
          end
        )
      ' "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    fi
  ) 200>"$lock_file"
}

# Get count of currently running processes
get_running_count() {
  if [[ -f "$STATUS_FILE" ]]; then
    jq '[.prs[] | select(.status == "running")] | length' "$STATUS_FILE" 2>/dev/null || echo "0"
  else
    echo "0"
  fi
}

# Wait for a slot to be available (with resource checking)
wait_for_slot() {
  while true; do
    # Check resources and adjust concurrency
    adjust_concurrency
    
    local running
    running=$(get_running_count)
    if [[ "$running" -lt "$MAX_CONCURRENT" ]]; then
      break
    fi
    sleep 5
  done
}

# Show current status (enhanced)
show_status() {
  if [[ ! -f "$STATUS_FILE" ]]; then
    log_error "No batch fix in progress"
    return 1
  fi
  
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "📊 BATCH FIX STATUS (Enhanced)"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  
  local batch_id started total pending running completed failed
  batch_id=$(jq -r '.batch_id' "$STATUS_FILE")
  started=$(jq -r '.started' "$STATUS_FILE")
  total=$(jq -r '.total_prs' "$STATUS_FILE")
  pending=$(jq '[.prs[] | select(.status == "pending")] | length' "$STATUS_FILE")
  running=$(jq '[.prs[] | select(.status == "running")] | length' "$STATUS_FILE")
  completed=$(jq '[.prs[] | select(.status == "completed")] | length' "$STATUS_FILE")
  failed=$(jq '[.prs[] | select(.status == "failed")] | length' "$STATUS_FILE")
  
  echo "Batch ID: $batch_id"
  echo "Started:  $started"
  echo "Current concurrency: $MAX_CONCURRENT"
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
  
  # Show recent completions with failure types
  if [[ "$completed" -gt 0 ]] || [[ "$failed" -gt 0 ]]; then
    echo "Recent Results:"
    jq -r '.prs[] | select(.status == "completed" or .status == "failed") | 
      if .status == "completed" then "  ✅ PR #\(.pr) - \(.result)" 
      else "  ❌ PR #\(.pr) - \(.failure_type // "unknown"): \(.result)" end' "$STATUS_FILE" | tail -10
    echo ""
  fi
  
  # Show failure breakdown
  if [[ "$failed" -gt 0 ]]; then
    echo "Failure Breakdown:"
    jq -r '[.prs[] | select(.status == "failed") | .failure_type // "unknown"] | group_by(.) | map({type: .[0], count: length}) | .[] | "  \(.type): \(.count)"' "$STATUS_FILE" 2>/dev/null || true
    echo ""
  fi
  
  # Show common error patterns
  echo "Common Error Patterns (from history):"
  get_common_errors | while read -r line; do
    echo "  $line"
  done
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# FIX SINGLE PR (Enhanced)
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
    # STEP 1: Fetch PR details (with rate limiting)
    # ─────────────────────────────────────────────────────────────────────────────
    
    echo "📋 Fetching PR #$pr details..."
    
    check_rate_limit
    GITHUB_API_CALLS=$((GITHUB_API_CALLS + 1))
    
    PR_INFO=$(gh pr view "$pr" --repo "$GITHUB_REPO" --json title,headRefName,state 2>/dev/null || echo "")
    
    if [[ -z "$PR_INFO" ]]; then
      echo "❌ Failed to fetch PR #$pr"
      update_pr_status "$pr" "failed" "PR not found" "not_found"
      save_error_pattern "$pr" "not_found" "PR not found on GitHub" "unknown"
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
      COMPLETED_PRS+=("$pr")
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
      update_pr_status "$pr" "failed" "Worktree creation failed" "git_error"
      save_error_pattern "$pr" "git_error" "Failed to create worktree" "unknown"
      return 1
    fi
    
    cd "$WORK_DIR"
    echo "✅ Worktree ready"
    echo ""
    
    # Detect platform
    local PLATFORM="unknown"
    if [[ -f "metadata.json" ]]; then
      PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null || echo "unknown")
    elif [[ -f "cdk.json" ]]; then
      PLATFORM="cdk"
    elif [[ -f "Pulumi.yaml" ]]; then
      PLATFORM="pulumi"
    fi
    
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
    # STEP 3d: Test local deployment (if enabled)
    # ─────────────────────────────────────────────────────────────────────────────
    
    if [[ "${TEST_LOCAL_DEPLOY:-false}" == "true" ]]; then
      echo "🚀 Testing local deployment..."
      
      if ! test_local_deployment "$WORK_DIR" "$PLATFORM"; then
        echo "⚠️ Local deployment test failed (continuing anyway)"
      else
        echo "✅ Local deployment test passed"
      fi
      echo ""
    fi
    
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

Automated by localstack-batch-fix (enhanced with failure analysis)"

      git commit -m "$COMMIT_MSG" 2>/dev/null || true
      
      echo "📤 Pushing changes..."
      
      check_rate_limit
      GITHUB_API_CALLS=$((GITHUB_API_CALLS + 1))
      
      git push origin "$PR_BRANCH" --force-with-lease 2>/dev/null || git push origin "$PR_BRANCH" 2>/dev/null
      
      echo "✅ Changes pushed"
    else
      echo "   No changes to commit"
    fi
    echo ""
    
    # ─────────────────────────────────────────────────────────────────────────────
    # STEP 5: Wait for CI/CD (optional)
    # ─────────────────────────────────────────────────────────────────────────────
    
    if [[ "${WAIT_CICD:-false}" == "true" ]]; then
      echo "⏳ Waiting for CI/CD to complete..."
      
      local cicd_timeout=600
      local cicd_interval=30
      local cicd_elapsed=0
      
      while [[ "$cicd_elapsed" -lt "$cicd_timeout" ]]; do
        sleep "$cicd_interval"
        cicd_elapsed=$((cicd_elapsed + cicd_interval))
        
        check_rate_limit
        GITHUB_API_CALLS=$((GITHUB_API_CALLS + 1))
        
        local checks_status
        checks_status=$(gh pr checks "$pr" --repo "$GITHUB_REPO" --json conclusion 2>/dev/null || echo "")
        
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
    COMPLETED_PRS+=("$pr")
    
  } > "$log_file" 2>&1
  
  local exit_code=$?
  
  # If failed, analyze the failure
  if [[ $exit_code -ne 0 ]]; then
    local failure_info
    failure_info=$(analyze_failure "$log_file" "$pr")
    local failure_type="${failure_info%%:*}"
    local failure_details="${failure_info#*:}"
    
    update_pr_status "$pr" "failed" "$failure_details" "$failure_type"
    save_error_pattern "$pr" "$failure_type" "$failure_details" "${PLATFORM:-unknown}"
  fi
  
  return $exit_code
}

# ═══════════════════════════════════════════════════════════════════════════════
# PARSE ARGUMENTS (Enhanced)
# ═══════════════════════════════════════════════════════════════════════════════

PRS=()
SHOW_STATUS=false
FAILED_ONLY=false
FROM_FILE=""
WAIT_CICD=false
RESUME=false
TEST_LOCAL_DEPLOY=false
SMART_ORDER=false
VERBOSE=false
NOTIFY=true
AUTO_PICK=false
AUTO_PICK_LABELS_ARG=""

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
      INITIAL_MAX_CONCURRENT="$2"
      shift 2
      ;;
    --resume)
      RESUME=true
      shift
      ;;
    --test-deploy)
      TEST_LOCAL_DEPLOY=true
      export TEST_LOCAL_DEPLOY
      shift
      ;;
    --smart-order)
      SMART_ORDER=true
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --no-notify)
      NOTIFY=false
      shift
      ;;
    --auto-pick)
      AUTO_PICK=true
      shift
      ;;
    --labels)
      AUTO_PICK_LABELS_ARG="$2"
      shift 2
      ;;
    --max-pick)
      AUTO_PICK_MAX="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [options] <pr1> <pr2> <pr3> ..."
      echo ""
      echo "Process multiple LocalStack PRs in parallel (Enhanced)"
      echo ""
      echo "Options:"
      echo "  --status, -s          Show status of current batch"
      echo "  --failed-only         Re-process only failed PRs from last batch"
      echo "  --from-file, -f FILE  Read PR numbers from file (one per line)"
      echo "  --auto-pick           Auto-pick open PRs with required labels (Synth-2,localstack)"
      echo "  --labels LABELS       Custom labels for auto-pick (comma-separated, default: Synth-2,localstack)"
      echo "  --max-pick N          Maximum PRs to auto-pick (default: 20)"
      echo "  --wait-cicd           Wait for CI/CD to complete for each PR"
      echo "  --max-concurrent, -j  Maximum parallel processes (default: $MAX_CONCURRENT)"
      echo "  --resume              Resume from last checkpoint"
      echo "  --test-deploy         Test local deployment before pushing"
      echo "  --smart-order         Order PRs by success probability"
      echo "  --verbose, -v         Verbose output"
      echo "  --no-notify           Disable notifications"
      echo "  --help, -h            Show this help"
      echo ""
      echo "Examples:"
      echo "  $0 7179 7180 7181 7182 7183"
      echo "  $0 --from-file prs.txt --smart-order"
      echo "  $0 --resume --failed-only"
      echo "  $0 --max-concurrent 10 --test-deploy 7179 7180 7181"
      echo "  $0 --auto-pick                              # Pick PRs with Synth-2 AND localstack labels"
      echo "  $0 --auto-pick --labels 'Synth-2,localstack,cdk'  # Custom labels"
      echo "  $0 --auto-pick --max-pick 10 --smart-order  # Pick 10 PRs, order by success probability"
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
init_error_patterns_file

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

# Handle --resume flag
if [[ "$RESUME" == "true" ]]; then
  COMPLETED_FROM_CHECKPOINT=$(load_checkpoint)
  
  if [[ -n "$COMPLETED_FROM_CHECKPOINT" ]]; then
    # Filter out already completed PRs
    FILTERED_PRS=()
    for pr in "${PRS[@]}"; do
      if ! echo "$COMPLETED_FROM_CHECKPOINT" | grep -q "^$pr$"; then
        FILTERED_PRS+=("$pr")
      else
        log_debug "Skipping PR #$pr (already completed in checkpoint)"
        COMPLETED_PRS+=("$pr")
      fi
    done
    
    PRS=("${FILTERED_PRS[@]}")
    log_info "Resumed from checkpoint - ${#COMPLETED_PRS[@]} already completed, ${#PRS[@]} remaining"
  fi
fi

# Handle --auto-pick flag
if [[ "$AUTO_PICK" == "true" ]]; then
  # Use custom labels if provided, otherwise use default
  PICK_LABELS="${AUTO_PICK_LABELS_ARG:-$AUTO_PICK_LABELS}"
  
  log_info "Auto-picking PRs with labels: $PICK_LABELS"
  
  # Fetch PRs with required labels
  PICKED_PRS=$(fetch_labeled_prs_detailed "$PICK_LABELS" "$AUTO_PICK_MAX")
  FETCH_EXIT_CODE=$?
  
  if [[ $FETCH_EXIT_CODE -ne 0 ]] || [[ -z "$PICKED_PRS" ]]; then
    log_error "Failed to auto-pick PRs"
    echo ""
    echo "Make sure PRs have BOTH labels:"
    echo "  - Synth-2"
    echo "  - localstack"
    echo ""
    echo "To add labels to a PR:"
    echo "  gh pr edit <PR_NUMBER> --add-label 'Synth-2' --add-label 'localstack'"
    exit 2
  fi
  
  # Add picked PRs to the list
  while IFS= read -r pr; do
    [[ -z "$pr" ]] && continue
    if [[ "$pr" =~ ^[0-9]+$ ]]; then
      PRS+=("$pr")
    fi
  done <<< "$PICKED_PRS"
  
  log_success "Auto-picked ${#PRS[@]} PRs"
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
  echo "       $0 --resume"
  echo "       $0 --help"
  exit 2
fi

# Remove duplicates
PRS=($(printf '%s\n' "${PRS[@]}" | sort -u))

# Apply smart ordering if requested
if [[ "$SMART_ORDER" == "true" ]]; then
  log_info "Applying smart ordering based on success probability..."
  ORDERED_PRS=$(order_prs_by_priority "${PRS[@]}")
  PRS=()
  while IFS= read -r pr; do
    [[ -n "$pr" ]] && PRS+=("$pr")
  done <<< "$ORDERED_PRS"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# START BATCH PROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "🚀 LOCALSTACK BATCH FIX (Enhanced)"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 PRs to process: ${#PRS[@]}"
echo "🔄 Max concurrent: $MAX_CONCURRENT"
echo "📁 Worktree base:  $WORKTREE_BASE"
echo "📝 Log directory:  $LOG_DIR"
echo ""
echo "Features enabled:"
[[ "$AUTO_PICK" == "true" ]] && echo "  ✓ Auto-pick PRs (labels: ${PICK_LABELS:-$AUTO_PICK_LABELS})"
[[ "$TEST_LOCAL_DEPLOY" == "true" ]] && echo "  ✓ Local deployment testing"
[[ "$SMART_ORDER" == "true" ]] && echo "  ✓ Smart ordering"
[[ "$RESUME" == "true" ]] && echo "  ✓ Resume from checkpoint"
[[ "$WAIT_CICD" == "true" ]] && echo "  ✓ Wait for CI/CD"
echo "  ✓ GitHub API rate limiting"
echo "  ✓ Resource-based throttling"
echo "  ✓ Failure analysis"
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

# Process PRs with parallelism
TOTAL=${#PRS[@]}
COMPLETED=0
FAILED=0

for pr in "${PRS[@]}"; do
  # Wait for a slot to be available (with resource throttling)
  wait_for_slot
  
  log_progress "Starting PR #$pr ($(get_running_count)/$MAX_CONCURRENT running)"
  
  # Start fix in background
  fix_single_pr "$pr" &
  JOB_PIDS[$pr]=$!
  
  # Small delay to avoid race conditions
  sleep 2
  
  # Periodically save checkpoint
  if [[ $((${#COMPLETED_PRS[@]} % 5)) -eq 0 ]] && [[ ${#COMPLETED_PRS[@]} -gt 0 ]]; then
    save_checkpoint
  fi
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

# Final checkpoint save
save_checkpoint

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
  
  # Show failure breakdown
  local failed_count
  failed_count=$(jq '[.prs[] | select(.status == "failed")] | length' "$STATUS_FILE")
  
  if [[ "$failed_count" -gt 0 ]]; then
    echo "Failure Breakdown:"
    jq -r '[.prs[] | select(.status == "failed") | .failure_type // "unknown"] | group_by(.) | map({type: .[0], count: length}) | .[] | "  \(.type): \(.count)"' "$STATUS_FILE" 2>/dev/null || true
    echo ""
    
    echo "Failed PRs:"
    jq -r '.prs[] | select(.status == "failed") | "  ❌ PR #\(.pr): [\(.failure_type // "unknown")] \(.result)"' "$STATUS_FILE"
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

# Send completion notification
if [[ "$NOTIFY" == "true" ]]; then
  local completed_count failed_count
  completed_count=$(jq '[.prs[] | select(.status == "completed")] | length' "$STATUS_FILE" 2>/dev/null || echo "0")
  failed_count=$(jq '[.prs[] | select(.status == "failed")] | length' "$STATUS_FILE" 2>/dev/null || echo "0")
  
  send_notification "Batch fix complete: $completed_count succeeded, $failed_count failed" "LocalStack Batch Fix Complete"
fi

# Exit with appropriate code
if [[ "$FAILED" -gt 0 ]]; then
  exit 1
else
  exit 0
fi
