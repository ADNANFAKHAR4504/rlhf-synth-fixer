#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Install Git Hooks Script
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Install pre-push hooks for automatic validation
#
# Usage:
#   ./install-hooks.sh           # Install hooks
#   ./install-hooks.sh --remove  # Remove hooks
# ═══════════════════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  🔧 Git Hooks Installation${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in a git repository
if [[ ! -d "$PROJECT_ROOT/.git" ]]; then
  echo -e "${RED}❌ Not a git repository${NC}"
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

if [[ "$1" == "--remove" ]]; then
  # Remove hooks
  if [[ -f "$HOOKS_DIR/pre-push" ]] || [[ -L "$HOOKS_DIR/pre-push" ]]; then
    rm -f "$HOOKS_DIR/pre-push"
    echo -e "${GREEN}✅ Removed pre-push hook${NC}"
  else
    echo -e "${YELLOW}⚠️  No pre-push hook to remove${NC}"
  fi
  exit 0
fi

# Install pre-push hook as symlink
PRE_PUSH_SRC="$SCRIPT_DIR/../hooks/pre-push"

if [[ -f "$PRE_PUSH_SRC" ]]; then
  # Remove existing hook if present
  rm -f "$HOOKS_DIR/pre-push"
  
  # Create symlink (relative path for portability)
  ln -sf "../../.claude/hooks/pre-push" "$HOOKS_DIR/pre-push"
  chmod +x "$PRE_PUSH_SRC"
  
  echo -e "${GREEN}✅ Installed pre-push hook (symlink)${NC}"
  echo -e "   ${CYAN}Source:${NC} .claude/hooks/pre-push"
  echo -e "   ${CYAN}Target:${NC} .git/hooks/pre-push"
else
  echo -e "${RED}❌ Pre-push hook source not found${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Git hooks installed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  The pre-push hook will now automatically validate your"
echo -e "  LocalStack tasks before pushing to GitHub."
echo ""
echo -e "  ${YELLOW}To bypass (not recommended):${NC} git push --no-verify"
echo ""

