#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# LocalStack Migration - Pull Request Creation Script
# ═══════════════════════════════════════════════════════════════════════════
# Creates a GitHub PR for a successfully migrated LocalStack task.
# Uses git worktrees for parallel-safe branch operations.
#
# Usage: ./localstack-create-pr.sh <work_dir> <original_pr_id> [options]
#
# Arguments:
#   work_dir        - Directory containing the migrated task files
#   original_pr_id  - Original PR identifier (e.g., Pr7179)
#
# Options:
#   --platform      - Platform type (cdk, cfn, tf, pulumi)
#   --language      - Language (ts, py, go, etc.)
#   --services      - AWS services (comma-separated)
#   --iterations    - Number of fix iterations used
#
# Exit codes:
#   0 - PR created successfully
#   1 - Failed to create PR
#   4 - GitHub CLI error
#   5 - Git error
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

if [ $# -lt 2 ]; then
  echo "Usage: $0 <work_dir> <original_pr_id> [options]"
  echo ""
  echo "Arguments:"
  echo "  work_dir        Directory containing the migrated task files"
  echo "  original_pr_id  Original PR identifier (e.g., Pr7179)"
  echo ""
  echo "Options:"
  echo "  --platform      Platform type (cdk, cfn, tf, pulumi)"
  echo "  --language      Language (ts, py, go, etc.)"
  echo "  --services      AWS services (comma-separated)"
  echo "  --iterations    Number of fix iterations used"
  exit 1
fi

WORK_DIR="$1"
ORIGINAL_PR_ID="$2"
shift 2

# Optional parameters
PLATFORM=""
LANGUAGE=""
AWS_SERVICES=""
ITERATIONS_USED="1"
COMPLEXITY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
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
    --iterations)
      ITERATIONS_USED="$2"
      shift 2
      ;;
    --complexity)
      COMPLEXITY="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# Validate work directory
if [ ! -d "$WORK_DIR" ]; then
  log_error "Work directory not found: $WORK_DIR"
  exit 1
fi

# Auto-detect from metadata if not provided
if [ -f "$WORK_DIR/metadata.json" ]; then
  [ -z "$PLATFORM" ] && PLATFORM=$(get_metadata_field "$WORK_DIR" "platform")
  [ -z "$LANGUAGE" ] && LANGUAGE=$(get_metadata_field "$WORK_DIR" "language")
  [ -z "$COMPLEXITY" ] && COMPLEXITY=$(get_metadata_field "$WORK_DIR" "complexity")
  [ -z "$AWS_SERVICES" ] && AWS_SERVICES=$(jq -r '.aws_services // [] | join(", ")' "$WORK_DIR/metadata.json" 2>/dev/null || echo "")
fi

# Generate new PR ID
LS_PR_ID="ls-${ORIGINAL_PR_ID}"
NEW_BRANCH="ls-synth-${ORIGINAL_PR_ID}"

log_header "📦 CREATING PULL REQUEST"

echo "  Original PR:    $ORIGINAL_PR_ID"
echo "  New PR ID:      $LS_PR_ID"
echo "  Branch:         $NEW_BRANCH"
echo "  Platform:       $PLATFORM"
echo "  Language:       $LANGUAGE"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# CHECK PREREQUISITES
# ═══════════════════════════════════════════════════════════════════════════

if ! check_github_cli; then
  exit 4
fi

# ═══════════════════════════════════════════════════════════════════════════
# SANITIZE METADATA BEFORE PR CREATION
# ═══════════════════════════════════════════════════════════════════════════

log_section "Sanitizing Metadata"

if [ -f "$WORK_DIR/metadata.json" ]; then
  if ! "$SCRIPT_DIR/localstack-sanitize-metadata.sh" "$WORK_DIR/metadata.json"; then
    log_error "Metadata sanitization failed!"
    exit 1
  fi
else
  log_warn "No metadata.json found in work directory"
fi

# ═══════════════════════════════════════════════════════════════════════════
# VALIDATE SANITIZED METADATA (additional safety check)
# ═══════════════════════════════════════════════════════════════════════════

log_section "Validating Sanitized Metadata"

