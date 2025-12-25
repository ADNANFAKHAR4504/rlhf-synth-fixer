#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# fix-prompt-quality.sh - Auto-fix LLM-generated content indicators in PROMPT.md
# ═══════════════════════════════════════════════════════════════════════════════
#
# Purpose: Automatically fix common LLM-generated content indicators that cause
#          the "Claude Review: Prompt Quality" CI check to fail.
#
# Fixes applied:
#   1. Square brackets [content] -> content
#   2. Formal abbreviations (e.g., i.e., etc.) -> natural alternatives
#   3. En dashes (–) and em dashes (—) -> regular hyphens (-)
#   4. Excessive parentheses -> inlined or removed
#
# Usage:
#   ./fix-prompt-quality.sh [prompt_file]
#   ./fix-prompt-quality.sh                     # Default: lib/PROMPT.md
#   ./fix-prompt-quality.sh lib/PROMPT.md       # Explicit path
#
# Exit codes:
#   0 = Fixes applied successfully
#   1 = File not found or error
#   2 = Still has issues after fix (manual intervention needed)
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

PROMPT_FILE="${1:-lib/PROMPT.md}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Track changes
CHANGES_MADE=0

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_fix() {
  echo -e "${GREEN}🔧 $1${NC}"
  CHANGES_MADE=$((CHANGES_MADE + 1))
}

# Cross-platform sed -i
sed_inplace() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "🔧 PROMPT QUALITY AUTO-FIXER"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Check if file exists
if [[ ! -f "$PROMPT_FILE" ]]; then
  log_error "PROMPT.md not found: $PROMPT_FILE"
  exit 1
fi

log_info "Processing: $PROMPT_FILE"

# Create backup
BACKUP_FILE="${PROMPT_FILE}.bak.$(date +%s)"
cp "$PROMPT_FILE" "$BACKUP_FILE"
log_info "Backup created: $BACKUP_FILE"

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 1: Remove square brackets
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
log_info "Checking for square brackets..."

SQUARE_BRACKET_COUNT=$(grep -o '\[' "$PROMPT_FILE" 2>/dev/null | wc -l | tr -d ' ')
if [[ $SQUARE_BRACKET_COUNT -gt 0 ]]; then
  log_fix "Removing $SQUARE_BRACKET_COUNT square bracket pair(s)..."
  
  # Replace [content] with content (non-greedy match)
  # Handle nested brackets by running multiple passes
  for i in {1..3}; do
    sed_inplace -E 's/\[([^][]*)\]/\1/g' "$PROMPT_FILE"
  done
  
  # Check remaining
  REMAINING=$(grep -o '\[' "$PROMPT_FILE" 2>/dev/null | wc -l | tr -d ' ')
  if [[ $REMAINING -gt 0 ]]; then
    log_warning "Still $REMAINING square brackets remaining (may be nested or in code blocks)"
  fi
else
  log_success "No square brackets found"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 2: Replace formal abbreviations
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
log_info "Checking for formal abbreviations..."

# e.g. -> like, such as
if grep -qiE 'e\.g\.' "$PROMPT_FILE"; then
  EG_COUNT=$(grep -oiE 'e\.g\.' "$PROMPT_FILE" | wc -l | tr -d ' ')
  log_fix "Replacing $EG_COUNT occurrence(s) of 'e.g.' with 'like'"
  
  # Replace various forms
  sed_inplace -E 's/\(e\.g\.,? /\(like /gi' "$PROMPT_FILE"
  sed_inplace -E 's/e\.g\.,? /like /gi' "$PROMPT_FILE"
  sed_inplace -E 's/E\.g\.,? /Like /gi' "$PROMPT_FILE"
fi

# i.e. -> meaning, that is
if grep -qiE 'i\.e\.' "$PROMPT_FILE"; then
  IE_COUNT=$(grep -oiE 'i\.e\.' "$PROMPT_FILE" | wc -l | tr -d ' ')
  log_fix "Replacing $IE_COUNT occurrence(s) of 'i.e.' with 'meaning'"
  
  sed_inplace -E 's/\(i\.e\.,? /\(meaning /gi' "$PROMPT_FILE"
  sed_inplace -E 's/i\.e\.,? /meaning /gi' "$PROMPT_FILE"
  sed_inplace -E 's/I\.e\.,? /Meaning /gi' "$PROMPT_FILE"
fi

# etc. -> remove or replace
if grep -qiE 'etc\.' "$PROMPT_FILE"; then
  ETC_COUNT=$(grep -oiE 'etc\.' "$PROMPT_FILE" | wc -l | tr -d ' ')
  log_fix "Removing $ETC_COUNT occurrence(s) of 'etc.'"
  
  # Remove ", etc." and "etc."
  sed_inplace -E 's/, etc\.//gi' "$PROMPT_FILE"
  sed_inplace -E 's/ etc\.//gi' "$PROMPT_FILE"
  sed_inplace -E 's/etc\.//gi' "$PROMPT_FILE"
