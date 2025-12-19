#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# LocalStack Migration - GitHub Fetch Script
# ═══════════════════════════════════════════════════════════════════════════
# Fetches a task from a GitHub PR when not available in the local archive.
#
# Usage: ./localstack-fetch-github.sh <pr_number> [output_directory]
#
# Arguments:
#   pr_number       - The PR number to fetch (e.g., 7179, Pr7179, #7179)
#   output_directory - Where to save files (default: worktree/github-Pr{number})
#
# Exit codes:
#   0 - Success
#   1 - Failed to fetch
#   4 - GitHub CLI error
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

if [ $# -lt 1 ]; then
  echo "Usage: $0 <pr_number> [output_directory]"
  echo ""
  echo "Arguments:"
  echo "  pr_number        The PR number to fetch (e.g., 7179, Pr7179, #7179)"
  echo "  output_directory Where to save files (default: worktree/github-Pr{number})"
  exit 1
fi

PR_INPUT="$1"
PR_NUMBER=$(normalize_pr_number "$PR_INPUT")
PR_ID=$(get_pr_id "$PR_NUMBER")
OUTPUT_DIR="${2:-$PROJECT_ROOT/$WORKTREE_BASE/github-$PR_ID}"

log_header "🔍 FETCHING FROM GITHUB"

echo "  PR Number:  #$PR_NUMBER"
echo "  PR ID:      $PR_ID"
echo "  Output:     $OUTPUT_DIR"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# CHECK PREREQUISITES
# ═══════════════════════════════════════════════════════════════════════════

if ! check_github_cli; then
  exit 4
fi

# ═══════════════════════════════════════════════════════════════════════════
# FETCH PR DETAILS
# ═══════════════════════════════════════════════════════════════════════════

log_section "Fetching PR Details"

PR_INFO=$(gh pr view "$PR_NUMBER" --repo "$GITHUB_REPO" --json title,headRefName,files,state 2>/dev/null || echo "")

if [ -z "$PR_INFO" ] || [ "$PR_INFO" = "null" ]; then
  log_error "PR #${PR_NUMBER} not found in ${GITHUB_REPO}"
  echo ""
  echo "  💡 Verify the PR exists:"
  echo "     gh pr view $PR_NUMBER --repo $GITHUB_REPO"
  exit 1
fi

PR_TITLE=$(echo "$PR_INFO" | jq -r '.title // "Unknown"')
PR_BRANCH=$(echo "$PR_INFO" | jq -r '.headRefName // "unknown"')
PR_STATE=$(echo "$PR_INFO" | jq -r '.state // "unknown"')

log_success "PR found"
echo "  Title:  $PR_TITLE"
echo "  Branch: $PR_BRANCH"
echo "  State:  $PR_STATE"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PREPARE OUTPUT DIRECTORY
# ═══════════════════════════════════════════════════════════════════════════

log_section "Preparing Output Directory"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
log_success "Created directory: $OUTPUT_DIR"

# Register cleanup
CLEANUP_DIR="$OUTPUT_DIR"
cleanup_on_failure() {
  if [ -n "${CLEANUP_DIR:-}" ] && [ -d "$CLEANUP_DIR" ]; then
    log_debug "Cleaning up failed fetch: $CLEANUP_DIR"
    rm -rf "$CLEANUP_DIR"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# DOWNLOAD PR FILES
# ═══════════════════════════════════════════════════════════════════════════

log_section "Downloading PR Files"

# Method 1: Get files from PR diff
PR_FILES=$(gh pr diff "$PR_NUMBER" --repo "$GITHUB_REPO" --name-only 2>/dev/null || echo "")

if [ -n "$PR_FILES" ]; then
  log_info "Found $(echo "$PR_FILES" | wc -l | tr -d ' ') files in PR diff"
  
  echo "$PR_FILES" | while read -r file; do
    if [ -n "$file" ]; then
      log_debug "Downloading: $file"
      mkdir -p "$OUTPUT_DIR/$(dirname "$file")"
      gh api "repos/${GITHUB_REPO}/contents/${file}?ref=${PR_BRANCH}" --jq '.content' 2>/dev/null | \
        base64 -d > "$OUTPUT_DIR/$file" 2>/dev/null || true
    fi
  done
else
  log_warn "No files in PR diff, trying branch checkout method..."
  
  # Method 2: Clone the branch
  TEMP_CLONE_DIR=$(mktemp -d)
  
  # Register temp dir for cleanup
  CLEANUP_TEMP="$TEMP_CLONE_DIR"
  cleanup_temp() {
    if [ -n "${CLEANUP_TEMP:-}" ] && [ -d "$CLEANUP_TEMP" ]; then
      rm -rf "$CLEANUP_TEMP"
    fi
  }
  register_cleanup cleanup_temp
  
  log_info "Cloning branch $PR_BRANCH..."
  if git clone --depth 1 --branch "$PR_BRANCH" "https://github.com/${GITHUB_REPO}.git" "$TEMP_CLONE_DIR" 2>/dev/null; then
    # Copy relevant directories
    for dir in lib test; do
      if [ -d "$TEMP_CLONE_DIR/$dir" ]; then
        cp -r "$TEMP_CLONE_DIR/$dir" "$OUTPUT_DIR/"
        log_success "Copied $dir/"
      fi
    done
    
    # Copy essential files
    for file in metadata.json package.json tsconfig.json Pipfile Pipfile.lock requirements.txt cdk.json cdktf.json Pulumi.yaml main.tf; do
      if [ -f "$TEMP_CLONE_DIR/$file" ]; then
        cp "$TEMP_CLONE_DIR/$file" "$OUTPUT_DIR/"
        log_success "Copied $file"
      fi
    done
    
    rm -rf "$TEMP_CLONE_DIR"
  else
    log_error "Failed to clone branch: $PR_BRANCH"
    cleanup_on_failure
    exit 1
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════
# VERIFY TASK STRUCTURE
# ═══════════════════════════════════════════════════════════════════════════

log_section "Verifying Task Structure"

if [ ! -f "$OUTPUT_DIR/metadata.json" ]; then
  log_error "metadata.json not found - invalid task structure"
  echo ""
  echo "  The PR may not contain a valid IaC task."
  echo "  Expected: metadata.json in the root directory"
  cleanup_on_failure
  exit 1
fi

# Verify metadata.json is valid JSON
if ! jq empty "$OUTPUT_DIR/metadata.json" 2>/dev/null; then
  log_error "metadata.json is not valid JSON"
  cleanup_on_failure
  exit 1
fi

# Get task info
PLATFORM=$(get_metadata_field "$OUTPUT_DIR" "platform")
LANGUAGE=$(get_metadata_field "$OUTPUT_DIR" "language")
AWS_SERVICES=$(jq -r '.aws_services // [] | join(", ")' "$OUTPUT_DIR/metadata.json" 2>/dev/null || echo "")

log_success "Task structure verified"
echo "  Platform: $PLATFORM"
echo "  Language: $LANGUAGE"
echo "  Services: $AWS_SERVICES"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# OUTPUT SUMMARY
# ═══════════════════════════════════════════════════════════════════════════

# Clear cleanup flag on success
CLEANUP_DIR=""

log_header "✅ GITHUB FETCH COMPLETE"

echo "  PR:         #$PR_NUMBER"
echo "  Branch:     $PR_BRANCH"
echo "  Directory:  $OUTPUT_DIR"
echo "  Platform:   $PLATFORM"
echo "  Language:   $LANGUAGE"
echo ""

# Output the path for callers
echo "$OUTPUT_DIR"