if [ -f "$WORK_DIR/metadata.json" ]; then
  VALIDATION_FAILED=false
  
  # Check all required fields are present
  REQUIRED_FIELDS=("platform" "language" "complexity" "turn_type" "po_id" "team" "startedAt" "subtask" "provider" "subject_labels" "aws_services" "wave")
  for field in "${REQUIRED_FIELDS[@]}"; do
    if ! jq -e ".$field" "$WORK_DIR/metadata.json" &>/dev/null; then
      log_error "Missing required field after sanitization: $field"
      VALIDATION_FAILED=true
    fi
  done
  
  # Check for disallowed fields (schema has additionalProperties: false)
  DISALLOWED_FIELDS=("coverage" "author" "dockerS3Location" "training_quality" "task_id" "pr_id" "localstack_migration" "original_po_id" "original_pr_id" "testDependencies" "background" "training_quality_justification")
  for field in "${DISALLOWED_FIELDS[@]}"; do
    if jq -e ".$field" "$WORK_DIR/metadata.json" &>/dev/null; then
      log_error "Disallowed field still present after sanitization: $field"
      VALIDATION_FAILED=true
    fi
  done
  
  # Validate required field values
  TEAM=$(jq -r '.team // ""' "$WORK_DIR/metadata.json")
  if [[ -z "$TEAM" || "$TEAM" == "null" ]]; then
    log_error "Team field is empty or null"
    VALIDATION_FAILED=true
  fi
  
  PROVIDER=$(jq -r '.provider // ""' "$WORK_DIR/metadata.json")
  if [[ "$PROVIDER" != "localstack" ]]; then
    log_error "Provider should be 'localstack', got: $PROVIDER"
    VALIDATION_FAILED=true
  fi
  
  SUBTASK=$(jq -r '.subtask // ""' "$WORK_DIR/metadata.json")
  if [[ -z "$SUBTASK" || "$SUBTASK" == "null" ]]; then
    log_error "Subtask field is empty or null"
    VALIDATION_FAILED=true
  fi
  
  SUBJECT_LABELS_COUNT=$(jq '.subject_labels | length' "$WORK_DIR/metadata.json" 2>/dev/null || echo "0")
  if [[ "$SUBJECT_LABELS_COUNT" -lt 1 ]]; then
    log_error "subject_labels array must have at least 1 item"
    VALIDATION_FAILED=true
  fi
  
  WAVE=$(jq -r '.wave // ""' "$WORK_DIR/metadata.json")
  if [[ ! "$WAVE" =~ ^(P0|P1)$ ]]; then
    log_error "Wave must be 'P0' or 'P1', got: $WAVE"
    VALIDATION_FAILED=true
  fi
  
  if [ "$VALIDATION_FAILED" = true ]; then
    log_error "Metadata validation failed! Current content:"
    cat "$WORK_DIR/metadata.json"
    exit 1
  fi
  
  log_success "Metadata validation passed"
  log_info "  Team:           $TEAM"
  log_info "  Provider:       $PROVIDER"
  log_info "  Subtask:        $SUBTASK"
  log_info "  Subject Labels: $SUBJECT_LABELS_COUNT items"
  log_info "  Wave:           $WAVE"
fi

# ═══════════════════════════════════════════════════════════════════════════
# CREATE GIT WORKTREE FOR PARALLEL-SAFE OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════

log_section "Setting Up Git Worktree"

cd "$PROJECT_ROOT"

GIT_WORKTREE_DIR="$PROJECT_ROOT/$WORKTREE_BASE/git-${ORIGINAL_PR_ID}"

# Register cleanup
cleanup_git_worktree() {
  if [ -d "$GIT_WORKTREE_DIR" ]; then
    log_debug "Cleaning up git worktree: $GIT_WORKTREE_DIR"
    cd "$PROJECT_ROOT"
    git worktree remove "$GIT_WORKTREE_DIR" --force 2>/dev/null || rm -rf "$GIT_WORKTREE_DIR"
    git worktree prune 2>/dev/null || true
  fi
}
register_cleanup cleanup_git_worktree

# Create worktree
if ! create_worktree "$GIT_WORKTREE_DIR" "$NEW_BRANCH" "origin/main"; then
  log_error "Failed to create git worktree"
  exit 5
fi

# ═══════════════════════════════════════════════════════════════════════════
# COPY FILES TO WORKTREE
# ═══════════════════════════════════════════════════════════════════════════

log_section "Preparing PR Files"

# Copy lib/ directory
if [ -d "$WORK_DIR/lib" ]; then
  rm -rf "$GIT_WORKTREE_DIR/lib/"
  cp -r "$WORK_DIR/lib" "$GIT_WORKTREE_DIR/"
  log_success "Copied lib/"
fi

# Copy test/ directory
if [ -d "$WORK_DIR/test" ]; then
  rm -rf "$GIT_WORKTREE_DIR/test/"
  cp -r "$WORK_DIR/test" "$GIT_WORKTREE_DIR/"
  log_success "Copied test/"
fi

# Copy metadata.json
if [ -f "$WORK_DIR/metadata.json" ]; then
  cp "$WORK_DIR/metadata.json" "$GIT_WORKTREE_DIR/"
  log_success "Copied metadata.json"
fi

# Copy platform-specific files
for file in Pipfile Pipfile.lock requirements.txt cdk.json cdktf.json Pulumi.yaml main.tf; do
  if [ -f "$WORK_DIR/$file" ]; then
    cp "$WORK_DIR/$file" "$GIT_WORKTREE_DIR/"
    log_success "Copied $file"
  fi
done

# ═══════════════════════════════════════════════════════════════════════════
# COMMIT CHANGES
# ═══════════════════════════════════════════════════════════════════════════

log_section "Creating Commit"

cd "$GIT_WORKTREE_DIR"

# Stage all changes
git add lib/ test/ metadata.json 2>/dev/null || true
git add Pipfile Pipfile.lock requirements.txt cdk.json cdktf.json Pulumi.yaml main.tf 2>/dev/null || true
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
  log_warn "No changes to commit"
  cd "$PROJECT_ROOT"
  exit 0
