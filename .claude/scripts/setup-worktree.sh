#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Setup isolated worktree for PR fixing with validation and cleanup
# ═══════════════════════════════════════════════════════════════════════════
#
# Usage:
#   ./setup-worktree.sh <branch_name> <task_id> [--type <type>]
#
# Arguments:
#   branch_name  - The git branch to checkout in the worktree
#   task_id      - The task/PR identifier (used for worktree naming)
#   --type       - Worktree type: synth (default), localstack, fixer
#
# Examples:
#   ./setup-worktree.sh synth-12345 12345                    # synth worktree
#   ./setup-worktree.sh ls-synth-Pr7179 Pr7179 --type localstack  # localstack worktree
#   ./setup-worktree.sh localstack-Pr7179 7179 --type fixer       # fixer worktree
#
# Exit codes:
#   0 - Success (worktree ready)
#   1 - Failed to create worktree
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Parse arguments
BRANCH_NAME="$1"
TASK_ID="$2"
WORKTREE_TYPE="synth"  # Default type

# Parse optional arguments
shift 2 2>/dev/null || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --type)
      WORKTREE_TYPE="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [ -z "$BRANCH_NAME" ] || [ -z "$TASK_ID" ]; then
  echo "Usage: $0 <branch_name> <task_id> [--type <type>]"
  echo ""
  echo "Worktree types:"
  echo "  synth      - For synth trainer tasks (default)"
  echo "  localstack - For LocalStack migration tasks"
  echo "  fixer      - For LocalStack fixer tasks"
  echo "  git        - For generic git operations on PRs"
  exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)

# Determine worktree path based on type
case "$WORKTREE_TYPE" in
  synth)
    WORKTREE_PATH="${REPO_ROOT}/worktree/synth-${TASK_ID}"
    ;;
  localstack)
    WORKTREE_PATH="${REPO_ROOT}/worktree/localstack-${TASK_ID}"
    ;;
  fixer)
    WORKTREE_PATH="${REPO_ROOT}/worktree/fixer-pr${TASK_ID}"
    ;;
  git)
    WORKTREE_PATH="${REPO_ROOT}/worktree/git-${TASK_ID}"
    ;;
  *)
    echo "❌ Unknown worktree type: $WORKTREE_TYPE"
    echo "   Valid types: synth, localstack, fixer, git"
    exit 1
    ;;
esac

echo "═══════════════════════════════════════════════════"
echo "🔧 SETTING UP WORKTREE"
echo "═══════════════════════════════════════════════════"
echo ""
echo "   Type:   $WORKTREE_TYPE"
echo "   Branch: $BRANCH_NAME"
echo "   Path:   $WORKTREE_PATH"
echo ""

# Check if worktree already exists (from failed previous run)
if git worktree list | grep -q "${WORKTREE_PATH}"; then
  echo "⚠️ Worktree already exists at ${WORKTREE_PATH}"
  echo "Checking if it's usable..."

  if [ -d "${WORKTREE_PATH}" ]; then
    cd "${WORKTREE_PATH}"

    # Check if it's on the correct branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" == "$BRANCH_NAME" ]; then
      echo "✅ Existing worktree is on correct branch, reusing"
      # Output worktree path for caller
      echo ""
      echo "${WORKTREE_PATH}"
      exit 0
    else
      echo "⚠️ Existing worktree on wrong branch (${CURRENT_BRANCH}), removing..."
      cd "${REPO_ROOT}"
      git worktree remove "${WORKTREE_PATH}" --force
    fi
  else
    echo "⚠️ Worktree registered but directory missing, pruning..."
    git worktree prune
  fi
fi

# Fetch the branch if it doesn't exist locally
echo "📥 Fetching branch: ${BRANCH_NAME}"
git fetch origin "${BRANCH_NAME}:${BRANCH_NAME}" 2>/dev/null || {
  # Try fetching as a PR ref if branch doesn't exist
  PR_NUM=$(echo "$TASK_ID" | sed 's/[^0-9]//g')
  if [ -n "$PR_NUM" ]; then
    echo "   Trying PR ref for #${PR_NUM}..."
    git fetch origin "pull/${PR_NUM}/head:${BRANCH_NAME}" 2>/dev/null || echo "   Branch already exists locally or PR not found"
  else
    echo "   Branch already exists locally"
  fi
}

# Create worktree
echo "📁 Creating worktree at ${WORKTREE_PATH}"
if ! git worktree add "${WORKTREE_PATH}" "${BRANCH_NAME}" 2>/dev/null; then
  # If branch doesn't exist, try creating from main
  echo "   Branch not found, creating from main..."
  git worktree add -b "${BRANCH_NAME}" "${WORKTREE_PATH}" origin/main 2>/dev/null || {
    echo "❌ Failed to create worktree"
    exit 1
  }
fi

cd "${WORKTREE_PATH}"
echo "✅ Created isolated worktree at ${WORKTREE_PATH}"

