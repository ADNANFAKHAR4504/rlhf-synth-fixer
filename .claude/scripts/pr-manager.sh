#!/bin/bash
# PR Manager - Thread-safe PR selection and status management
# Similar to task-manager.sh but for PR tracking
# Supports parallel agent execution with file locking

set -euo pipefail

# Determine script directory and repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PR_STATUS_FILE="${PR_STATUS_FILE:-$REPO_ROOT/.claude/synth_pr_status.json}"
BACKUP_FILE="${BACKUP_FILE:-$REPO_ROOT/.claude/synth_pr_status.json.backup}"
LOCK_FILE="${LOCK_FILE:-$REPO_ROOT/.claude/synth_pr_status.json.lock}"
LOCK_TIMEOUT="${LOCK_TIMEOUT:-120}"  # Maximum seconds to wait for lock

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info() { echo -e "${GREEN}✅ $1${NC}" >&2; }
log_error() { echo -e "${RED}❌ $1${NC}" >&2; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}" >&2; }
log_debug() { echo -e "${BLUE}🔍 $1${NC}" >&2; }

# Acquire exclusive lock with timeout
# Uses mkdir for atomicity (portable across all Unix systems)
acquire_lock() {
    local elapsed=0
    local wait_interval=0.1
    
    log_debug "Attempting to acquire lock (PID: $$)..."
    
    while ! mkdir "$LOCK_FILE" 2>/dev/null; do
        sleep "$wait_interval"
        elapsed=$(awk "BEGIN {print $elapsed + $wait_interval}")
        
        if (( $(awk "BEGIN {print ($elapsed >= $LOCK_TIMEOUT)}") )); then
            # Check if lock is stale (older than 5 minutes)
            if [ -d "$LOCK_FILE" ]; then
                local lock_age
                lock_age=$(($(date +%s) - $(stat -f %m "$LOCK_FILE" 2>/dev/null || stat -c %Y "$LOCK_FILE" 2>/dev/null || echo 0)))
                if [ "$lock_age" -gt 300 ]; then
                    log_warn "Removing stale lock (age: ${lock_age}s)"
                    rmdir "$LOCK_FILE" 2>/dev/null || true
                    continue
                fi
            fi
            log_error "Failed to acquire lock after ${LOCK_TIMEOUT}s"
            return 1
        fi
        
        # Log every 5 seconds
        if (( $(awk "BEGIN {print (int($elapsed) % 5 == 0 && $elapsed > 0)}") )); then
            log_warn "Waiting for lock... (${elapsed}s elapsed)"
        fi
    done
    
    # Write PID and agent info to lock directory
    echo $$ > "$LOCK_FILE/pid" 2>/dev/null || true
    echo "$AGENT_ID" > "$LOCK_FILE/agent_id" 2>/dev/null || true
    date +%s > "$LOCK_FILE/timestamp" 2>/dev/null || true
    
    log_debug "Lock acquired (PID: $$, Agent: ${AGENT_ID:-unknown})"
    return 0
}

# Release lock
release_lock() {
    if [ -d "$LOCK_FILE" ]; then
        rm -f "$LOCK_FILE/pid" "$LOCK_FILE/agent_id" "$LOCK_FILE/timestamp" 2>/dev/null || true
        rmdir "$LOCK_FILE" 2>/dev/null || true
        log_debug "Lock released (PID: $$)"
    fi
}

# Backup status file
backup() {
    if [ -f "$PR_STATUS_FILE" ]; then
        cp "$PR_STATUS_FILE" "$BACKUP_FILE"
        log_debug "Backup created: $BACKUP_FILE"
    fi
}

# Restore from backup
restore() {
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" "$PR_STATUS_FILE"
        log_warn "Restored from backup: $BACKUP_FILE"
    fi
}

# Validate JSON file
validate_json() {
    if ! jq empty "$PR_STATUS_FILE" 2>/dev/null; then
        log_error "Invalid JSON in $PR_STATUS_FILE"
        return 1
    fi
    return 0
}