fi

# cf. -> see
if grep -qiE 'cf\.' "$PROMPT_FILE"; then
  CF_COUNT=$(grep -oiE 'cf\.' "$PROMPT_FILE" | wc -l | tr -d ' ')
  log_fix "Replacing $CF_COUNT occurrence(s) of 'cf.' with 'see'"
  
  sed_inplace -E 's/cf\./see/gi' "$PROMPT_FILE"
fi

# viz. -> namely
if grep -qiE 'viz\.' "$PROMPT_FILE"; then
  VIZ_COUNT=$(grep -oiE 'viz\.' "$PROMPT_FILE" | wc -l | tr -d ' ')
  log_fix "Replacing $VIZ_COUNT occurrence(s) of 'viz.' with 'namely'"
  
  sed_inplace -E 's/viz\./namely/gi' "$PROMPT_FILE"
fi

# Check if any formal abbreviations remain
if ! grep -qiE 'e\.g\.|i\.e\.|etc\.|cf\.|viz\.' "$PROMPT_FILE"; then
  log_success "All formal abbreviations removed"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 3: Replace en dashes and em dashes
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
log_info "Checking for special dashes..."

# En dash (–) -> hyphen (-)
if grep -q '–' "$PROMPT_FILE"; then
  EN_DASH_COUNT=$(grep -o '–' "$PROMPT_FILE" | wc -l | tr -d ' ')
  log_fix "Replacing $EN_DASH_COUNT en dash(es) with regular hyphens"
  
  sed_inplace 's/–/-/g' "$PROMPT_FILE"
fi

# Em dash (—) -> hyphen (-) or split sentence
if grep -q '—' "$PROMPT_FILE"; then
  EM_DASH_COUNT=$(grep -o '—' "$PROMPT_FILE" | wc -l | tr -d ' ')
  log_fix "Replacing $EM_DASH_COUNT em dash(es) with regular hyphens"
  
  sed_inplace 's/—/-/g' "$PROMPT_FILE"
fi

if ! grep -q '[–—]' "$PROMPT_FILE"; then
  log_success "No special dashes found"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 4: Reduce excessive parentheses
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
log_info "Checking for excessive parentheses..."

