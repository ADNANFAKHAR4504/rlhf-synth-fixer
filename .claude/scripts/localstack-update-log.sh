#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# LocalStack Migration - Log Update Script
# ═══════════════════════════════════════════════════════════════════════════
# Updates the migration log with file locking for parallel-safe operations.
#
# Usage: ./localstack-update-log.sh <options>
#
# Required Options:
#   --task-path       Original task path
#   --status          Migration status (success, failed)
#
# Optional Options:
#   --pr-url          URL of created PR
#   --pr-number       PR number
#   --branch          Branch name
#   --ls-pr-id        LocalStack PR ID
#   --original-pr-id  Original PR ID
#   --platform        Platform type
#   --language        Language
#   --services        AWS services (JSON array)
#   --reason          Failure reason (for failed status)
#   --iterations      Number of fix iterations used
#
# Exit codes:
#   0 - Log updated successfully
#   1 - Failed to update log
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/localstack-common.sh"

# Setup error handling
setup_error_handling

# ═══════════════════════════════════════════════════════════════════════════
# PARSE ARGUMENTS
# ═══════════════════════════════════════════════════════════════════════════

TASK_PATH=""
STATUS=""
PR_URL=""
PR_NUMBER=""
BRANCH=""
LS_PR_ID=""
ORIGINAL_PR_ID=""
PLATFORM=""
LANGUAGE=""
AWS_SERVICES="[]"
REASON=""
ITERATIONS="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task-path)
      TASK_PATH="$2"
      shift 2
      ;;
    --status)
      STATUS="$2"
      shift 2
      ;;
    --pr-url)
      PR_URL="$2"
      shift 2
      ;;
    --pr-number)
      PR_NUMBER="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --ls-pr-id)
      LS_PR_ID="$2"
      shift 2
      ;;
    --original-pr-id)
      ORIGINAL_PR_ID="$2"
      shift 2
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --language)
      LANGUAGE="$2"
      shift 2
      ;;
    --services)
      AWS_SERVICES="$2"
      shift 2
      ;;
    --reason)
      REASON="$2"
      shift 2
      ;;
    --iterations)
      ITERATIONS="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 --task-path <path> --status <success|failed> [options]"
      echo ""
      echo "Required:"
      echo "  --task-path     Original task path"
      echo "  --status        Migration status (success, failed)"
      echo ""
      echo "Optional:"
      echo "  --pr-url        URL of created PR"
      echo "  --pr-number     PR number"
      echo "  --branch        Branch name"
      echo "  --ls-pr-id      LocalStack PR ID"
      echo "  --original-pr-id Original PR ID"
      echo "  --platform      Platform type"
      echo "  --language      Language"
      echo "  --services      AWS services (JSON array)"
      echo "  --reason        Failure reason"
      echo "  --iterations    Fix iterations used"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

# Validate required arguments
if [ -z "$TASK_PATH" ] || [ -z "$STATUS" ]; then
  log_error "Missing required arguments: --task-path and --status"
  echo "Run with --help for usage information"
  exit 1
fi

log_info "Updating migration log (with file locking)..."

# ═══════════════════════════════════════════════════════════════════════════
# PREPARE LOG ENTRY
# ═══════════════════════════════════════════════════════════════════════════

TIMESTAMP=$(date -Iseconds)

# Build JSON entry
MIGRATION_ENTRY=$(jq -n \
  --arg task_path "$TASK_PATH" \
  --arg pr_url "${PR_URL:-}" \
  --arg pr_number "${PR_NUMBER:-}" \
  --arg branch "${BRANCH:-}" \
  --arg platform "${PLATFORM:-}" \
  --arg language "${LANGUAGE:-}" \
  --arg ls_pr_id "${LS_PR_ID:-}" \
  --arg original_pr_id "${ORIGINAL_PR_ID:-}" \
  --argjson aws_services "$AWS_SERVICES" \
  --arg status "$STATUS" \
  --arg reason "${REASON:-}" \
  --arg iterations "$ITERATIONS" \
  --arg timestamp "$TIMESTAMP" \
  '{
    task_path: $task_path,
    new_pr_url: (if $pr_url != "" then $pr_url else null end),
    new_pr_number: (if $pr_number != "" then $pr_number else null end),
    branch: (if $branch != "" then $branch else null end),
    platform: $platform,
    language: $language,
    ls_pr_id: (if $ls_pr_id != "" then $ls_pr_id else null end),
    original_pr_id: (if $original_pr_id != "" then $original_pr_id else null end),
    aws_services: $aws_services,
    status: $status,
    reason: (if $reason != "" then $reason else null end),
    iterations_used: ($iterations | tonumber),
    attempted_at: $timestamp
  }')

