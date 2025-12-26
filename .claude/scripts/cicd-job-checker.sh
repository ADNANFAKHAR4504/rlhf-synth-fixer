#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# CI/CD Job Checker - Monitor Pipeline Status with Checkpoints
# ═══════════════════════════════════════════════════════════════════════════
# Monitors GitHub Actions workflow for a PR with detailed job-level status.
# Returns structured output for automation and human readability.
#
# Usage:
#   ./cicd-job-checker.sh <PR_NUMBER> [--json] [--wait] [--timeout <seconds>]
#
# Exit codes:
#   0 - All jobs passed
#   1 - One or more jobs failed
#   2 - Pipeline still running (with --wait: timeout reached)
#   3 - No workflow run found
#   4 - GitHub API error
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/.claude/config/localstack.yaml"

# Load config or use defaults
GITHUB_REPO="${GITHUB_REPO:-TuringGpt/iac-test-automations}"
DEFAULT_TIMEOUT=1800  # 30 minutes
POLL_INTERVAL=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

log_info() { echo -e "${BLUE}ℹ️  $1${NC}" >&2; }
log_success() { echo -e "${GREEN}✅ $1${NC}" >&2; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}" >&2; }
log_error() { echo -e "${RED}❌ $1${NC}" >&2; }
log_checkpoint() { echo -e "${CYAN}🔍 $1${NC}" >&2; }

# GitHub API with retry
gh_api() {
  local max_attempts=3
  local attempt=1
  local output
  
  while [ $attempt -le $max_attempts ]; do
    if output=$("$@" 2>&1); then
      echo "$output"
      return 0
    fi
    
    if echo "$output" | grep -qiE "timeout|rate limit|502|503|504"; then
      log_warning "GitHub API attempt $attempt failed, retrying..." >&2
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
# PARSE ARGUMENTS
# ═══════════════════════════════════════════════════════════════════════════

PR_NUMBER=""
JSON_OUTPUT=false
WAIT_MODE=false
TIMEOUT=$DEFAULT_TIMEOUT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    --wait)
      WAIT_MODE=true
      shift
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 <PR_NUMBER> [--json] [--wait] [--timeout <seconds>]"
      echo ""
      echo "Options:"
      echo "  --json         Output results as JSON"
      echo "  --wait         Wait for pipeline to complete"
      echo "  --timeout N    Timeout in seconds (default: 1800)"
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
  exit 4
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECKPOINT DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════

# Define CI/CD job checkpoints in order of execution
declare -A CHECKPOINTS=(
  ["1_detect"]="detect-metadata"
  ["2_prompt_quality"]="claude-review-prompt-quality"
  ["3_commit"]="validate-commit-message"
  ["4_jest"]="validate-jest-config"
  ["5_build"]="build"
  ["6_synth"]="synth"
  ["7_deploy"]="deploy"
  ["8_lint"]="lint"
  ["9_unit_tests"]="unit-tests"
  ["10_integration"]="integration-tests-live"
  ["11_claude_review"]="claude-code-action"
  ["12_cleanup"]="cleanup"
  ["13_ideal_response"]="claude-review-ideal-response"
  ["14_archive"]="archive-folders"
)

# Critical jobs that MUST pass
CRITICAL_JOBS=(
  "detect-metadata"
  "claude-review-prompt-quality"
  "build"
  "deploy"
  "integration-tests-live"
  "claude-code-action"
)

# ═══════════════════════════════════════════════════════════════════════════
# MAIN CHECK FUNCTION
# ═══════════════════════════════════════════════════════════════════════════

