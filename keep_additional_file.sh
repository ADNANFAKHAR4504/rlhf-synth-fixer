#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="main"

# List of branches to process
BRANCHES=(
  "ls-synth-Pr490"
)

echo "Fetching latest..."
git fetch origin

for BRANCH in "${BRANCHES[@]}"; do
  echo "========================================="
  echo "Processing branch: $BRANCH"
  echo "========================================="

  # Checkout branch (create local if missing)
  if git show-ref --verify --quiet refs/heads/"$BRANCH"; then
    git checkout "$BRANCH"
  else
    git checkout -b "$BRANCH" "origin/$BRANCH"
  fi

  # Ensure base branch is up to date
  git fetch origin "$BASE_BRANCH"

  # Get changed files with status
  git diff --name-status "$BASE_BRANCH"...HEAD > /tmp/git_changes.txt

  if [[ ! -s /tmp/git_changes.txt ]]; then
    echo "No changes detected, skipping..."
    continue
  fi

  while read -r STATUS FILE; do
    case "$STATUS" in
      A)
        echo "KEEP   (new file): $FILE"
        ;;
      M)
        echo "REVERT (modified): $FILE"
        git checkout "$BASE_BRANCH" -- "$FILE"
        ;;
      D)
        echo "RESTORE (deleted): $FILE"
        git checkout "$BASE_BRANCH" -- "$FILE"
        ;;
      R*)
        # Rename: revert both sides
        OLD_FILE=$(echo "$FILE" | awk '{print $1}')
        NEW_FILE=$(echo "$FILE" | awk '{print $2}')
        echo "REVERT RENAME: $OLD_FILE -> $NEW_FILE"
        git checkout "$BASE_BRANCH" -- "$OLD_FILE"
        git checkout "$BASE_BRANCH" -- "$NEW_FILE"
        ;;
      *)
        echo "Unhandled status [$STATUS] for $FILE"
        ;;
    esac
  done < /tmp/git_changes.txt

  # Stage only new files
  git add -A

  # Optional auto-commit
  if ! git diff --cached --quiet; then
    git commit -m "Keep only newly added files (revert modified/deleted)"
    echo "Committed changes on $BRANCH"
    git push
    echo "Push changes on $BRANCH"
  else
    echo "Nothing to commit on $BRANCH"
  fi

done

echo "========================================="
echo "All branches processed successfully"
echo "========================================="