# ═══════════════════════════════════════════════════════════════════════════
# ACQUIRE LOCK AND UPDATE LOG
# ═══════════════════════════════════════════════════════════════════════════

LOCK_FILE="$PROJECT_ROOT/.claude/reports/.migration-log.lock"

# Ensure log directory exists
mkdir -p "$(dirname "$MIGRATION_LOG")"

# Acquire lock
if acquire_lock "$LOCK_FILE" 30; then
  log_debug "Lock acquired"
  
  # Register cleanup to release lock
  release_migration_lock() {
    release_lock "$LOCK_FILE"
    log_debug "Lock released"
  }
  register_cleanup release_migration_lock
  
  # Initialize log if needed
  if [ ! -f "$MIGRATION_LOG" ]; then
    cat > "$MIGRATION_LOG" << 'EOFLOG'
{
  "created_at": "",
  "migrations": [],
  "summary": {
    "total_attempted": 0,
    "successful": 0,
    "failed": 0
  }
}
EOFLOG
    jq --arg ts "$(date -Iseconds)" '.created_at = $ts' "$MIGRATION_LOG" > "${MIGRATION_LOG}.tmp.$$"
    mv "${MIGRATION_LOG}.tmp.$$" "$MIGRATION_LOG"
  fi
  
  # Update the log
  jq --argjson entry "$MIGRATION_ENTRY" --arg status "$STATUS" '
    .migrations += [$entry] |
    .summary.total_attempted += 1 |
    if $status == "success" then .summary.successful += 1 else .summary.failed += 1 end
  ' "$MIGRATION_LOG" > "${MIGRATION_LOG}.tmp.$$"
  
  mv "${MIGRATION_LOG}.tmp.$$" "$MIGRATION_LOG"
  
  log_success "Migration log updated"
else
  log_warn "Could not acquire lock, attempting update anyway..."
  
  # Fallback: update without lock (race condition possible but better than not logging)
  if [ -f "$MIGRATION_LOG" ]; then
    jq --argjson entry "$MIGRATION_ENTRY" --arg status "$STATUS" '
      .migrations += [$entry] |
      .summary.total_attempted += 1 |
      if $status == "success" then .summary.successful += 1 else .summary.failed += 1 end
    ' "$MIGRATION_LOG" > "${MIGRATION_LOG}.tmp.$$"
    
    mv "${MIGRATION_LOG}.tmp.$$" "$MIGRATION_LOG"
    log_success "Migration log updated (without lock)"
  else
    log_error "Migration log not found and could not be created"
    exit 1
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════
# OUTPUT SUMMARY
# ═══════════════════════════════════════════════════════════════════════════

# Get current stats
TOTAL=$(jq '.summary.total_attempted' "$MIGRATION_LOG" 2>/dev/null || echo "?")
SUCCESSFUL=$(jq '.summary.successful' "$MIGRATION_LOG" 2>/dev/null || echo "?")
FAILED=$(jq '.summary.failed' "$MIGRATION_LOG" 2>/dev/null || echo "?")

echo ""
echo "  Status:     $STATUS"
echo "  Task:       $TASK_PATH"
echo "  Log:        $MIGRATION_LOG"
echo ""
echo "  Summary:"
echo "    Total:      $TOTAL"
echo "    Successful: $SUCCESSFUL"
echo "    Failed:     $FAILED"
echo ""

