#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# LocalStack Auto-Fix Orchestrator
# ═══════════════════════════════════════════════════════════════════════════
# Monitors CI/CD pipeline and automatically triggers fixes until the task
# reaches the ARCHIVE stage (production ready).
#
# A task is considered COMPLETE only when:
#   ✅ archive-folders job passes (ready for manual review)
#
# Until then, the orchestrator will:
#   1. Monitor the pipeline status
#   2. Detect failures at any checkpoint
#   3. Automatically trigger localstack-fixer
#   4. Push fixes and wait for new pipeline run
#   5. Repeat until archive stage is reached
#
# Usage:
#   ./localstack-auto-fix-orchestrator.sh <PR_NUMBER> [options]
#
# Options:
#   --max-iterations N    Maximum fix iterations (default: 5)
#   --timeout N           Pipeline timeout in seconds (default: 2700 = 45min)
#   --work-dir PATH       Working directory for fixes
#   --no-auto-fix         Only monitor, don't auto-fix
#
# Exit codes:
#   0 - Task completed (archive stage reached)
#   1 - Failed after max iterations
#   2 - Timeout
#   3 - Manual intervention required
#   4 - GitHub API error
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load from config or use defaults
GITHUB_REPO="${GITHUB_REPO:-TuringGpt/iac-test-automations}"
MAX_ITERATIONS="${MAX_ITERATIONS:-5}"
PIPELINE_TIMEOUT="${PIPELINE_TIMEOUT:-2700}"  # 45 minutes
POLL_INTERVAL="${POLL_INTERVAL:-45}"          # Check every 45 seconds
WAIT_AFTER_PUSH="${WAIT_AFTER_PUSH:-60}"      # Wait 60s after push for CI to start

# The FINAL checkpoint - task is complete only when this passes
FINAL_CHECKPOINT="archive-folders"

# Job execution order (for progress tracking)
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
  "archive-folders"  # FINAL - Task complete when this passes
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════
# LOGGING FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

log_header() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo ""
}

log_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_progress() { echo -e "${MAGENTA}🔄 $1${NC}"; }
log_checkpoint() { echo -e "${CYAN}🔍 $1${NC}"; }
log_fix() { echo -e "${YELLOW}🔧 $1${NC}"; }

# ═══════════════════════════════════════════════════════════════════════════
# PARSE ARGUMENTS
# ═══════════════════════════════════════════════════════════════════════════

PR_NUMBER=""
WORK_DIR=""
AUTO_FIX=true
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-iterations)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --timeout)
      PIPELINE_TIMEOUT="$2"
      shift 2
      ;;
    --work-dir)
      WORK_DIR="$2"
      shift 2
      ;;
    --no-auto-fix)
      AUTO_FIX=false
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 <PR_NUMBER> [options]"
      echo ""
      echo "Options:"
      echo "  --max-iterations N    Maximum fix iterations (default: 5)"
      echo "  --timeout N           Pipeline timeout in seconds (default: 2700)"
      echo "  --work-dir PATH       Working directory for fixes"
      echo "  --no-auto-fix         Only monitor, don't auto-fix"
      echo "  --verbose, -v         Verbose output"
      exit 0
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
  log_error "PR number is required"
  echo "Usage: $0 <PR_NUMBER> [options]"
  exit 4
fi

# ═══════════════════════════════════════════════════════════════════════════
# GITHUB API HELPERS
# ═══════════════════════════════════════════════════════════════════════════

gh_api() {
  local max_attempts=3
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    if output=$("$@" 2>&1); then
      echo "$output"
      return 0
    fi
    
    if echo "$output" | grep -qiE "timeout|rate limit|502|503|504"; then
      log_warning "GitHub API attempt $attempt failed, retrying..."
      sleep $((attempt * 2))
      ((attempt++))
    else
      echo "$output"
      return 1
    fi
  done
  return 1
}

# ═══════════════════════════════════════════════════════════════════════════
# GET PIPELINE STATUS
# ═══════════════════════════════════════════════════════════════════════════