# Verify worktree structure (skip for fixer/git types as they may not have metadata.json yet)
echo ""
echo "🔍 Verifying worktree..."
if [ -f "${REPO_ROOT}/.claude/scripts/verify-worktree.sh" ]; then
  if bash "${REPO_ROOT}/.claude/scripts/verify-worktree.sh" 2>/dev/null; then
    echo "✅ Worktree validation passed"
  else
    # For fixer and git types, validation failure is okay (no metadata.json)
    if [ "$WORKTREE_TYPE" = "fixer" ] || [ "$WORKTREE_TYPE" = "git" ]; then
      echo "⚠️ Worktree validation skipped for $WORKTREE_TYPE type"
    else
      echo "❌ Worktree validation failed. Cleaning up..."
      cd "${REPO_ROOT}"
      git worktree remove "${WORKTREE_PATH}" --force
      exit 1
    fi
  fi
else
  echo "⚠️ verify-worktree.sh not found, skipping validation"
fi

echo ""
echo "✅ Worktree ready for parallel execution"

# ═══════════════════════════════════════════════════════════════════════════
# SYNC WITH MAIN BRANCH
# Only sync if --sync flag is provided or if it's a localstack/fixer worktree
# ═══════════════════════════════════════════════════════════════════════════

SHOULD_SYNC=false
if [ "$WORKTREE_TYPE" = "localstack" ] || [ "$WORKTREE_TYPE" = "fixer" ]; then
  SHOULD_SYNC=true
fi

# Check for --sync argument (might be passed by caller)
for arg in "$@"; do
  if [ "$arg" = "--sync" ]; then
    SHOULD_SYNC=true
  fi
done

if [ "$SHOULD_SYNC" = true ]; then
  echo ""
  echo "🔄 Synchronizing branch with latest main..."

  # Fetch latest main
  git fetch origin main

  # Check if branch has diverged from main
  MERGE_BASE=$(git merge-base HEAD origin/main 2>/dev/null || echo "")
  MAIN_HEAD=$(git rev-parse origin/main 2>/dev/null || echo "")

  if [ -n "$MERGE_BASE" ] && [ -n "$MAIN_HEAD" ] && [ "$MERGE_BASE" != "$MAIN_HEAD" ]; then
    echo "⚠️ Branch is behind main. Syncing with latest changes..."

    # Check for local uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
      echo "❌ ERROR: Branch has uncommitted changes. Cannot sync with main."
      echo "Please commit or stash changes first."
      cd "${REPO_ROOT}"
      git worktree remove "${WORKTREE_PATH}" --force
      exit 1
    fi

    # Rebase on main to get latest changes
    echo "Rebasing branch on latest main..."
    if git rebase origin/main; then
      echo "✅ Successfully rebased on main"

      # Force push to update remote branch
      echo "Pushing rebased branch to remote..."
      if git push origin "${BRANCH_NAME}" --force-with-lease 2>/dev/null; then
        echo "✅ Remote branch updated"
      else
        echo "⚠️ Failed to push rebased branch (may need manual push)"
      fi
    else
      echo "❌ Rebase failed - conflicts detected"
      echo ""

      # Check if there are conflicts
      CONFLICTED_FILES=$(git diff --name-only --diff-filter=U 2>/dev/null || echo "")

      if [ -n "$CONFLICTED_FILES" ]; then
        echo "📋 Conflicted files:"
        echo "$CONFLICTED_FILES"
        echo ""

        # Attempt automatic conflict resolution
        echo "🔧 Attempting automatic conflict resolution..."

        RESOLVED_COUNT=0
        UNRESOLVED_COUNT=0

        while IFS= read -r file; do
          [ -z "$file" ] && continue
          echo "Resolving: $file"

          # Strategy: For most conflicts, prefer main's version (ours during rebase)
          # This is safe because we're pulling in updates from main
          if git checkout --ours "$file" 2>/dev/null; then
            git add "$file"
            RESOLVED_COUNT=$((RESOLVED_COUNT + 1))
            echo "  ✅ Auto-resolved (accepted main's version)"
          else
            UNRESOLVED_COUNT=$((UNRESOLVED_COUNT + 1))
            echo "  ⚠️ Could not auto-resolve"
          fi
        done <<< "$CONFLICTED_FILES"

        echo ""
        echo "Resolution summary:"
        echo "  ✅ Auto-resolved: ${RESOLVED_COUNT}"
        echo "  ⚠️ Unresolved: ${UNRESOLVED_COUNT}"

        if [ $UNRESOLVED_COUNT -eq 0 ]; then
          echo ""
          echo "✅ All conflicts auto-resolved, continuing rebase..."

          if git rebase --continue 2>/dev/null; then
            echo "✅ Rebase completed successfully"

            # Push rebased branch
            echo "Pushing rebased branch to remote..."
            if git push origin "${BRANCH_NAME}" --force-with-lease 2>/dev/null; then
              echo "✅ Remote branch updated"
            else
              echo "⚠️ Failed to push rebased branch (may need manual push)"
            fi
          else
            echo "❌ Rebase --continue failed"
            git rebase --abort 2>/dev/null || true
            echo "⚠️ Continuing without sync - manual rebase may be needed"
          fi
        else
          echo ""
          echo "⚠️ Cannot auto-resolve all conflicts."
          echo "   Aborting rebase and continuing without sync."
          git rebase --abort 2>/dev/null || true
        fi
      else
        echo "⚠️ Rebase failed - aborting and continuing without sync"
        git rebase --abort 2>/dev/null || true
      fi
    fi
  else
    echo "✅ Branch is even with main - no sync needed"
  fi
fi

# Output worktree path for caller (last line of output)
echo ""
echo "${WORKTREE_PATH}"
