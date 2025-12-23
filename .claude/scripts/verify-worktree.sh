#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Worktree Verification Script with Fail-Fast Enforcement
# ═══════════════════════════════════════════════════════════════════════════
# Usage: source .claude/scripts/verify-worktree.sh
# Or: bash .claude/scripts/verify-worktree.sh
#
# Supports multiple worktree patterns:
#   - synth-{task_id}        - Synth trainer tasks
#   - localstack-{pr_id}     - LocalStack migration tasks
#   - fixer-pr{pr_number}    - LocalStack fixer tasks
#   - ls-synth-{pr_id}       - LocalStack PR branches
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current directory and branch
CURRENT_DIR=$(pwd)
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

echo -e "${YELLOW}🔍 Verifying worktree location...${NC}"
echo "   Current directory: $CURRENT_DIR"
echo "   Current branch: $CURRENT_BRANCH"

# ═══════════════════════════════════════════════════════════════════════════
# Check 1: Verify we're in a worktree directory (not main repo)
# Supports multiple worktree patterns for different workflows
# ═══════════════════════════════════════════════════════════════════════════

VALID_WORKTREE=false
WORKTREE_TYPE=""

# Pattern 1: synth-{task_id} - Synth trainer tasks
if [[ "$CURRENT_DIR" =~ worktree/synth-[^/]+$ ]]; then
    VALID_WORKTREE=true
    WORKTREE_TYPE="synth"
fi

# Pattern 2: localstack-{pr_id} - LocalStack migration tasks
if [[ "$CURRENT_DIR" =~ worktree/localstack-[^/]+$ ]]; then
    VALID_WORKTREE=true
    WORKTREE_TYPE="localstack"
fi

# Pattern 3: fixer-pr{pr_number} - LocalStack fixer tasks
if [[ "$CURRENT_DIR" =~ worktree/fixer-pr[0-9]+$ ]]; then
    VALID_WORKTREE=true
    WORKTREE_TYPE="fixer"
fi

# Pattern 4: git-{pr_id} - Git worktrees for PR operations
if [[ "$CURRENT_DIR" =~ worktree/git-[^/]+$ ]]; then
    VALID_WORKTREE=true
    WORKTREE_TYPE="git"
fi

if [ "$VALID_WORKTREE" = false ]; then
    echo -e "${RED}❌ ERROR: Not in a valid worktree directory${NC}"
    echo -e "${RED}   Current: $CURRENT_DIR${NC}"
    echo -e "${RED}   Expected patterns:${NC}"
    echo -e "${RED}     - */worktree/synth-{task_id}${NC}"
    echo -e "${RED}     - */worktree/localstack-{pr_id}${NC}"
    echo -e "${RED}     - */worktree/fixer-pr{number}${NC}"
    echo -e "${RED}     - */worktree/git-{pr_id}${NC}"
    echo ""
    echo -e "${YELLOW}Available worktrees:${NC}"
    git worktree list 2>/dev/null || echo "   No worktrees found"
    echo ""
    echo -e "${YELLOW}To fix this issue:${NC}"
    echo "   cd worktree/<worktree-name>"
    exit 1
fi

# Extract task/PR ID from directory
DIR_NAME=$(basename "$CURRENT_DIR")

# ═══════════════════════════════════════════════════════════════════════════
# Check 2: Verify branch matches directory name (for git worktrees)
# For non-git worktrees (localstack work dirs), branch check is relaxed
# ═══════════════════════════════════════════════════════════════════════════

# Only strictly check branch for git worktrees or when in actual git worktree
IS_GIT_WORKTREE=$(git rev-parse --is-inside-work-tree 2>/dev/null && git worktree list 2>/dev/null | grep -q "$CURRENT_DIR" && echo "true" || echo "false")