get_pipeline_status() {
  local pr_number="$1"
  
  # Get PR branch
  local pr_info branch
  pr_info=$(gh_api gh pr view "$pr_number" --repo "$GITHUB_REPO" --json headRefName,state 2>/dev/null) || return 4
  branch=$(echo "$pr_info" | jq -r '.headRefName // ""')
  
  if [[ -z "$branch" ]]; then
    return 4
  fi
  
  # Get latest workflow run
  local runs run_id status conclusion
  runs=$(gh_api gh run list --repo "$GITHUB_REPO" --branch "$branch" --limit 1 --json databaseId,status,conclusion 2>/dev/null) || return 4
  
  if [[ -z "$runs" ]] || [[ "$runs" == "[]" ]]; then
    echo '{"status":"no_runs","branch":"'"$branch"'"}'
    return 3
  fi
  
  run_id=$(echo "$runs" | jq -r '.[0].databaseId')
  status=$(echo "$runs" | jq -r '.[0].status')
  conclusion=$(echo "$runs" | jq -r '.[0].conclusion // "in_progress"')
  
  # Get all jobs
  local jobs
  jobs=$(gh_api gh run view "$run_id" --repo "$GITHUB_REPO" --json jobs 2>/dev/null | jq '.jobs // []') || return 4
  
  # Build job status map
  local job_statuses="{}"
  for job_name in "${JOB_ORDER[@]}"; do
    local job_status job_conclusion
    job_status=$(echo "$jobs" | jq -r --arg name "$job_name" '.[] | select(.name == $name) | .status // "not_found"')
    job_conclusion=$(echo "$jobs" | jq -r --arg name "$job_name" '.[] | select(.name == $name) | .conclusion // "pending"')
    
    if [[ "$job_status" == "not_found" ]] || [[ -z "$job_status" ]]; then
      job_statuses=$(echo "$job_statuses" | jq --arg name "$job_name" '. + {($name): "skipped"}')
    elif [[ "$job_status" == "completed" ]]; then
      job_statuses=$(echo "$job_statuses" | jq --arg name "$job_name" --arg status "$job_conclusion" '. + {($name): $status}')
    else
      job_statuses=$(echo "$job_statuses" | jq --arg name "$job_name" --arg status "$job_status" '. + {($name): $status}')
    fi
  done
  
  # Check archive-folders status (FINAL checkpoint)
  local archive_status
  archive_status=$(echo "$job_statuses" | jq -r '.["archive-folders"] // "pending"')
  
  # Find first failed job
  local first_failed=""
  for job_name in "${JOB_ORDER[@]}"; do
    local js
    js=$(echo "$job_statuses" | jq -r --arg name "$job_name" '.[$name] // "pending"')
    if [[ "$js" == "failure" ]]; then
      first_failed="$job_name"
      break
    fi
  done
  
  # Count jobs
  local passed_count failed_count running_count
  passed_count=$(echo "$job_statuses" | jq '[to_entries[] | select(.value == "success")] | length')
  failed_count=$(echo "$job_statuses" | jq '[to_entries[] | select(.value == "failure")] | length')
  running_count=$(echo "$job_statuses" | jq '[to_entries[] | select(.value == "in_progress" or .value == "queued")] | length')
  
  # Build result
  jq -n \
    --arg branch "$branch" \
    --arg run_id "$run_id" \
    --arg status "$status" \
    --arg conclusion "$conclusion" \
    --arg archive_status "$archive_status" \
    --arg first_failed "$first_failed" \
    --argjson job_statuses "$job_statuses" \
    --argjson passed "$passed_count" \
    --argjson failed "$failed_count" \
    --argjson running "$running_count" \
    '{
      branch: $branch,
      run_id: $run_id,
      pipeline_status: $status,
      pipeline_conclusion: $conclusion,
      archive_status: $archive_status,
      task_complete: ($archive_status == "success"),
      first_failed_job: $first_failed,
      jobs: $job_statuses,
      counts: {
        passed: $passed,
        failed: $failed,
        running: $running
      },
      needs_fix: ($failed > 0),
      is_running: ($running > 0)
    }'
}

# ═══════════════════════════════════════════════════════════════════════════
# DISPLAY PROGRESS
# ═══════════════════════════════════════════════════════════════════════════

