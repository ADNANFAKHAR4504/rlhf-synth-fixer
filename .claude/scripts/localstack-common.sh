#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# LocalStack Migration - Common Functions and Configuration
# ═══════════════════════════════════════════════════════════════════════════
# This script provides common utilities used by all localstack-* scripts:
# - Error handling with trap handlers
# - Configuration loading from localstack.yaml
# - Logging utilities
# - Cleanup functions
#
# Usage: source this file at the beginning of other scripts
#   source "$(dirname "$0")/localstack-common.sh"
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# SCRIPT DIRECTORY AND PROJECT ROOT
# ═══════════════════════════════════════════════════════════════════════════
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION LOADING
# ═══════════════════════════════════════════════════════════════════════════
CONFIG_FILE="$PROJECT_ROOT/.claude/config/localstack.yaml"

# Load configuration value from YAML using yq or jq fallback
# Usage: config_get "path.to.value" "default_value"
config_get() {
  local path="$1"
  local default="${2:-}"
  
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "$default"
    return
  fi
  
  # Try yq first, fall back to parsing with grep/sed for simple cases
  if command -v yq &> /dev/null; then
    local value
    value=$(yq -r ".$path // \"$default\"" "$CONFIG_FILE" 2>/dev/null || echo "$default")
    echo "$value"
  else
    # Simple fallback for basic key-value pairs
    local key="${path##*.}"
    local value
    value=$(grep -E "^\s*${key}:" "$CONFIG_FILE" 2>/dev/null | head -1 | sed "s/.*${key}:\s*['\"]*//" | sed "s/['\"].*$//" || echo "$default")
    if [ -z "$value" ]; then
      echo "$default"
    else
      echo "$value"
    fi
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION DEFAULTS (loaded from config or fallback)
# ═══════════════════════════════════════════════════════════════════════════
GITHUB_REPO="${GITHUB_REPO:-$(config_get 'github.repo' 'TuringGpt/iac-test-automations')}"
LOCALSTACK_ENDPOINT="${LOCALSTACK_ENDPOINT:-$(config_get 'localstack.endpoint' 'http://localhost:4566')}"
LOCALSTACK_REGION="${LOCALSTACK_REGION:-$(config_get 'localstack.region' 'us-east-1')}"
LOCALSTACK_ACCOUNT_ID="${LOCALSTACK_ACCOUNT_ID:-$(config_get 'localstack.account_id' '000000000000')}"
MAX_FIX_ITERATIONS="${MAX_FIX_ITERATIONS:-$(config_get 'iteration.max_fix_iterations' '3')}"
MIGRATION_LOG_PATH="${MIGRATION_LOG_PATH:-$(config_get 'migration_log.path' '.claude/reports/localstack-migrations.json')}"
MIGRATION_LOG="$PROJECT_ROOT/$MIGRATION_LOG_PATH"
WORKTREE_BASE="${WORKTREE_BASE:-$(config_get 'worktree.base_path' 'worktree')}"

# Export for use in subshells
export GITHUB_REPO LOCALSTACK_ENDPOINT LOCALSTACK_REGION LOCALSTACK_ACCOUNT_ID
export MAX_FIX_ITERATIONS MIGRATION_LOG PROJECT_ROOT WORKTREE_BASE

# ═══════════════════════════════════════════════════════════════════════════
# COLORS AND FORMATTING
# ═══════════════════════════════════════════════════════════════════════════
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════
# LOGGING FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════
log_info() {
  echo -e "${BLUE}ℹ️  $*${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $*${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠️  $*${NC}" >&2
}

log_error() {
  echo -e "${RED}❌ $*${NC}" >&2
}

log_debug() {
  if [ "${DEBUG:-false}" = "true" ]; then
    echo -e "${CYAN}🔍 $*${NC}"
  fi
}

log_header() {
  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}$*${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
  echo ""
}

log_section() {
  echo ""
  echo -e "${CYAN}───────────────────────────────────────────────────${NC}"
  echo -e "${CYAN}$*${NC}"
  echo -e "${CYAN}───────────────────────────────────────────────────${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# ERROR HANDLING WITH TRAP
# ═══════════════════════════════════════════════════════════════════════════
# Track cleanup functions to run on exit
declare -a CLEANUP_FUNCTIONS=()

# Register a cleanup function
# Usage: register_cleanup "function_name"
register_cleanup() {
  CLEANUP_FUNCTIONS+=("$1")
}

# Run all registered cleanup functions
run_cleanup() {
  local exit_code=$?
  
  # Disable error exit during cleanup
  set +e
  
  for cleanup_fn in "${CLEANUP_FUNCTIONS[@]}"; do
    if declare -f "$cleanup_fn" > /dev/null; then
      log_debug "Running cleanup: $cleanup_fn"
      "$cleanup_fn" || true
    fi
  done
  
  return $exit_code
}

# Error handler - called when a command fails
error_handler() {
  local exit_code=$?
  local line_number=$1
  local command="$2"
  
  log_error "Command failed at line $line_number: $command (exit code: $exit_code)"
  
  # Show stack trace if DEBUG is enabled
  if [ "${DEBUG:-false}" = "true" ]; then
    log_debug "Stack trace:"
    local i=0
    while caller $i; do
      ((i++))
    done 2>/dev/null
  fi
  
  return $exit_code
}

# Setup error handling
setup_error_handling() {
  # Trap ERR signal to log errors
  trap 'error_handler $LINENO "$BASH_COMMAND"' ERR
  
  # Trap EXIT to run cleanup
  trap 'run_cleanup' EXIT
  
  # Trap INT and TERM for graceful shutdown
  trap 'log_warn "Interrupted, cleaning up..."; exit 130' INT
  trap 'log_warn "Terminated, cleaning up..."; exit 143' TERM
}

# ═══════════════════════════════════════════════════════════════════════════
# PREREQUISITE CHECKS
# ═══════════════════════════════════════════════════════════════════════════

# Check if a command exists
require_command() {
  local cmd="$1"
  local install_hint="${2:-}"
  
  if ! command -v "$cmd" &> /dev/null; then
    log_error "Required command not found: $cmd"
    if [ -n "$install_hint" ]; then
      echo "  💡 Install with: $install_hint"
    fi
    return 1
  fi
  return 0
}

# Check LocalStack is running
check_localstack() {
  local endpoint="${1:-$LOCALSTACK_ENDPOINT}"
  
  log_info "Checking LocalStack at $endpoint..."
  
  if ! curl -s "${endpoint}/_localstack/health" > /dev/null 2>&1; then
    log_error "LocalStack is not running at $endpoint"
    echo ""
    echo "  💡 Start LocalStack with:"
    echo "     ./scripts/localstack-start.sh"
    echo ""
    return 1
  fi
  
  local version
  version=$(curl -s "${endpoint}/_localstack/health" | jq -r '.version // "unknown"' 2>/dev/null || echo "unknown")
  log_success "LocalStack is running (version: $version)"
  
  export LOCALSTACK_VERSION="$version"
  return 0
}

# Check GitHub CLI authentication
check_github_cli() {
  if ! require_command "gh" "brew install gh (macOS) or sudo apt install gh (Linux)"; then
    return 1
  fi
  
  if ! gh auth status &> /dev/null; then
    log_error "GitHub CLI is not authenticated"
    echo ""
    echo "  💡 Authenticate with:"
    echo "     gh auth login"
    echo ""
    return 1
  fi
  
  log_success "GitHub CLI authenticated"
  return 0
}

# ═══════════════════════════════════════════════════════════════════════════
# GIT WORKTREE UTILITIES
# ═══════════════════════════════════════════════════════════════════════════

# Create a git worktree safely
# Usage: create_worktree "worktree_path" "branch_name" ["base_ref"]
create_worktree() {
  local worktree_path="$1"
  local branch_name="$2"
  local base_ref="${3:-origin/main}"
  
  # Clean existing worktree if present
  if [ -d "$worktree_path" ]; then
    log_warn "Cleaning existing worktree at $worktree_path"
    git worktree remove "$worktree_path" --force 2>/dev/null || rm -rf "$worktree_path"
  fi
  
  # Delete branch if exists locally
  if git show-ref --verify --quiet "refs/heads/$branch_name"; then
    log_debug "Deleting existing local branch: $branch_name"
    git branch -D "$branch_name" 2>/dev/null || true
  fi
  
  # Fetch latest
  log_debug "Fetching latest from origin..."
  git fetch origin main:main 2>/dev/null || git fetch origin main 2>/dev/null || true
  
  # Create worktree with new branch
  log_info "Creating worktree at $worktree_path..."
  if ! git worktree add -b "$branch_name" "$worktree_path" "$base_ref" 2>/dev/null; then
    # Try alternative base ref
    git worktree add -b "$branch_name" "$worktree_path" main 2>/dev/null || {
      log_error "Failed to create git worktree"
      return 1
    }
  fi
  
  log_success "Worktree created: $worktree_path"
  return 0
}

# Cleanup a git worktree
# Usage: cleanup_worktree "worktree_path"
cleanup_worktree() {
  local worktree_path="$1"
  
  if [ -d "$worktree_path" ]; then
    log_debug "Removing worktree: $worktree_path"
    git worktree remove "$worktree_path" --force 2>/dev/null || rm -rf "$worktree_path"
  fi
  
  # Prune orphaned worktrees
  git worktree prune 2>/dev/null || true
}

# ═══════════════════════════════════════════════════════════════════════════
# FILE LOCKING UTILITIES (for parallel execution)
# ═══════════════════════════════════════════════════════════════════════════

# Acquire a file lock
# Usage: acquire_lock "lock_file" [timeout_seconds]
acquire_lock() {
  local lock_file="$1"
  local timeout="${2:-30}"
  
  mkdir -p "$(dirname "$lock_file")"
  
  # Use flock if available (Linux)
  if command -v flock &> /dev/null; then
    exec 200>"$lock_file"
    if flock -w "$timeout" 200; then
      return 0
    else
      log_warn "Could not acquire lock within ${timeout}s"
      return 1
    fi
  fi
  
  # Fallback for macOS: simple lock file mechanism
  local max_retries=$((timeout))
  local retry_count=0
  
  while [ $retry_count -lt $max_retries ]; do
    # Try to create lock file atomically
    if (set -o noclobber; echo "$$" > "$lock_file") 2>/dev/null; then
      return 0
    fi
    
    # Check if lock is stale (older than 60 seconds)
    if [ -f "$lock_file" ]; then
      local lock_age
      lock_age=$(($(date +%s) - $(stat -f %m "$lock_file" 2>/dev/null || stat -c %Y "$lock_file" 2>/dev/null || echo 0)))
      if [ "$lock_age" -gt 60 ]; then
        log_warn "Stale lock detected, removing..."
        rm -f "$lock_file"
        continue
      fi
    fi
    
    retry_count=$((retry_count + 1))
    sleep 1
  done
  
  log_warn "Could not acquire lock after $max_retries attempts"
  return 1
}

# Release a file lock
# Usage: release_lock "lock_file"
release_lock() {
  local lock_file="$1"
  rm -f "$lock_file"
}

# ═══════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

# Normalize PR number (handles Pr1234, #1234, 1234)
# Usage: normalize_pr_number "Pr1234" -> "1234"
normalize_pr_number() {
  local input="$1"
  echo "${input#Pr}" | sed 's/^#//'
}

# Get PR ID with prefix (1234 -> Pr1234)
# Usage: get_pr_id "1234" -> "Pr1234"
get_pr_id() {
  local number="$1"
  echo "Pr${number#Pr}"
}

# Check if directory contains valid task structure
# Usage: is_valid_task_dir "/path/to/task"
is_valid_task_dir() {
  local dir="$1"
  
  [ -d "$dir" ] && [ -f "$dir/metadata.json" ]
}

# Get metadata field from task
# Usage: get_metadata_field "/path/to/task" "platform"
get_metadata_field() {
  local task_dir="$1"
  local field="$2"
  local default="${3:-unknown}"
  
  if [ -f "$task_dir/metadata.json" ]; then
    jq -r ".$field // \"$default\"" "$task_dir/metadata.json" 2>/dev/null || echo "$default"
  else
    echo "$default"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# INITIALIZATION
# ═══════════════════════════════════════════════════════════════════════════

# Source the logger if available
if [ -f "$SCRIPT_DIR/logger.sh" ]; then
  # shellcheck source=logger.sh
  source "$SCRIPT_DIR/logger.sh" 2>/dev/null || true
fi

# Export functions for subshells
export -f log_info log_success log_warn log_error log_debug log_header log_section
export -f config_get require_command check_localstack check_github_cli
export -f create_worktree cleanup_worktree acquire_lock release_lock
export -f normalize_pr_number get_pr_id is_valid_task_dir get_metadata_field