# Select next available PR (pending status, assigned to current assignee)
# Returns PR details as JSON
select_pr() {
    local assignee="${1:-}"
    
    [ ! -f "$PR_STATUS_FILE" ] && { log_error "Status file not found: $PR_STATUS_FILE"; exit 1; }
    
    if ! validate_json; then
        log_error "Invalid JSON file"
        exit 1
    fi
    
    # Select first PR with agent_status = "pending" or without agent_status field
    local pr_json
    if [ -n "$assignee" ]; then
        # Filter by assignee
        pr_json=$(jq -r --arg assignee "$assignee" '
            .pull_requests_by_status.FAILED.by_failure_reason 
            | to_entries[] 
            | .value[] 
            | select(.assignee == $assignee)
            | select(.agent_status == null or .agent_status == "pending")
            | @json
        ' "$PR_STATUS_FILE" 2>/dev/null | head -1)
    else
        # No assignee filter
        pr_json=$(jq -r '
            .pull_requests_by_status.FAILED.by_failure_reason 
            | to_entries[] 
            | .value[] 
            | select(.agent_status == null or .agent_status == "pending")
            | @json
        ' "$PR_STATUS_FILE" 2>/dev/null | head -1)
    fi
    
    if [ -z "$pr_json" ] || [ "$pr_json" = "null" ]; then
        log_warn "No pending PRs available"
        exit 2
    fi
    
    echo "$pr_json"
}

# Atomic select and update
# Selects next pending PR and marks it as in_progress
select_and_update() {
    local assignee="${1:-}"
    local pr_json
    local pr_number
    local exit_code=0
    
    # Generate agent ID (PID + hostname)
    export AGENT_ID="${AGENT_ID:-agent-$$-$(hostname -s)}"
    
    # Acquire exclusive lock
    if ! acquire_lock; then
        log_error "Could not acquire lock for select_and_update"
        exit 1
    fi
    
    # Ensure lock is released on exit
    trap "release_lock" EXIT INT TERM
    
    # Backup before any changes
    backup
    
    # Critical section - select PR
    pr_json=$(select_pr "$assignee") || exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        release_lock
        exit $exit_code
    fi
    
    # Extract PR number
    pr_number=$(echo "$pr_json" | jq -r '.pr_number')
    
    if [ -z "$pr_number" ] || [ "$pr_number" = "null" ]; then
        log_error "Could not extract PR number from selection"
        release_lock
        exit 1
    fi
    
    log_info "Selected PR #${pr_number}"
    
    # Update PR status to in_progress with agent info
    local temp_file
    temp_file=$(mktemp)
    
    if ! jq --arg pr "$pr_number" \
            --arg agent "$AGENT_ID" \
            --arg timestamp "$(date -Iseconds)" \
            '
            (.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.pr_number == ($pr | tonumber))) |= 
            . + {
                agent_status: "in_progress",
                assigned_agent: $agent,
                started_at: $timestamp,
                fix_progress: "Selected by agent"
            }
            ' "$PR_STATUS_FILE" > "$temp_file"; then
        log_error "Failed to update PR status"
        rm -f "$temp_file"
        release_lock
        exit 1
    fi
    
    # Validate updated JSON
    if ! jq empty "$temp_file" 2>/dev/null; then
        log_error "Updated JSON is invalid"
        rm -f "$temp_file"
        release_lock
        exit 1
    fi
    
    # Move updated file
    mv "$temp_file" "$PR_STATUS_FILE"
    log_info "PR #${pr_number} marked as in_progress by $AGENT_ID"
    
    # Release lock
    release_lock
    trap - EXIT INT TERM
    
    # Return updated PR JSON with new fields
    jq -r --arg pr "$pr_number" \
        '.pull_requests_by_status.FAILED.by_failure_reason 
        | to_entries[] 
        | .value[] 
        | select(.pr_number == ($pr | tonumber))
        | @json' "$PR_STATUS_FILE" | head -1
}

# Update PR status
# Usage: update_status <pr_number> <status> [progress_note]
update_status() {
    local pr_number="$1"
    local new_status="${2:-in_progress}"
    local progress_note="${3:-}"
    
    [ ! -f "$PR_STATUS_FILE" ] && { log_error "Status file not found"; exit 1; }
    
    # Acquire lock
    if ! acquire_lock; then
        log_error "Could not acquire lock for update_status"
        exit 1
    fi
    trap "release_lock" EXIT INT TERM
    
    backup
    
    local temp_file
    temp_file=$(mktemp)
    
    # Build jq update expression
    local jq_update='
        (.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.pr_number == ($pr | tonumber))) |= 
        . + {
            agent_status: $status
        }
    '
    
    if [ -n "$progress_note" ]; then
        jq_update='
            (.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.pr_number == ($pr | tonumber))) |= 
            . + {
                agent_status: $status,
                fix_progress: $progress
            }
        '
    fi
    
    if [ "$new_status" = "fixed" ] || [ "$new_status" = "failed" ]; then
        jq_update='
            (.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.pr_number == ($pr | tonumber))) |= 
            . + {
                agent_status: $status,
                fix_progress: $progress,
                completed_at: $timestamp
            }
        '
    fi
    
    if ! jq --arg pr "$pr_number" \
            --arg status "$new_status" \
            --arg progress "$progress_note" \
            --arg timestamp "$(date -Iseconds)" \
            "$jq_update" "$PR_STATUS_FILE" > "$temp_file"; then
        log_error "Failed to update PR #${pr_number}"
        rm -f "$temp_file"
        release_lock
        exit 1
    fi
    
    if ! validate_json "$temp_file" 2>/dev/null; then
        log_error "Updated JSON is invalid"
        rm -f "$temp_file"
        release_lock
        exit 1
    fi
    
    mv "$temp_file" "$PR_STATUS_FILE"
    log_info "PR #${pr_number} updated to ${new_status}"
    
    release_lock
    trap - EXIT INT TERM
}