check_pipeline_status() {
  local pr_number="$1"
  
  # Get PR info
  local pr_info
  pr_info=$(gh_api gh pr view "$pr_number" --repo "$GITHUB_REPO" --json headRefName,state 2>/dev/null) || {
    log_error "Failed to fetch PR #$pr_number"
    return 4
  }
  
  local branch
  branch=$(echo "$pr_info" | jq -r '.headRefName // ""')
  
  if [[ -z "$branch" ]]; then
    log_error "Could not determine branch for PR #$pr_number"
    return 4
  fi
  
  # Get latest workflow run
  local runs
  runs=$(gh_api gh run list --repo "$GITHUB_REPO" --branch "$branch" --limit 1 --json databaseId,status,conclusion,workflowName,createdAt 2>/dev/null) || {
    log_error "Failed to fetch workflow runs"
    return 4
  }
  
  if [[ -z "$runs" ]] || [[ "$runs" == "[]" ]]; then
    log_warning "No workflow runs found for branch: $branch"
    return 3
  fi
  
  local run_id status conclusion
  run_id=$(echo "$runs" | jq -r '.[0].databaseId')
  status=$(echo "$runs" | jq -r '.[0].status')
  conclusion=$(echo "$runs" | jq -r '.[0].conclusion // "in_progress"')
  
  # Get all jobs
  local jobs
  jobs=$(gh_api gh run view "$run_id" --repo "$GITHUB_REPO" --json jobs 2>/dev/null | jq '.jobs // []') || {
    log_error "Failed to fetch jobs for run $run_id"
    return 4
  }
  
  # Analyze jobs
  local total_jobs passed_jobs failed_jobs skipped_jobs running_jobs
  total_jobs=$(echo "$jobs" | jq 'length')
  passed_jobs=$(echo "$jobs" | jq '[.[] | select(.conclusion == "success")] | length')
  failed_jobs=$(echo "$jobs" | jq '[.[] | select(.conclusion == "failure")] | length')
  skipped_jobs=$(echo "$jobs" | jq '[.[] | select(.conclusion == "skipped")] | length')
  running_jobs=$(echo "$jobs" | jq '[.[] | select(.status == "in_progress" or .status == "queued")] | length')
  
  # Get failed job names
  local failed_job_names
  failed_job_names=$(echo "$jobs" | jq -r '[.[] | select(.conclusion == "failure") | .name] | join(",")')
  
  # Get first failed job (for targeted fix)
  local first_failed_job
  first_failed_job=$(echo "$jobs" | jq -r '[.[] | select(.conclusion == "failure")][0].name // ""')
  
  # Check critical jobs status
  local critical_failed=()
  for job in "${CRITICAL_JOBS[@]}"; do
    local job_status
    job_status=$(echo "$jobs" | jq -r --arg name "$job" '.[] | select(.name == $name) | .conclusion // "pending"')
    if [[ "$job_status" == "failure" ]]; then
      critical_failed+=("$job")
    fi
  done
  
  # Build result
  local result
  result=$(jq -n \
    --arg pr "$pr_number" \
    --arg branch "$branch" \
    --arg run_id "$run_id" \
    --arg status "$status" \
    --arg conclusion "$conclusion" \
    --argjson total "$total_jobs" \
    --argjson passed "$passed_jobs" \
    --argjson failed "$failed_jobs" \
    --argjson skipped "$skipped_jobs" \
    --argjson running "$running_jobs" \
    --arg failed_jobs "$failed_job_names" \
    --arg first_failed "$first_failed_job" \
    --argjson critical_failed "$(printf '%s\n' "${critical_failed[@]}" | jq -R . | jq -s .)" \
    '{
      pr_number: $pr,
      branch: $branch,
      run_id: $run_id,
      pipeline_status: $status,
      pipeline_conclusion: $conclusion,
      jobs: {
        total: $total,
        passed: $passed,
        failed: $failed,
        skipped: $skipped,
        running: $running
      },
      failed_jobs: ($failed_jobs | split(",") | map(select(. != ""))),
      first_failed_job: $first_failed,
      critical_failures: $critical_failed,
      all_passed: ($failed == 0 and $running == 0),
      is_running: ($running > 0),
      needs_fix: ($failed > 0)
    }')
  
  echo "$result"
  
  # Return appropriate exit code
  if [[ "$failed_jobs" -gt 0 ]]; then
    return 1
  elif [[ "$running_jobs" -gt 0 ]]; then
    return 2
  else
    return 0
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# DISPLAY CHECKPOINT STATUS
# ═══════════════════════════════════════════════════════════════════════════

display_checkpoints() {
  local result="$1"
  
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "📋 CI/CD PIPELINE STATUS - PR #$(echo "$result" | jq -r '.pr_number')"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  
  local status conclusion
  status=$(echo "$result" | jq -r '.pipeline_status')
  conclusion=$(echo "$result" | jq -r '.pipeline_conclusion')
  
  if [[ "$status" == "completed" ]]; then
    if [[ "$conclusion" == "success" ]]; then
      echo -e "   Pipeline Status: ${GREEN}✅ COMPLETED - ALL PASSED${NC}"
    else
      echo -e "   Pipeline Status: ${RED}❌ COMPLETED - FAILED${NC}"
    fi
  else
    echo -e "   Pipeline Status: ${YELLOW}🔄 IN PROGRESS${NC}"
  fi
  
  echo ""
  echo "┌─────────────────────────────────────────────────────────────────┐"
  echo "│  JOB SUMMARY                                                    │"
  echo "├─────────────────────────────────────────────────────────────────┤"
  printf "│  %-15s %s\n" "Total Jobs:" "$(echo "$result" | jq -r '.jobs.total') │"
  printf "│  %-15s ${GREEN}%s${NC}\n" "Passed:" "$(echo "$result" | jq -r '.jobs.passed') │"
  printf "│  %-15s ${RED}%s${NC}\n" "Failed:" "$(echo "$result" | jq -r '.jobs.failed') │"
  printf "│  %-15s %s\n" "Skipped:" "$(echo "$result" | jq -r '.jobs.skipped') │"
  printf "│  %-15s ${YELLOW}%s${NC}\n" "Running:" "$(echo "$result" | jq -r '.jobs.running') │"
  echo "└─────────────────────────────────────────────────────────────────┘"
  echo ""
  
  # Show failed jobs
  local failed_count
  failed_count=$(echo "$result" | jq -r '.jobs.failed')
  
  if [[ "$failed_count" -gt 0 ]]; then
    echo -e "${RED}❌ FAILED JOBS:${NC}"
    echo "$result" | jq -r '.failed_jobs[]' | while read -r job; do
      echo -e "   ${RED}✗${NC} $job"
    done
    echo ""
    
    # Show critical failures
    local critical
    critical=$(echo "$result" | jq -r '.critical_failures | length')
    if [[ "$critical" -gt 0 ]]; then
      echo -e "${RED}🚨 CRITICAL FAILURES (blocking):${NC}"
      echo "$result" | jq -r '.critical_failures[]' | while read -r job; do
        echo -e "   ${RED}⛔${NC} $job"
      done
      echo ""
    fi
    
    echo -e "${YELLOW}💡 First job to fix: $(echo "$result" | jq -r '.first_failed_job')${NC}"
    echo ""
  fi
  
  # Show recommendation
  echo "───────────────────────────────────────────────────────────────────"
  local needs_fix all_passed is_running
  needs_fix=$(echo "$result" | jq -r '.needs_fix')
  all_passed=$(echo "$result" | jq -r '.all_passed')
  is_running=$(echo "$result" | jq -r '.is_running')
  
  if [[ "$all_passed" == "true" ]]; then
    echo -e "${GREEN}🎉 ALL CHECKPOINTS PASSED - PR IS PRODUCTION READY!${NC}"
  elif [[ "$needs_fix" == "true" ]]; then
    echo -e "${RED}🔧 ACTION REQUIRED: Run localstack-fixer to fix failures${NC}"
    echo -e "   Command: ${CYAN}/localstack-fixer $PR_NUMBER${NC}"
  elif [[ "$is_running" == "true" ]]; then
    echo -e "${YELLOW}⏳ Pipeline still running - waiting for completion...${NC}"
  fi
  echo "───────────────────────────────────────────────────────────────────"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# WAIT MODE - Monitor until completion
# ═══════════════════════════════════════════════════════════════════════════

wait_for_pipeline() {
  local pr_number="$1"
  local timeout="$2"
  local start_time elapsed
  start_time=$(date +%s)
  
  log_info "Monitoring CI/CD pipeline for PR #$pr_number (timeout: ${timeout}s)"
  echo ""
  
  while true; do
    elapsed=$(($(date +%s) - start_time))
    
    if [[ $elapsed -ge $timeout ]]; then
      log_error "Timeout reached after ${elapsed}s"
      return 2
    fi
    
    local result exit_code
    result=$(check_pipeline_status "$pr_number") || exit_code=$?
    exit_code=${exit_code:-0}
    
    local is_running all_passed needs_fix
    is_running=$(echo "$result" | jq -r '.is_running')
    all_passed=$(echo "$result" | jq -r '.all_passed')
    needs_fix=$(echo "$result" | jq -r '.needs_fix')
    
    if [[ "$JSON_OUTPUT" == "false" ]]; then
      clear 2>/dev/null || true
      display_checkpoints "$result"
      echo "⏱️  Elapsed: ${elapsed}s / ${timeout}s"
    fi
    
    if [[ "$all_passed" == "true" ]]; then
      if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "$result"
      fi
      return 0
    fi
    
    if [[ "$needs_fix" == "true" ]]; then
      if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "$result"
      fi
      return 1
    fi
    
    sleep $POLL_INTERVAL
  done
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════

main() {
  # Check GitHub CLI
  if ! command -v gh &>/dev/null; then
    log_error "GitHub CLI (gh) is not installed"
    exit 4
  fi
  
  if ! gh auth status &>/dev/null; then
    log_error "GitHub CLI is not authenticated. Run: gh auth login"
    exit 4
  fi
  
  if [[ "$WAIT_MODE" == "true" ]]; then
    wait_for_pipeline "$PR_NUMBER" "$TIMEOUT"
    exit $?
  else
    local result exit_code
    result=$(check_pipeline_status "$PR_NUMBER") || exit_code=$?
    exit_code=${exit_code:-0}
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
      echo "$result"
    else
      display_checkpoints "$result"
    fi
    
    exit $exit_code
  fi
}

main "$@"
