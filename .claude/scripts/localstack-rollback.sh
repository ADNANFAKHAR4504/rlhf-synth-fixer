#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LocalStack Rollback Script (Enhancement #7)
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Rollback failed migrations to a previous state
#
# Usage:
#   ./localstack-rollback.sh <pr_id>                    # Rollback to last snapshot
#   ./localstack-rollback.sh <pr_id> --full             # Full rollback to original
#   ./localstack-rollback.sh <pr_id> --last-fix         # Rollback only last fix
#   ./localstack-rollback.sh <pr_id> --to-snapshot N    # Rollback to specific snapshot
#   ./localstack-rollback.sh <pr_id> --list             # List available snapshots
#
# Exit codes:
#   0 = Success
#   1 = Error
#   2 = No snapshots available
#   3 = Invalid input
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Snapshot directory
SNAPSHOT_DIR="$PROJECT_ROOT/.claude/snapshots"
MAX_SNAPSHOTS_PER_PR=3

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

log_header() {
  echo ""
  echo -e "${BOLD}${CYAN}$1${NC}"
  echo -e "${CYAN}$(printf '═%.0s' {1..60})${NC}"
}

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

# Get snapshot directory for a PR
get_pr_snapshot_dir() {
  local pr_id="$1"
  echo "$SNAPSHOT_DIR/$pr_id"
}