# Update PR with detailed analysis
# Usage: update_analysis <pr_number> <root_cause> <fix_plan> <solution_approach>
update_analysis() {
    local pr_number="$1"
    local root_cause="$2"
    local fix_plan="$3"
    local solution_approach="$4"
    
    [ ! -f "$PR_STATUS_FILE" ] && { log_error "Status file not found"; exit 1; }
    
    if ! acquire_lock; then
        log_error "Could not acquire lock for update_analysis"
        exit 1
    fi
    trap "release_lock" EXIT INT TERM
    
    backup
    
    local temp_file
    temp_file=$(mktemp)
    
    if ! jq --arg pr "$pr_number" \
            --arg root_cause "$root_cause" \
            --arg fix_plan "$fix_plan" \
            --arg solution "$solution_approach" \
            '
            (.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.pr_number == ($pr | tonumber))) |= 
            . + {
                root_cause_analysis: $root_cause,
                fix_plan: $fix_plan,
                solution_approach: $solution
            }
            ' "$PR_STATUS_FILE" > "$temp_file"; then
        log_error "Failed to update analysis for PR #${pr_number}"
        rm -f "$temp_file"
        release_lock
        exit 1
    fi
    
    mv "$temp_file" "$PR_STATUS_FILE"
    log_info "PR #${pr_number} analysis documented"
    
    release_lock
    trap - EXIT INT TERM
}

# Get PR details
get_pr() {
    local pr_number="$1"
    
    [ ! -f "$PR_STATUS_FILE" ] && { log_error "Status file not found"; exit 1; }
    
    jq -r --arg pr "$pr_number" \
        '.pull_requests_by_status.FAILED.by_failure_reason 
        | to_entries[] 
        | .value[] 
        | select(.pr_number == ($pr | tonumber))' "$PR_STATUS_FILE" | head -1
}