display_progress() {
  local status="$1"
  local iteration="$2"
  
  echo ""
  echo "┌─────────────────────────────────────────────────────────────────────────────┐"
  echo "│  🎯 TASK COMPLETION STATUS - PR #$PR_NUMBER (Iteration $iteration/$MAX_ITERATIONS)"
  echo "├─────────────────────────────────────────────────────────────────────────────┤"
  
  # Show job progress
  local archive_status task_complete
  archive_status=$(echo "$status" | jq -r '.archive_status')
  task_complete=$(echo "$status" | jq -r '.task_complete')
  
  echo "│"
  echo "│  CHECKPOINT PROGRESS:"
  echo "│"
  
  for job_name in "${JOB_ORDER[@]}"; do
    local job_status icon color
    job_status=$(echo "$status" | jq -r --arg name "$job_name" '.jobs[$name] // "pending"')
    
    case "$job_status" in
      success)
        icon="✅"
        color="${GREEN}"
        ;;
      failure)
        icon="❌"
        color="${RED}"
        ;;
      in_progress|queued)
        icon="🔄"
        color="${YELLOW}"
        ;;
      skipped)
        icon="⏭️ "
        color="${BLUE}"
        ;;
      *)
        icon="⏳"
        color="${NC}"
        ;;
    esac
    
    # Highlight archive-folders as the FINAL checkpoint
    if [[ "$job_name" == "archive-folders" ]]; then
      printf "│  ${color}%s %-35s ${BOLD}[FINAL]${NC}\n" "$icon" "$job_name"
    else
      printf "│  ${color}%s %-35s${NC}\n" "$icon" "$job_name"
    fi
  done
  
  echo "│"
  echo "├─────────────────────────────────────────────────────────────────────────────┤"
  
  # Show summary
  local passed failed running
  passed=$(echo "$status" | jq -r '.counts.passed')
  failed=$(echo "$status" | jq -r '.counts.failed')
  running=$(echo "$status" | jq -r '.counts.running')
  
  printf "│  Passed: ${GREEN}%s${NC}  Failed: ${RED}%s${NC}  Running: ${YELLOW}%s${NC}\n" "$passed" "$failed" "$running"
  echo "├─────────────────────────────────────────────────────────────────────────────┤"
  
  # Show task completion status
  if [[ "$task_complete" == "true" ]]; then
    echo -e "│  ${GREEN}${BOLD}🎉 TASK COMPLETE - ARCHIVE STAGE REACHED!${NC}"
    echo -e "│  ${GREEN}   Ready for manual review${NC}"
  elif [[ "$failed" -gt 0 ]]; then
    local first_failed
    first_failed=$(echo "$status" | jq -r '.first_failed_job')
    echo -e "│  ${RED}❌ TASK INCOMPLETE - Pipeline failed at: $first_failed${NC}"
    echo -e "│  ${YELLOW}   Auto-fix will be triggered...${NC}"
  elif [[ "$running" -gt 0 ]]; then
    echo -e "│  ${YELLOW}⏳ TASK INCOMPLETE - Pipeline still running...${NC}"
  else
    echo -e "│  ${BLUE}ℹ️  TASK STATUS: Checking...${NC}"
  fi
  
  echo "└─────────────────────────────────────────────────────────────────────────────┘"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# TRIGGER FIX
# ═══════════════════════════════════════════════════════════════════════════

