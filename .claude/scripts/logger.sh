#!/bin/bash
# Structured logging for iac-synth-trainer
# Provides JSON-formatted logs with context for debugging and monitoring

set -euo pipefail

# Configuration (can be overridden via environment variables)
LOG_LEVEL="${LOG_LEVEL:-INFO}"
LOG_FORMAT="${LOG_FORMAT:-json}"
LOG_TO_FILE="${LOG_TO_FILE:-true}"
LOG_DIR="${LOG_DIR:-/tmp/synth-trainer-logs}"
LOG_FILE="${LOG_FILE:-${LOG_DIR}/synth-trainer-$(date +%Y%m%d).log}"

# Context variables (set by calling scripts)
export PR_NUMBER="${PR_NUMBER:-}"
export TASK_ID="${TASK_ID:-}"
export CURRENT_PHASE="${CURRENT_PHASE:-}"
export CURRENT_ITERATION="${CURRENT_ITERATION:-0}"

# Log levels (numeric for comparison)
declare -A LOG_LEVELS=(
    ["DEBUG"]=0
    ["INFO"]=1
    ["WARN"]=2
    ["ERROR"]=3
)

# Initialize logging
init_logging() {
    if [ "$LOG_TO_FILE" = "true" ]; then
        mkdir -p "$LOG_DIR"
        touch "$LOG_FILE"
    fi
}

# Check if log level should be output
should_log() {
    local level="$1"
    local current_level="${LOG_LEVELS[$LOG_LEVEL]:-1}"
    local message_level="${LOG_LEVELS[$level]:-1}"
    
    [ "$message_level" -ge "$current_level" ]
}

# Format log entry as JSON
format_json() {
    local level="$1"
    local message="$2"
    local extra="${3:-}"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    local json_entry
    json_entry=$(jq -n \
        --arg ts "$timestamp" \
        --arg level "$level" \
        --arg msg "$message" \
        --arg pr "${PR_NUMBER:-}" \
        --arg task "${TASK_ID:-}" \
        --arg phase "${CURRENT_PHASE:-}" \
        --arg iter "${CURRENT_ITERATION:-0}" \
        '{
            timestamp: $ts,
            level: $level,
            message: $msg,
            context: {
                pr: $pr,
                task: $task,
                phase: $phase,
                iteration: ($iter | tonumber)
            }
        }')
    
    # Add extra fields if provided
    if [ -n "$extra" ]; then
        json_entry=$(echo "$json_entry" | jq --argjson extra "$extra" '. + {extra: $extra}')
    fi
    
    echo "$json_entry"
}

# Format log entry as text
format_text() {
    local level="$1"
    local message="$2"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    local context=""
    [ -n "$PR_NUMBER" ] && context+="PR#${PR_NUMBER} "
    [ -n "$TASK_ID" ] && context+="Task:${TASK_ID} "
    [ -n "$CURRENT_PHASE" ] && context+="Phase:${CURRENT_PHASE} "
    
    echo "[$timestamp] [$level] ${context}${message}"
}

# Main log function
log() {
    local level="$1"
    shift
    local message="$*"
    
    # Check if we should log this level
    if ! should_log "$level"; then
        return 0
    fi
    
    # Format the log entry
    local log_entry
    if [ "$LOG_FORMAT" = "json" ]; then
        log_entry=$(format_json "$level" "$message")
    else
        log_entry=$(format_text "$level" "$message")
    fi
    
    # Output to file if enabled
    if [ "$LOG_TO_FILE" = "true" ] && [ -n "$LOG_FILE" ]; then
        echo "$log_entry" >> "$LOG_FILE"
    fi
    
    # Output to console with emoji indicators
    case "$level" in
        ERROR)
            echo "❌ $message" >&2
            ;;
        WARN)
            echo "⚠️  $message" >&2
            ;;
        INFO)
            echo "ℹ️  $message"
            ;;
        DEBUG)
            echo "🔍 $message"
            ;;
    esac
}

# Convenience functions
log_debug() { log "DEBUG" "$@"; }
log_info()  { log "INFO" "$@"; }
log_warn()  { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }

# Log with extra JSON data
log_with_data() {
    local level="$1"
    local message="$2"
    local extra_json="$3"
    
    if ! should_log "$level"; then
        return 0
    fi
    
    local log_entry
    log_entry=$(format_json "$level" "$message" "$extra_json")
    
    if [ "$LOG_TO_FILE" = "true" ] && [ -n "$LOG_FILE" ]; then
        echo "$log_entry" >> "$LOG_FILE"
    fi
    
    # Console output
    case "$level" in
        ERROR) echo "❌ $message" >&2 ;;
        WARN)  echo "⚠️  $message" >&2 ;;
        INFO)  echo "ℹ️  $message" ;;
        DEBUG) echo "🔍 $message" ;;
    esac
}

# Log phase start
log_phase_start() {
    local phase="$1"
    export CURRENT_PHASE="$phase"
    log_info "Starting phase: $phase"
}

# Log phase end
log_phase_end() {
    local phase="$1"
    local status="${2:-success}"
    log_info "Completed phase: $phase (status: $status)"
}

# Log iteration start
log_iteration_start() {
    local iteration="$1"
    local max_iterations="$2"
    export CURRENT_ITERATION="$iteration"
    log_info "Starting iteration $iteration/$max_iterations"
}

# Log CI/CD job status
log_cicd_status() {
    local job_name="$1"
    local status="$2"
    local details="${3:-}"
    
    local extra_json
    extra_json=$(jq -n \
        --arg job "$job_name" \
        --arg status "$status" \
        --arg details "$details" \
        '{job: $job, status: $status, details: $details}')
    
    case "$status" in
        success)
            log_with_data "INFO" "CI/CD job passed: $job_name" "$extra_json"
            ;;
        failure)
            log_with_data "ERROR" "CI/CD job failed: $job_name" "$extra_json"
            ;;
        skipped)
            log_with_data "INFO" "CI/CD job skipped: $job_name" "$extra_json"
            ;;
        *)
            log_with_data "INFO" "CI/CD job status: $job_name - $status" "$extra_json"
            ;;
    esac
}

# Log fix application
log_fix_applied() {
    local description="$1"
    local files_modified="$2"
    
    local extra_json
    extra_json=$(jq -n \
        --arg desc "$description" \
        --arg files "$files_modified" \
        '{description: $desc, files_modified: $files}')
    
    log_with_data "INFO" "Fix applied: $description" "$extra_json"
}

# Log validation result
log_validation_result() {
    local checkpoint="$1"
    local passed="$2"
    local details="${3:-}"
    
    local extra_json
    extra_json=$(jq -n \
        --arg checkpoint "$checkpoint" \
        --argjson passed "$passed" \
        --arg details "$details" \
        '{checkpoint: $checkpoint, passed: $passed, details: $details}')
    
    if [ "$passed" = "true" ]; then
        log_with_data "INFO" "Validation passed: $checkpoint" "$extra_json"
    else
        log_with_data "ERROR" "Validation failed: $checkpoint" "$extra_json"
    fi
}

# Log deployment attempt
log_deployment_attempt() {
    local attempt="$1"
    local max_attempts="$2"
    local status="$3"
    
    local extra_json
    extra_json=$(jq -n \
        --arg attempt "$attempt" \
        --arg max "$max_attempts" \
        --arg status "$status" \
        '{attempt: $attempt, max_attempts: $max, status: $status}')
    
    log_with_data "INFO" "Deployment attempt $attempt/$max_attempts: $status" "$extra_json"
}

# Get log file path
get_log_file() {
    echo "$LOG_FILE"
}

# Tail recent logs
tail_logs() {
    local lines="${1:-50}"
    if [ -f "$LOG_FILE" ]; then
        tail -n "$lines" "$LOG_FILE"
    else
        echo "No log file found at $LOG_FILE"
    fi
}

# Initialize logging on source
init_logging

# Export functions for use in other scripts
export -f log log_debug log_info log_warn log_error
export -f log_with_data log_phase_start log_phase_end
export -f log_iteration_start log_cicd_status log_fix_applied
export -f log_validation_result log_deployment_attempt
export -f get_log_file tail_logs