# Show status distribution
show_status() {
    [ ! -f "$PR_STATUS_FILE" ] && { log_error "Status file not found"; exit 1; }
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PR Status Distribution"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Count by agent_status
    local pending=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == null or .agent_status == "pending")] | length' "$PR_STATUS_FILE")
    local in_progress=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "in_progress")] | length' "$PR_STATUS_FILE")
    local fixed=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "fixed")] | length' "$PR_STATUS_FILE")
    local failed=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "failed")] | length' "$PR_STATUS_FILE")
    local total=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[]] | length' "$PR_STATUS_FILE")
    
    echo "Total PRs: $total"
    echo "  Pending: $pending"
    echo "  In Progress: $in_progress"
    echo "  Fixed: $fixed"
    echo "  Failed: $failed"
    echo ""
    
    # Show in-progress PRs with agent assignments
    if [ "$in_progress" -gt 0 ]; then
        echo "Currently Being Fixed:"
        jq -r '.pull_requests_by_status.FAILED.by_failure_reason 
            | to_entries[] 
            | .value[] 
            | select(.agent_status == "in_progress")
            | "  PR #\(.pr_number) - \(.assigned_agent // "unknown") - \(.fix_progress // "no progress info")"' "$PR_STATUS_FILE"
        echo ""
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Command dispatcher
case "${1:-help}" in
    select)
        shift
        select_pr "$@"
        ;;
    select-and-update)
        shift
        select_and_update "$@"
        ;;
    update-status)
        shift
        update_status "$@"
        ;;
    update-analysis)
        shift
        update_analysis "$@"
        ;;
    get)
        get_pr "$2"
        ;;
    status)
        show_status
        ;;
    *)
        cat <<'EOF'
PR Manager - Thread-safe PR selection and status management
Supports parallel agent execution with file locking

Usage: ./scripts/pr-manager.sh <command> [args]

Commands:
    select [assignee]                       Select next pending PR (read-only)
    select-and-update [assignee]            Select and mark in_progress (atomic, locked)
    update-status <pr> <status> [note]      Update PR status (locked)
    update-analysis <pr> <root> <plan> <sol> Document analysis (locked)
    get <pr>                                Get PR details
    status                                  Show status distribution

Status Values:
    pending      - Not yet started (default)
    in_progress  - Agent currently working on it
    fixed        - Successfully fixed
    failed       - Could not be fixed
    skipped      - Intentionally skipped

Environment:
    PR_STATUS_FILE   Status file path (default: .claude/synth_pr_status.json)
    BACKUP_FILE      Backup path (default: .claude/synth_pr_status.json.backup)
    LOCK_FILE        Lock file path (default: .claude/synth_pr_status.json.lock)
    LOCK_TIMEOUT     Lock timeout in seconds (default: 120)
    AGENT_ID         Agent identifier (default: agent-$$-hostname)

Examples:
    # Atomic select and update (recommended for parallel workflows)
    PR_JSON=$(./scripts/pr-manager.sh select-and-update mayanksethi-turing)
    PR_NUMBER=$(echo "$PR_JSON" | jq -r '.pr_number')
    
    # Update status with progress note
    ./scripts/pr-manager.sh update-status 6323 in_progress "Analyzing failures"
    
    # Document root cause and plan
    ./scripts/pr-manager.sh update-analysis 6323 \
        "Missing environmentSuffix in resource names" \
        "1. Add environmentSuffix to all resources 2. Fix RemovalPolicy 3. Redeploy" \
        "Systematic resource name updates followed by validation"
    
    # Mark as complete
    ./scripts/pr-manager.sh update-status 6323 fixed "All pipeline stages passed"
    
    # Check status
    ./scripts/pr-manager.sh status

Parallel Execution:
    ✅ Safe to run multiple instances simultaneously
    ✅ Automatic file locking prevents race conditions
    ✅ Each agent gets a unique PR (no duplicates)
    ⚠️  If lock timeout is reached, process will fail gracefully

Dependencies: jq (for JSON parsing)
Lock Mechanism: Uses atomic mkdir (portable across Linux, macOS, BSD)
EOF
        ;;
esac

