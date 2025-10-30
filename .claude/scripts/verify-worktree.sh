#!/bin/bash
# Worktree Verification Script with Fail-Fast Enforcement
# Usage: source .claude/scripts/verify-worktree.sh
# Or: bash .claude/scripts/verify-worktree.sh

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

# Check 1: Verify we're in a worktree directory (not main repo)
if [[ ! "$CURRENT_DIR" =~ worktree/synth-[^/]+$ ]]; then
    echo -e "${RED}❌ ERROR: Not in worktree directory${NC}"
    echo -e "${RED}   Current: $CURRENT_DIR${NC}"
    echo -e "${RED}   Expected pattern: */worktree/synth-{task_id}${NC}"
    echo ""
    echo -e "${YELLOW}Available worktrees:${NC}"
    git worktree list 2>/dev/null || echo "   No worktrees found"
    echo ""
    echo -e "${YELLOW}To fix this issue:${NC}"
    echo "   cd worktree/synth-{task_id}"
    exit 1
fi

# Extract task ID from directory
DIR_NAME=$(basename "$CURRENT_DIR")
EXPECTED_BRANCH="$DIR_NAME"

# Check 2: Verify branch matches directory name
if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
    echo -e "${RED}❌ ERROR: Branch mismatch${NC}"
    echo -e "${RED}   Directory: $DIR_NAME${NC}"
    echo -e "${RED}   Branch: $CURRENT_BRANCH${NC}"
    echo -e "${RED}   Expected: Branch should match directory name${NC}"
    exit 1
fi

# Check 3: Verify metadata.json exists
if [ ! -f metadata.json ]; then
    echo -e "${RED}❌ ERROR: metadata.json not found${NC}"
    echo -e "${RED}   This may indicate worktree setup is incomplete${NC}"
    exit 1
fi

# Check 4: Verify we're not accidentally in main repo
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo -e "${RED}❌ ERROR: Currently on main/master branch${NC}"
    echo -e "${RED}   You should be on a task-specific branch (synth-{task_id})${NC}"
    echo -e "${RED}   Current directory: $CURRENT_DIR${NC}"
    exit 1
fi

# All checks passed
echo -e "${GREEN}✅ Worktree verification passed${NC}"
echo -e "${GREEN}   Location: $CURRENT_DIR${NC}"
echo -e "${GREEN}   Branch: $CURRENT_BRANCH${NC}"
echo -e "${GREEN}   Metadata: Found${NC}"
echo ""

# Export variables for use in calling scripts
export WORKTREE_DIR="$CURRENT_DIR"
export TASK_BRANCH="$CURRENT_BRANCH"
export TASK_ID=$(echo "$CURRENT_BRANCH" | sed 's/synth-//')

exit 0
