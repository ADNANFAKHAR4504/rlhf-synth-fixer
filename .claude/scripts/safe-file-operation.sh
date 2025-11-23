#!/bin/bash
# Safe File Operation Wrapper
# Ensures file operations only happen in correct worktree context
# Usage: bash .claude/scripts/safe-file-operation.sh <operation> <args>

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# First, verify we're in a worktree
CURRENT_DIR=$(pwd)
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

# Check if in worktree
if [[ ! "$CURRENT_DIR" =~ worktree/synth-[^/]+$ ]]; then
    echo -e "${RED}❌ SAFETY CHECK FAILED${NC}"
    echo -e "${RED}   File operations are only allowed in worktree directories${NC}"
    echo -e "${RED}   Current location: $CURRENT_DIR${NC}"
    echo -e "${RED}   Current branch: $CURRENT_BRANCH${NC}"
    echo ""
    echo -e "${YELLOW}This safety check prevents accidentally creating/modifying files in:${NC}"
    echo -e "${YELLOW}   - Main repository${NC}"
    echo -e "${YELLOW}   - Wrong branch${NC}"
    echo -e "${YELLOW}   - Wrong directory${NC}"
    echo ""
    echo -e "${YELLOW}To fix: cd worktree/synth-{task_id}${NC}"
    exit 1
fi

# Check if on main/master branch (should never happen in worktree, but double-check)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo -e "${RED}❌ CRITICAL SAFETY CHECK FAILED${NC}"
    echo -e "${RED}   Currently on main/master branch${NC}"
    echo -e "${RED}   File operations on main branch are forbidden${NC}"
    exit 1
fi

# All safety checks passed
echo -e "${GREEN}✅ Safety checks passed - location verified${NC}"
echo -e "   Worktree: $CURRENT_DIR"
echo -e "   Branch: $CURRENT_BRANCH"

# Execute the requested operation
# Note: This script verifies location but doesn't execute operations itself
# Use it as a pre-check before dangerous operations

exit 0
