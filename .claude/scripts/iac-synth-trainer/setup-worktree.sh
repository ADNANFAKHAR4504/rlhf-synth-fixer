#!/bin/bash
# Setup isolated worktree for PR fixing with validation and cleanup
set -e

BRANCH_NAME="$1"
TASK_ID="$2"

if [ -z "$BRANCH_NAME" ] || [ -z "$TASK_ID" ]; then
  echo "Usage: $0 <branch_name> <task_id>"
  exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
WORKTREE_PATH="${REPO_ROOT}/worktree/synth-${TASK_ID}"

echo "Setting up isolated worktree for parallel execution..."

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
echo "Fetching branch: ${BRANCH_NAME}"
git fetch origin "${BRANCH_NAME}:${BRANCH_NAME}" 2>/dev/null || echo "Branch already exists locally"

# Create worktree
echo "Creating worktree at ${WORKTREE_PATH}"
if ! git worktree add "${WORKTREE_PATH}" "${BRANCH_NAME}"; then
  echo "❌ Failed to create worktree"
  exit 1
fi

cd "${WORKTREE_PATH}"
echo "✅ Created isolated worktree at ${WORKTREE_PATH}"

# Verify worktree structure
echo "Verifying worktree..."
if ! bash .claude/scripts/verify-worktree.sh; then
  echo "❌ Worktree validation failed. Cleaning up..."
  cd "${REPO_ROOT}"
  git worktree remove "${WORKTREE_PATH}" --force
  exit 1
fi

echo "✅ Worktree validated - safe for parallel execution"
echo "${WORKTREE_PATH}"  # Output path for caller
