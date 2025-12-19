#!/bin/bash
# Pre-flight checks for PR creation
# Reference: validation-checkpoints.md Checkpoint K

set -e

echo "🔍 Running pre-flight checks for PR creation..."

# Check 1: Verify gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install from: https://cli.github.com/"
    exit 1
fi
echo "✅ GitHub CLI installed"

# Check 2: Verify gh CLI is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated"
    echo "Run: gh auth login"
    exit 1
fi
echo "✅ GitHub CLI authenticated"

# Check 3: Verify we're in the correct worktree directory
if [[ ! $(pwd) =~ worktree/synth-[^/]+$ ]]; then
    echo "❌ Not in worktree directory"
    echo "Current: $(pwd)"
    echo "Expected pattern: */worktree/synth-{task_id}"
    exit 1
fi
echo "✅ In worktree directory: $(pwd)"

# Check 4: Verify on correct branch
BRANCH=$(git branch --show-current)
if [[ ! "$BRANCH" =~ ^synth- ]]; then
    echo "❌ Not on a synth-* branch"
    echo "Current branch: $BRANCH"
    exit 1
fi
echo "✅ On branch: $BRANCH"

# Check 5: Verify .claude instructions present
if [ ! -f .claude/commands/task-coordinator.md ]; then
    echo "❌ .claude instructions not found"
    echo "Worktree may not be created from main branch"
    exit 1
fi
echo "✅ .claude instructions present"

# Check 6: Verify metadata.json exists
if [ ! -f metadata.json ]; then
    echo "❌ metadata.json not found"
    exit 1
fi
echo "✅ metadata.json found"

# Check 7: Verify training_quality exists and meets threshold
TRAINING_QUALITY=$(jq -r '.training_quality // 0' metadata.json 2>/dev/null || echo "0")
if [ "$TRAINING_QUALITY" -lt 8 ]; then
    echo "❌ Training quality ($TRAINING_QUALITY) below minimum threshold of 8"
    echo "Review and improve implementation before creating PR"
    exit 1
fi
echo "✅ Training quality: $TRAINING_QUALITY/10 (meets threshold)"

# Check 8: Verify required files exist
REQUIRED_FILES=("lib/PROMPT.md" "lib/IDEAL_RESPONSE.md" "lib/MODEL_FAILURES.md")
for file in "${REQUIRED_FILES[@]}"; do
    # Check for base file or numbered versions (PROMPT2.md, PROMPT3.md, etc.)
    BASE_NAME=$(echo "$file" | sed 's/\.md$//')
    if ! ls ${BASE_NAME}*.md &> /dev/null; then
        echo "❌ Required file not found: $file (or variants)"
        exit 1
    fi
done
echo "✅ All required files present"

# Check 9: Verify tests exist
if [ ! -d test ] && [ ! -d tests ]; then
    echo "❌ No test directory found (test/ or tests/)"
    exit 1
fi
echo "✅ Test directory found"

echo ""
echo "✅ All pre-flight checks passed!"
echo "Ready for PR creation."