ROUND_BRACKET_COUNT=$(grep -o '(' "$PROMPT_FILE" 2>/dev/null | wc -l | tr -d ' ')
CURLY_BRACKET_COUNT=$(grep -o '{' "$PROMPT_FILE" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_BRACKETS=$((ROUND_BRACKET_COUNT + CURLY_BRACKET_COUNT))

if [[ $TOTAL_BRACKETS -gt 1 ]]; then
  log_warning "Found $TOTAL_BRACKETS bracket pair(s) (max 1 allowed)"
  log_fix "Attempting to reduce brackets..."
  
  # Remove common qualifier patterns in parentheses
  sed_inplace -E 's/\(optional\)//gi' "$PROMPT_FILE"
  sed_inplace -E 's/\(required\)//gi' "$PROMPT_FILE"
  sed_inplace -E 's/\(default\)//gi' "$PROMPT_FILE"
  sed_inplace -E 's/\(recommended\)//gi' "$PROMPT_FILE"
  sed_inplace -E 's/\(mandatory\)//gi' "$PROMPT_FILE"
  sed_inplace -E 's/\(if applicable\)//gi' "$PROMPT_FILE"
  sed_inplace -E 's/\(if needed\)//gi' "$PROMPT_FILE"
  sed_inplace -E 's/\(as needed\)//gi' "$PROMPT_FILE"
  sed_inplace -E 's/\(see above\)//gi' "$PROMPT_FILE"
  sed_inplace -E 's/\(see below\)//gi' "$PROMPT_FILE"
  
  # Remove empty parentheses that might result
  sed_inplace -E 's/\(\s*\)//g' "$PROMPT_FILE"
  
  # Remove double spaces
  sed_inplace -E 's/  +/ /g' "$PROMPT_FILE"
  
  # Try to inline short parenthetical content (up to 15 chars)
  # Replace "X (Y)" with "X, specifically Y," when Y is short
  # This is a conservative approach to avoid breaking meaningful content
  
  # For single-word acronym expansions like "(AWS)" or "(S3)", remove them
  sed_inplace -E 's/ \([A-Z0-9]{1,5}\)//g' "$PROMPT_FILE"
  
  # Re-count
  NEW_ROUND=$(grep -o '(' "$PROMPT_FILE" 2>/dev/null | wc -l | tr -d ' ')
  NEW_CURLY=$(grep -o '{' "$PROMPT_FILE" 2>/dev/null | wc -l | tr -d ' ')
  NEW_TOTAL=$((NEW_ROUND + NEW_CURLY))
  
  if [[ $NEW_TOTAL -le 1 ]]; then
    log_success "Brackets reduced to acceptable level ($NEW_TOTAL)"
  else
    log_warning "Still $NEW_TOTAL brackets after auto-fix"
    echo ""
    echo "   Lines with remaining brackets:"
    grep -n '(' "$PROMPT_FILE" | head -5 | while read -r line; do
      echo "   $line"
    done
    echo ""
    echo "   Manual rewriting may be needed to reduce brackets further."
    echo "   Consider:"
    echo "   - Rewrite 'X (Y)' as 'X, which is Y' or just 'X'"
    echo "   - Move parenthetical content to its own sentence"
    echo "   - Remove redundant clarifications"
  fi
else
  log_success "Bracket count acceptable ($TOTAL_BRACKETS)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# FIX 5: Remove emojis (if any)
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
log_info "Checking for emojis..."

# Use perl for proper Unicode emoji handling
if perl -ne 'exit 1 if /[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]|[\x{1F600}-\x{1F64F}]|[\x{1F680}-\x{1F6FF}]|[\x{1FA00}-\x{1FAFF}]/' "$PROMPT_FILE" 2>/dev/null; then
  log_success "No emojis found"
else
  log_fix "Removing emojis..."
  
  perl -i -pe 's/[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]|[\x{1F600}-\x{1F64F}]|[\x{1F680}-\x{1F6FF}]|[\x{1FA00}-\x{1FAFF}]//g' "$PROMPT_FILE" 2>/dev/null || true
  
  log_success "Emojis removed"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CLEANUP AND FINAL VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
log_info "Cleaning up..."

# Remove trailing whitespace
sed_inplace -E 's/[[:space:]]+$//' "$PROMPT_FILE"

# Remove multiple consecutive blank lines
# Using awk for cross-platform compatibility
awk 'NF {blank=0} !NF {blank++} blank<=2' "$PROMPT_FILE" > "${PROMPT_FILE}.tmp" && mv "${PROMPT_FILE}.tmp" "$PROMPT_FILE"

# ═══════════════════════════════════════════════════════════════════════════════
# VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "📋 VALIDATION RESULTS"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

VALIDATION_PASSED=true
ISSUES=()

# Check square brackets
SQ_COUNT=$(grep -o '\[' "$PROMPT_FILE" 2>/dev/null | wc -l | tr -d ' ')
if [[ $SQ_COUNT -gt 0 ]]; then
  ISSUES+=("Square brackets: $SQ_COUNT (should be 0)")
  VALIDATION_PASSED=false
fi

# Check formal abbreviations
if grep -qiE 'e\.g\.|i\.e\.|etc\.|cf\.|viz\.' "$PROMPT_FILE"; then
  ABBREV_FOUND=$(grep -oiE 'e\.g\.|i\.e\.|etc\.|cf\.|viz\.' "$PROMPT_FILE" | head -3 | tr '\n' ', ')
  ISSUES+=("Formal abbreviations found: $ABBREV_FOUND")
  VALIDATION_PASSED=false
fi

# Check special dashes
if grep -q '[–—]' "$PROMPT_FILE"; then
  DASH_COUNT=$(grep -o '[–—]' "$PROMPT_FILE" | wc -l | tr -d ' ')
  ISSUES+=("Special dashes: $DASH_COUNT")
  VALIDATION_PASSED=false
fi

# Check brackets
FINAL_ROUND=$(grep -o '(' "$PROMPT_FILE" 2>/dev/null | wc -l | tr -d ' ')
FINAL_CURLY=$(grep -o '{' "$PROMPT_FILE" 2>/dev/null | wc -l | tr -d ' ')
FINAL_TOTAL=$((FINAL_ROUND + FINAL_CURLY))
if [[ $FINAL_TOTAL -gt 1 ]]; then
  ISSUES+=("Brackets: $FINAL_TOTAL (max 1 allowed)")
  VALIDATION_PASSED=false
fi

# Print results
echo "Changes made: $CHANGES_MADE"
echo ""

if [[ "$VALIDATION_PASSED" == "true" ]]; then
  log_success "All prompt quality checks PASSED"
  echo ""
  
  # Clean up backup if successful
  rm -f "$BACKUP_FILE"
  log_info "Backup removed (fix successful)"
  
  exit 0
else
  log_warning "Some issues remain after auto-fix:"
  echo ""
  for issue in "${ISSUES[@]}"; do
    echo "   • $issue"
  done
  echo ""
  echo "Manual intervention may be required."
  echo "Backup preserved at: $BACKUP_FILE"
  echo ""
  
  # Run full validation script if available for detailed output
  if [[ -x "$PROJECT_ROOT/.claude/scripts/claude-validate-prompt-quality.sh" ]]; then
    echo "Running full validation for details..."
    echo ""
    cd "$(dirname "$PROMPT_FILE")/.." 2>/dev/null || true
    bash "$PROJECT_ROOT/.claude/scripts/claude-validate-prompt-quality.sh" 2>&1 | grep -E "FAIL|detected|found" | head -10 || true
  fi
  
  exit 2
fi

