#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Quick Check Script - Fast Pre-Push Validation
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Run essential checks in under 30 seconds before every commit/push
# Use this for rapid iteration; use production-ready-check.sh for full validation
#
# Usage:
#   ./quick-check.sh [work_dir]
#   ./quick-check.sh                    # Use current directory
#   ./quick-check.sh worktree/ls-Pr7179 # Specify directory
#
# Exit codes:
#   0 = All quick checks passed
#   1 = One or more checks failed
# ═══════════════════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

WORK_DIR="${1:-$(pwd)}"

# Resolve to absolute path
if [[ -d "$WORK_DIR" ]]; then
  WORK_DIR="$(cd "$WORK_DIR" && pwd)"
else
  echo -e "${RED}❌ Directory not found: $WORK_DIR${NC}"
  exit 1
fi

cd "$WORK_DIR"

echo ""
echo -e "${CYAN}⚡ QUICK CHECK${NC} - Fast Pre-Push Validation"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

FAILED=false

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 1: metadata.json exists and is valid JSON
# ═══════════════════════════════════════════════════════════════════════════════

echo -n "  1. metadata.json... "
if [[ ! -f "metadata.json" ]]; then
  echo -e "${RED}❌ File not found${NC}"
  FAILED=true
  echo ""
  echo -e "${RED}  This doesn't appear to be a LocalStack task directory.${NC}"
  echo -e "${YELLOW}  Run from a task directory (e.g., worktree/ls-Pr1234)${NC}"
  echo ""
  exit 1
elif ! jq . metadata.json > /dev/null 2>&1; then
  echo -e "${RED}❌ Invalid JSON${NC}"
  FAILED=true
else
  echo -e "${GREEN}✅${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 2: provider is localstack
# ═══════════════════════════════════════════════════════════════════════════════

echo -n "  2. provider=localstack... "
PROVIDER=$(jq -r '.provider // ""' metadata.json 2>/dev/null || echo "")
if [[ "$PROVIDER" == "localstack" ]]; then
  echo -e "${GREEN}✅${NC}"
elif [[ -z "$PROVIDER" ]]; then
  echo -e "${RED}❌ Provider not set${NC}"
  FAILED=true
else
  echo -e "${RED}❌ Provider is '$PROVIDER'${NC}"
  FAILED=true
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 3: wave field exists (P0 or P1)
# ═══════════════════════════════════════════════════════════════════════════════

echo -n "  3. wave field... "
WAVE=$(jq -r '.wave // ""' metadata.json 2>/dev/null)
if [[ "$WAVE" =~ ^(P0|P1)$ ]]; then
  echo -e "${GREEN}✅ ($WAVE)${NC}"
else
  echo -e "${RED}❌ Missing or invalid${NC}"
  FAILED=true
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 4: No disallowed fields
# ═══════════════════════════════════════════════════════════════════════════════

echo -n "  4. No disallowed fields... "
DISALLOWED=("training_quality" "task_id" "pr_id" "dockerS3Location")
HAS_DISALLOWED=false
for field in "${DISALLOWED[@]}"; do
  if jq -e ".$field" metadata.json > /dev/null 2>&1; then
    HAS_DISALLOWED=true
    break
  fi
done
if [[ "$HAS_DISALLOWED" == "false" ]]; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌ Found disallowed fields${NC}"
  FAILED=true
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 5: No emojis in lib/*.md
# ═══════════════════════════════════════════════════════════════════════════════

echo -n "  5. No emojis in lib/*.md... "
EMOJI_PATTERN='[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]'
EMOJI_FOUND=false
for mdfile in lib/*.md 2>/dev/null; do
  if [[ -f "$mdfile" ]]; then
    if grep -Pq "$EMOJI_PATTERN" "$mdfile" 2>/dev/null; then
      EMOJI_FOUND=true
      break
    fi
  fi
done
if [[ "$EMOJI_FOUND" == "false" ]]; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌ Emojis found${NC}"
  FAILED=true
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 6: Commit message format
# ═══════════════════════════════════════════════════════════════════════════════

echo -n "  6. Commit message format... "
LAST_COMMIT=$(git log -1 --format="%s" 2>/dev/null || echo "")
if [[ -z "$LAST_COMMIT" ]]; then
  echo -e "${YELLOW}⏭️ No commits${NC}"
elif echo "$LAST_COMMIT" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)(\(.+\))?!?:"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌ Invalid format${NC}"
  FAILED=true
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 7: TypeScript compilation (if applicable)
# ═══════════════════════════════════════════════════════════════════════════════

LANGUAGE=$(jq -r '.language // ""' metadata.json 2>/dev/null)
if [[ "$LANGUAGE" == "ts" ]] && [[ -f "tsconfig.json" ]]; then
  echo -n "  7. TypeScript compiles... "
  if npx tsc --noEmit > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
  else
    echo -e "${RED}❌ Compilation errors${NC}"
    FAILED=true
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 8: Jest config uses 'test/' not 'tests/'
# ═══════════════════════════════════════════════════════════════════════════════

if [[ -f "jest.config.js" ]]; then
  echo -n "  8. Jest config folder... "
  if grep -q "roots.*tests" jest.config.js 2>/dev/null; then
    echo -e "${RED}❌ Uses 'tests/' not 'test/'${NC}"
    FAILED=true
  else
    echo -e "${GREEN}✅${NC}"
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 9: Required docs for synth tasks
# ═══════════════════════════════════════════════════════════════════════════════

TEAM=$(jq -r '.team // ""' metadata.json 2>/dev/null)
if [[ "$TEAM" =~ ^synth ]]; then
  echo -n "  9. Required docs (synth)... "
  if [[ -f "lib/PROMPT.md" ]] && [[ -f "lib/MODEL_RESPONSE.md" ]]; then
    echo -e "${GREEN}✅${NC}"
  else
    echo -e "${RED}❌ Missing PROMPT.md or MODEL_RESPONSE.md${NC}"
    FAILED=true
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 10: IDEAL_RESPONSE.md exists
# ═══════════════════════════════════════════════════════════════════════════════

echo -n " 10. IDEAL_RESPONSE.md... "
if [[ -f "lib/IDEAL_RESPONSE.md" ]]; then
  CODE_BLOCKS=$(grep -c '```' lib/IDEAL_RESPONSE.md 2>/dev/null || echo "0")
  if [[ "$CODE_BLOCKS" -ge 2 ]]; then
    echo -e "${GREEN}✅${NC}"
  else
    echo -e "${YELLOW}⚠️ No code blocks${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Missing (will be generated)${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ "$FAILED" == "true" ]]; then
  echo ""
  echo -e "${RED}${BOLD}  ❌ QUICK CHECK FAILED${NC}"
  echo ""
  echo -e "  Fix issues above, then:"
  echo -e "  ${CYAN}• Auto-fix:${NC} bash .claude/scripts/production-ready-check.sh --fix"
  echo -e "  ${CYAN}• Full check:${NC} bash .claude/scripts/production-ready-check.sh"
  echo ""
  exit 1
else
  echo ""
  echo -e "${GREEN}${BOLD}  ✅ QUICK CHECK PASSED${NC}"
  echo ""
  echo -e "  For full validation: ${CYAN}bash .claude/scripts/production-ready-check.sh${NC}"
  echo ""
  exit 0
fi