# Create a new snapshot
create_snapshot() {
  local pr_id="$1"
  local work_dir="$2"
  local description="${3:-auto}"
  
  local pr_snapshot_dir=$(get_pr_snapshot_dir "$pr_id")
  mkdir -p "$pr_snapshot_dir"
  
  # Generate snapshot ID
  local snapshot_id=$(date '+%Y%m%d-%H%M%S')
  local snapshot_path="$pr_snapshot_dir/$snapshot_id"
  
  log_info "Creating snapshot: $snapshot_id"
  
  # Create snapshot directory
  mkdir -p "$snapshot_path"
  
  # Copy relevant files
  local files_to_snapshot=(
    "lib"
    "test"
    "tests"
    "metadata.json"
    "package.json"
    "tsconfig.json"
    "cdk.json"
    "Pulumi.yaml"
    "main.tf"
    "jest.config.js"
    "execution-output.md"
  )
  
  for file in "${files_to_snapshot[@]}"; do
    if [[ -e "$work_dir/$file" ]]; then
      cp -r "$work_dir/$file" "$snapshot_path/" 2>/dev/null || true
    fi
  done
  
  # Save metadata
  cat > "$snapshot_path/.snapshot-meta.json" << EOF
{
  "snapshot_id": "$snapshot_id",
  "pr_id": "$pr_id",
  "created_at": "$(date -Iseconds)",
  "description": "$description",
  "source_dir": "$work_dir"
}
EOF
  
  # Prune old snapshots (keep only MAX_SNAPSHOTS_PER_PR)
  local snapshot_count=$(ls -1d "$pr_snapshot_dir"/*/ 2>/dev/null | wc -l | tr -d ' ')
  if [[ $snapshot_count -gt $MAX_SNAPSHOTS_PER_PR ]]; then
    local to_delete=$((snapshot_count - MAX_SNAPSHOTS_PER_PR))
    ls -1dt "$pr_snapshot_dir"/*/ | tail -n "$to_delete" | xargs rm -rf
    log_info "Pruned $to_delete old snapshot(s)"
  fi
  
  log_success "Snapshot created: $snapshot_id"
  echo "$snapshot_id"
}

# List available snapshots for a PR
list_snapshots() {
  local pr_id="$1"
  local pr_snapshot_dir=$(get_pr_snapshot_dir "$pr_id")
  
  if [[ ! -d "$pr_snapshot_dir" ]]; then
    log_warning "No snapshots found for $pr_id"
    return 2
  fi
  
  log_header "📸 Available Snapshots for $pr_id"
  echo ""
  
  local count=0
  for snapshot_dir in $(ls -1dt "$pr_snapshot_dir"/*/ 2>/dev/null); do
    count=$((count + 1))
    local snapshot_id=$(basename "$snapshot_dir")
    local meta_file="$snapshot_dir/.snapshot-meta.json"
    
    if [[ -f "$meta_file" ]]; then
      local created_at=$(jq -r '.created_at // "unknown"' "$meta_file")
      local description=$(jq -r '.description // "no description"' "$meta_file")
      
      printf "  ${BOLD}%d.${NC} ${CYAN}%s${NC}\n" "$count" "$snapshot_id"
      printf "     Created: %s\n" "$created_at"
      printf "     Description: %s\n" "$description"
      
      # List files in snapshot
      local files=$(ls -1 "$snapshot_dir" 2>/dev/null | grep -v '.snapshot-meta.json' | head -5 | tr '\n' ', ' | sed 's/,$//')
      printf "     Files: %s\n" "$files"
      echo ""
    fi
  done
  
  if [[ $count -eq 0 ]]; then
    log_warning "No snapshots found"
    return 2
  fi
  
  echo -e "${BOLD}Total: $count snapshot(s)${NC}"
}

# Restore from a snapshot
restore_snapshot() {
  local pr_id="$1"
  local snapshot_id="$2"
  local work_dir="$3"
  
  local pr_snapshot_dir=$(get_pr_snapshot_dir "$pr_id")
  local snapshot_path="$pr_snapshot_dir/$snapshot_id"
  
  if [[ ! -d "$snapshot_path" ]]; then
    log_error "Snapshot not found: $snapshot_id"
    return 1
  fi
  
  log_info "Restoring from snapshot: $snapshot_id"
  
  # Create backup of current state first
  local backup_id=$(create_snapshot "$pr_id" "$work_dir" "pre-rollback-backup")
  log_info "Created backup: $backup_id"
  
  # Restore files from snapshot
  local files_restored=0
  for item in "$snapshot_path"/*; do
    local basename=$(basename "$item")
    
    # Skip metadata file
    [[ "$basename" == ".snapshot-meta.json" ]] && continue
    
    # Remove existing
    rm -rf "$work_dir/$basename" 2>/dev/null || true
    
    # Copy from snapshot
    cp -r "$item" "$work_dir/"
    files_restored=$((files_restored + 1))
    log_info "Restored: $basename"
  done
  
  log_success "Restored $files_restored items from snapshot $snapshot_id"
  return 0
}

# Rollback to the most recent snapshot
rollback_to_latest() {
  local pr_id="$1"
  local work_dir="$2"
  
  local pr_snapshot_dir=$(get_pr_snapshot_dir "$pr_id")
  
  if [[ ! -d "$pr_snapshot_dir" ]]; then
    log_error "No snapshots found for $pr_id"
    return 2
  fi
  
  # Get the most recent snapshot
  local latest_snapshot=$(ls -1t "$pr_snapshot_dir" 2>/dev/null | head -1)
  
  if [[ -z "$latest_snapshot" ]]; then
    log_error "No snapshots available"
    return 2
  fi
  
  log_header "🔙 Rolling Back to Latest Snapshot"
  restore_snapshot "$pr_id" "$latest_snapshot" "$work_dir"
}

# Rollback only the last fix (using git)
rollback_last_fix() {
  local work_dir="$1"
  
  cd "$work_dir"
  
  log_header "🔙 Rolling Back Last Fix"
  
  # Check if we have git history
  if ! git rev-parse --git-dir &>/dev/null; then
    log_error "Not a git repository"
    return 1
  fi
  
  # Get the last commit
  local last_commit=$(git log -1 --format="%H" 2>/dev/null)
  local last_message=$(git log -1 --format="%s" 2>/dev/null)
  
  if [[ -z "$last_commit" ]]; then
    log_error "No commits to rollback"
    return 1
  fi
  
  log_info "Last commit: $last_message"
  
  # Check if there are uncommitted changes
  if ! git diff --quiet || ! git diff --cached --quiet; then
    log_warning "Uncommitted changes detected - stashing..."
    git stash
  fi
  
  # Revert the last commit
  log_info "Reverting last commit..."
  if git revert --no-commit HEAD; then
    log_success "Last fix reverted (not committed)"
    log_info "Review changes and commit when ready:"
    log_info "  git commit -m 'revert: rollback last fix'"
  else
    log_error "Failed to revert - may have conflicts"
    return 1
  fi
}

# Full rollback to original state (from archive)
rollback_full() {
  local pr_id="$1"
  local work_dir="$2"
  
  log_header "🔙 Full Rollback to Original State"
  
  # Try to find original in archive
  local original_path=$(find "$PROJECT_ROOT/archive" -type d -name "*$pr_id*" 2>/dev/null | head -1)
  
  if [[ -z "$original_path" ]]; then
    log_error "Original task not found in archive"
    return 1
  fi
  
  log_info "Found original at: $original_path"
  
  # Create backup first
  local backup_id=$(create_snapshot "$pr_id" "$work_dir" "pre-full-rollback-backup")
  log_info "Created backup: $backup_id"
  
  # Copy original files
  local items_to_copy=(
    "lib"
    "test"
    "tests"
    "metadata.json"
    "package.json"
  )
  
  for item in "${items_to_copy[@]}"; do
    if [[ -e "$original_path/$item" ]]; then
      rm -rf "$work_dir/$item" 2>/dev/null || true
      cp -r "$original_path/$item" "$work_dir/"
      log_info "Restored: $item"
    fi
  done
  
  log_success "Full rollback completed"
  log_warning "Note: You may need to re-apply LocalStack-specific changes"
}

# Rollback to a specific snapshot by number
rollback_to_number() {
  local pr_id="$1"
  local number="$2"
  local work_dir="$3"
  
  local pr_snapshot_dir=$(get_pr_snapshot_dir "$pr_id")
  
  if [[ ! -d "$pr_snapshot_dir" ]]; then
    log_error "No snapshots found for $pr_id"
    return 2
  fi
  
  # Get snapshot by number (1-based index)
  local snapshot_id=$(ls -1t "$pr_snapshot_dir" 2>/dev/null | sed -n "${number}p")
  
  if [[ -z "$snapshot_id" ]]; then
    log_error "Snapshot #$number not found"
    return 1
  fi
  
  log_header "🔙 Rolling Back to Snapshot #$number"
  restore_snapshot "$pr_id" "$snapshot_id" "$work_dir"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

# Create snapshot directory
mkdir -p "$SNAPSHOT_DIR"

# Parse arguments
PR_ID="${1:-}"
MODE="latest"
SNAPSHOT_NUM=""
WORK_DIR=""

if [[ -z "$PR_ID" ]]; then
  echo "Usage: $0 <pr_id> [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --full            Full rollback to original state"
  echo "  --last-fix        Rollback only the last fix (git revert)"
  echo "  --to-snapshot N   Rollback to specific snapshot number"
  echo "  --list            List available snapshots"
  echo "  --create          Create a new snapshot"
  echo "  --dir DIR         Specify working directory"
  echo ""
  echo "Examples:"
  echo "  $0 Pr7179 --list"
  echo "  $0 Pr7179 --full"
  echo "  $0 Pr7179 --to-snapshot 2"
  exit 3
fi

# Remove Pr prefix if present
PR_ID="${PR_ID#Pr}"
PR_ID="${PR_ID#\#}"
PR_ID="Pr$PR_ID"

shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --full)
      MODE="full"
      shift
      ;;
    --last-fix)
      MODE="last-fix"
      shift
      ;;
    --to-snapshot)
      MODE="to-snapshot"
      SNAPSHOT_NUM="$2"
      shift 2
      ;;
    --list)
      MODE="list"
      shift
      ;;
    --create)
      MODE="create"
      shift
      ;;
    --dir)
      WORK_DIR="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# Determine working directory
if [[ -z "$WORK_DIR" ]]; then
  # Try common locations
  if [[ -d "$PROJECT_ROOT/worktree/localstack-$PR_ID" ]]; then
    WORK_DIR="$PROJECT_ROOT/worktree/localstack-$PR_ID"
  elif [[ -d "$PROJECT_ROOT/worktree/git-$PR_ID" ]]; then
    WORK_DIR="$PROJECT_ROOT/worktree/git-$PR_ID"
  else
    # Try to find in archive for --full mode
    WORK_DIR=$(find "$PROJECT_ROOT/archive" -type d -name "*$PR_ID*" 2>/dev/null | head -1)
  fi
fi

# Execute based on mode
case "$MODE" in
  "list")
    list_snapshots "$PR_ID"
    ;;
  "create")
    if [[ -z "$WORK_DIR" ]] || [[ ! -d "$WORK_DIR" ]]; then
      log_error "Working directory not found. Use --dir to specify."
      exit 1
    fi
    create_snapshot "$PR_ID" "$WORK_DIR" "manual"
    ;;
  "latest")
    if [[ -z "$WORK_DIR" ]] || [[ ! -d "$WORK_DIR" ]]; then
      log_error "Working directory not found. Use --dir to specify."
      exit 1
    fi
    rollback_to_latest "$PR_ID" "$WORK_DIR"
    ;;
  "full")
    if [[ -z "$WORK_DIR" ]] || [[ ! -d "$WORK_DIR" ]]; then
      log_error "Working directory not found. Use --dir to specify."
      exit 1
    fi
    rollback_full "$PR_ID" "$WORK_DIR"
    ;;
  "last-fix")
    if [[ -z "$WORK_DIR" ]] || [[ ! -d "$WORK_DIR" ]]; then
      log_error "Working directory not found. Use --dir to specify."
      exit 1
    fi
    rollback_last_fix "$WORK_DIR"
    ;;
  "to-snapshot")
    if [[ -z "$WORK_DIR" ]] || [[ ! -d "$WORK_DIR" ]]; then
      log_error "Working directory not found. Use --dir to specify."
      exit 1
    fi
    rollback_to_number "$PR_ID" "$SNAPSHOT_NUM" "$WORK_DIR"
    ;;
esac