trigger_fix() {
  local pr_number="$1"
  local failed_job="$2"
  local iteration="$3"
  
  log_section "🔧 TRIGGERING AUTO-FIX (Iteration $iteration)"
  
  log_info "Failed job: $failed_job"
  log_info "Invoking localstack-fixer agent..."
  
  # The actual fix will be done by the localstack-fixer agent
  # This script outputs the command to run - the agent will execute it
  
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "  🤖 INVOKING LOCALSTACK-FIXER AGENT"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  echo "  PR Number: $pr_number"
  echo "  Failed Job: $failed_job"
  echo "  Iteration: $iteration of $MAX_ITERATIONS"
  echo ""
  echo "  The localstack-fixer agent will now:"
  echo "    1. Fetch error logs from the failed job"
  echo "    2. Analyze errors and identify fixes"
  echo "    3. Apply fixes in batch mode"
  echo "    4. Run pre-validation locally"
  echo "    5. Push fixes to trigger new CI/CD run"
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  
  # Return the fix command for the agent to execute
  # This will be picked up by the localstack-migrate command
  echo "FIX_COMMAND=/localstack-fixer $pr_number"
  
  return 0
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATION LOOP
# ═══════════════════════════════════════════════════════════════════════════

main() {
  local start_time iteration pipeline_status
  start_time=$(date +%s)
  iteration=0
  
  log_header "🚀 LOCALSTACK AUTO-FIX ORCHESTRATOR"
  
  log_info "PR Number: $PR_NUMBER"
  log_info "Max Iterations: $MAX_ITERATIONS"
  log_info "Pipeline Timeout: ${PIPELINE_TIMEOUT}s"
  log_info "Auto-Fix Enabled: $AUTO_FIX"
  echo ""
  
  # Check prerequisites
  if ! command -v gh &>/dev/null; then
    log_error "GitHub CLI (gh) is not installed"
    exit 4
  fi
  
  if ! gh auth status &>/dev/null 2>&1; then
    log_error "GitHub CLI is not authenticated. Run: gh auth login"
    exit 4
  fi
  
  log_success "GitHub CLI authenticated"
  echo ""
  
  # Main monitoring loop
  while true; do
    local elapsed=$(($(date +%s) - start_time))
    
    # Check timeout
    if [[ $elapsed -ge $PIPELINE_TIMEOUT ]]; then
      log_error "Pipeline timeout reached after ${elapsed}s"
      log_error "Task is NOT complete - manual intervention required"
      exit 2
    fi
    
    # Check max iterations
    if [[ $iteration -ge $MAX_ITERATIONS ]]; then
      log_error "Maximum fix iterations ($MAX_ITERATIONS) reached"
      log_error "Task is NOT complete - manual intervention required"
      exit 1
    fi
    
    log_checkpoint "Checking pipeline status... (elapsed: ${elapsed}s)"
    
    # Get current status
    pipeline_status=$(get_pipeline_status "$PR_NUMBER") || {
      local exit_code=$?
      if [[ $exit_code -eq 3 ]]; then
        log_warning "No workflow runs found - waiting for CI to start..."
        sleep $POLL_INTERVAL
        continue
      else
        log_error "Failed to get pipeline status"
        exit 4
      fi
    }
    
    # Display progress
    display_progress "$pipeline_status" "$iteration"
    
    # Check if task is complete (archive stage passed)
    local task_complete
    task_complete=$(echo "$pipeline_status" | jq -r '.task_complete')
    
    if [[ "$task_complete" == "true" ]]; then
      log_header "🎉 TASK COMPLETE!"
      echo ""
      log_success "Archive stage reached - PR #$PR_NUMBER is production ready!"
      log_success "Total iterations: $iteration"
      log_success "Total time: ${elapsed}s"
      echo ""
      log_info "The task is now ready for manual review."
      echo ""
      exit 0
    fi
    
    # Check if pipeline needs fix
    local needs_fix is_running first_failed
    needs_fix=$(echo "$pipeline_status" | jq -r '.needs_fix')
    is_running=$(echo "$pipeline_status" | jq -r '.is_running')
    first_failed=$(echo "$pipeline_status" | jq -r '.first_failed_job')
    
    if [[ "$needs_fix" == "true" ]]; then
      if [[ "$AUTO_FIX" == "true" ]]; then
        ((iteration++))
        
        log_warning "Pipeline failed at: $first_failed"
        log_fix "Starting auto-fix iteration $iteration..."
        
        # Output fix command for agent
        trigger_fix "$PR_NUMBER" "$first_failed" "$iteration"
        
        # The agent will execute the fix and push changes
        # After push, we wait for new CI run to start
        log_info "Waiting ${WAIT_AFTER_PUSH}s for new CI run to start..."
        sleep $WAIT_AFTER_PUSH
        
      else
        log_error "Pipeline failed but auto-fix is disabled"
        log_info "Run manually: /localstack-fixer $PR_NUMBER"
        exit 1
      fi
      
    elif [[ "$is_running" == "true" ]]; then
      log_progress "Pipeline still running... waiting ${POLL_INTERVAL}s"
      sleep $POLL_INTERVAL
      
    else
      # Pipeline completed but archive not reached - unusual state
      log_warning "Pipeline completed but archive stage not reached"
      log_info "Checking again in ${POLL_INTERVAL}s..."
      sleep $POLL_INTERVAL
    fi
  done
}

# ═══════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

main "$@"