if [ "$IS_GIT_WORKTREE" = "true" ]; then
    # For git worktrees, branch should match directory name or be a related branch
    case "$WORKTREE_TYPE" in
        synth)
            EXPECTED_BRANCH="$DIR_NAME"
            if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
                echo -e "${RED}❌ ERROR: Branch mismatch for synth worktree${NC}"
                echo -e "${RED}   Directory: $DIR_NAME${NC}"
                echo -e "${RED}   Branch: $CURRENT_BRANCH${NC}"
                echo -e "${RED}   Expected: $EXPECTED_BRANCH${NC}"
                exit 1
            fi
            ;;
        localstack)
            # LocalStack worktrees may have ls-synth-* or localstack-* branches
            PR_ID=$(echo "$DIR_NAME" | sed 's/localstack-//')
            if [[ ! "$CURRENT_BRANCH" =~ (ls-synth-|localstack-).*$PR_ID ]]; then
                echo -e "${YELLOW}⚠️ Warning: Branch name doesn't match localstack pattern${NC}"
                echo -e "${YELLOW}   Directory: $DIR_NAME${NC}"
                echo -e "${YELLOW}   Branch: $CURRENT_BRANCH${NC}"
                # Don't fail, just warn - localstack worktrees can have varied branch names
            fi
            ;;
        fixer)
            # Fixer worktrees may be on various PR branches
            PR_NUMBER=$(echo "$DIR_NAME" | sed 's/fixer-pr//')
            echo -e "${YELLOW}   Fixer worktree for PR #$PR_NUMBER${NC}"
            # Don't enforce branch name for fixer - it works on existing PR branches
            ;;
        git)
            # Git worktrees should match directory name
            EXPECTED_BRANCH=$(echo "$DIR_NAME" | sed 's/git-//')
            if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ] && [ "$CURRENT_BRANCH" != "ls-synth-$EXPECTED_BRANCH" ]; then
                echo -e "${YELLOW}⚠️ Warning: Branch name doesn't match git worktree${NC}"
                echo -e "${YELLOW}   Directory: $DIR_NAME${NC}"
                echo -e "${YELLOW}   Branch: $CURRENT_BRANCH${NC}"
            fi
            ;;
    esac
fi

# ═══════════════════════════════════════════════════════════════════════════
# Check 3: Verify metadata.json exists (for synth/localstack worktrees)
# ═══════════════════════════════════════════════════════════════════════════

if [ "$WORKTREE_TYPE" = "synth" ] || [ "$WORKTREE_TYPE" = "localstack" ]; then
    if [ ! -f metadata.json ]; then
        echo -e "${RED}❌ ERROR: metadata.json not found${NC}"
        echo -e "${RED}   This may indicate worktree setup is incomplete${NC}"
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════════════════════════════
# Check 4: Verify we're not accidentally in main repo
# ═══════════════════════════════════════════════════════════════════════════

if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo -e "${RED}❌ ERROR: Currently on main/master branch${NC}"
    echo -e "${RED}   You should be on a task-specific branch${NC}"
    echo -e "${RED}   Current directory: $CURRENT_DIR${NC}"
    exit 1
fi

# All checks passed
echo -e "${GREEN}✅ Worktree verification passed${NC}"
echo -e "${GREEN}   Type: $WORKTREE_TYPE${NC}"
echo -e "${GREEN}   Location: $CURRENT_DIR${NC}"
echo -e "${GREEN}   Branch: $CURRENT_BRANCH${NC}"
if [ -f metadata.json ]; then
    echo -e "${GREEN}   Metadata: Found${NC}"
fi
echo ""

# Export variables for use in calling scripts
export WORKTREE_DIR="$CURRENT_DIR"
export WORKTREE_TYPE="$WORKTREE_TYPE"
export TASK_BRANCH="$CURRENT_BRANCH"

# Extract task/PR ID based on worktree type
case "$WORKTREE_TYPE" in
    synth)
        export TASK_ID=$(echo "$DIR_NAME" | sed 's/synth-//')
        ;;
    localstack)
        export TASK_ID=$(echo "$DIR_NAME" | sed 's/localstack-//')
        export PR_ID="$TASK_ID"
        ;;
    fixer)
        export PR_NUMBER=$(echo "$DIR_NAME" | sed 's/fixer-pr//')
        export TASK_ID="$PR_NUMBER"
        ;;
    git)
        export TASK_ID=$(echo "$DIR_NAME" | sed 's/git-//')
        export PR_ID="$TASK_ID"
        ;;
esac

exit 0