fi

# Create commit message
COMMIT_MSG="feat(localstack): ${LS_PR_ID} - LocalStack compatible task

PR ID: ${LS_PR_ID}
Original PR ID: ${ORIGINAL_PR_ID}
Platform: ${PLATFORM}
Language: ${LANGUAGE}
AWS Services: ${AWS_SERVICES}

This task has been migrated and tested for LocalStack compatibility.
The PR pipeline will handle deployment and validation.

Iterations used: ${ITERATIONS_USED}"

git commit -m "$COMMIT_MSG"
log_success "Commit created"

# ═══════════════════════════════════════════════════════════════════════════
# PUSH BRANCH
# ═══════════════════════════════════════════════════════════════════════════

log_section "Pushing Branch"

if ! git push -u origin "$NEW_BRANCH" --force; then
  log_error "Failed to push branch to origin"
  cd "$PROJECT_ROOT"
  exit 5
fi

log_success "Branch pushed: $NEW_BRANCH"

# ═══════════════════════════════════════════════════════════════════════════
# CREATE PULL REQUEST
# ═══════════════════════════════════════════════════════════════════════════

log_section "Creating Pull Request"

PR_TITLE="[LocalStack] ${LS_PR_ID} - ${PLATFORM}/${LANGUAGE}"

PR_BODY="## LocalStack Migration

### Task Details
- **New PR ID:** ${LS_PR_ID}
- **Original PR ID:** ${ORIGINAL_PR_ID}
- **Platform:** ${PLATFORM}
- **Language:** ${LANGUAGE}
- **AWS Services:** ${AWS_SERVICES}
- **Complexity:** ${COMPLEXITY}

### Migration Summary
This PR contains a LocalStack-compatible version of task ${ORIGINAL_PR_ID}, migrated as ${LS_PR_ID}.

The task has been:
- ✅ Tested for LocalStack deployment
- ✅ Verified with integration tests
- ✅ Updated with LocalStack-specific configurations

### Pipeline
This PR will be processed by the CI/CD pipeline which will:
1. Run linting and validation
2. Deploy to LocalStack
3. Run integration tests
4. Report results

### LocalStack Compatibility
- LocalStack Version: ${LOCALSTACK_VERSION:-unknown}
- Fix Iterations: ${ITERATIONS_USED}

---
*This PR was automatically created by the \`/localstack-migrate\` command.*
*The PR pipeline will handle deployment and testing.*"

# Create the PR with required labels (synth-2, localstack, platform, language)
PR_RESULT=$(gh pr create \
  --repo "$GITHUB_REPO" \
  --title "$PR_TITLE" \
  --body "$PR_BODY" \
  --base main \
  --head "$NEW_BRANCH" \
  --label "synth-2" \
  --label "localstack" \
  --label "$PLATFORM" \
  --label "$LANGUAGE" \
  2>&1) || {
  log_error "Failed to create Pull Request"
  echo "  Error: $PR_RESULT"
  cd "$PROJECT_ROOT"
  exit 1
}

NEW_PR_URL="$PR_RESULT"
NEW_PR_NUMBER=$(echo "$NEW_PR_URL" | grep -oE '[0-9]+$' || echo "")

log_success "Pull Request created!"

# ═══════════════════════════════════════════════════════════════════════════
# ASSIGN CURRENT GITHUB USER TO PR
# ═══════════════════════════════════════════════════════════════════════════

log_section "Assigning PR to Current User"

# Get current GitHub user
CURRENT_USER=$(gh api user --jq '.login' 2>/dev/null || echo "")

if [ -n "$CURRENT_USER" ] && [ -n "$NEW_PR_NUMBER" ]; then
  if gh pr edit "$NEW_PR_NUMBER" --repo "$GITHUB_REPO" --add-assignee "$CURRENT_USER" 2>/dev/null; then
    log_success "Assigned PR to @$CURRENT_USER"
  else
    log_warn "Could not assign PR to @$CURRENT_USER (non-fatal)"
  fi
else
  log_warn "Could not determine current GitHub user for assignment"
fi

# ═══════════════════════════════════════════════════════════════════════════
# RETURN TO PROJECT ROOT
# ═══════════════════════════════════════════════════════════════════════════

cd "$PROJECT_ROOT"

# ═══════════════════════════════════════════════════════════════════════════
# OUTPUT SUMMARY
# ═══════════════════════════════════════════════════════════════════════════

log_header "✅ PULL REQUEST CREATED"

echo "  Original PR:  $ORIGINAL_PR_ID"
echo "  New PR ID:    $LS_PR_ID"
echo "  Branch:       $NEW_BRANCH"
echo "  PR URL:       $NEW_PR_URL"
echo "  PR Number:    #$NEW_PR_NUMBER"
echo ""

# Output for caller scripts
echo "NEW_PR_URL=$NEW_PR_URL"
echo "NEW_PR_NUMBER=$NEW_PR_NUMBER"
echo "NEW_BRANCH=$NEW_BRANCH"
echo "LS_PR_ID=$LS_PR_ID"

