#!/bin/bash
#
# CSV Safety Pre-flight Check
#
# This script checks for common CSV safety issues in agent files before execution.
# Run this before executing any agent that modifies .claude/tasks.csv
#
# Usage: ./.claude/scripts/check-csv-safety.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$CLAUDE_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "CSV Safety Pre-flight Check"
echo "======================================"
echo ""

# Check 1: Validate current .claude/tasks.csv
echo "🔍 Checking .claude/tasks.csv integrity..."
if ! python3 "$SCRIPT_DIR/validate-tasks-csv.py" > /dev/null 2>&1; then
    echo -e "${RED}❌ .claude/tasks.csv validation failed!${NC}"
    echo "   Run: python3 .claude/scripts/validate-tasks-csv.py for details"
    exit 1
else
    echo -e "${GREEN}✅ .claude/tasks.csv is valid${NC}"
fi

# Check 2: Verify backup exists
echo ""
echo "🔍 Checking for backup file..."
if [ -f "$CLAUDE_DIR/tasks.csv.backup" ]; then
    # Validate backup
    if python3 "$SCRIPT_DIR/validate-tasks-csv.py" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backup file exists and is valid${NC}"
    else
        echo -e "${YELLOW}⚠️  Backup file exists but is invalid${NC}"
        echo "   Creating new backup..."
        python3 "$SCRIPT_DIR/validate-tasks-csv.py" --create-backup
    fi
else
    echo -e "${YELLOW}⚠️  No backup file found${NC}"
    echo "   Creating backup..."
    python3 "$SCRIPT_DIR/validate-tasks-csv.py" --create-backup
fi

# Check 3: Scan agent files for unsafe CSV patterns
echo ""
echo "🔍 Scanning agent files for unsafe CSV patterns..."

UNSAFE_PATTERNS_FOUND=0

# Pattern 1: open() without newline=''
if grep -r "open.*tasks\.csv.*['\"]w['\"]" "$REPO_ROOT/.claude/" 2>/dev/null | grep -v "newline=''" | grep -v "csv_safety_guide.md" > /dev/null 2>&1; then
    echo -e "${RED}❌ Found CSV write without newline='' parameter${NC}"
    grep -rn "open.*tasks\.csv.*['\"]w['\"]" "$REPO_ROOT/.claude/" 2>/dev/null | grep -v "newline=''" | grep -v "csv_safety_guide.md"
    UNSAFE_PATTERNS_FOUND=$((UNSAFE_PATTERNS_FOUND + 1))
fi

# Pattern 2: csv write without backup
AGENT_FILES=$(find "$REPO_ROOT/.claude" -name "*.md" -not -name "csv_safety_guide.md")
for file in $AGENT_FILES; do
    if grep -q "csv.DictWriter" "$file"; then
        # Check if backup is created in same file
        if ! grep -q "shutil.copy2.*tasks.csv.*backup" "$file"; then
            echo -e "${YELLOW}⚠️  CSV write found without backup in: $file${NC}"
            UNSAFE_PATTERNS_FOUND=$((UNSAFE_PATTERNS_FOUND + 1))
        fi
    fi
done

if [ $UNSAFE_PATTERNS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No unsafe patterns detected in agent files${NC}"
else
    echo -e "${YELLOW}⚠️  Found $UNSAFE_PATTERNS_FOUND potential safety issues${NC}"
    echo "   Review agent files for proper CSV safety patterns"
fi

# Check 4: Verify validation tool exists
echo ""
echo "🔍 Checking validation tool..."
if [ -x "$SCRIPT_DIR/validate-tasks-csv.py" ]; then
    echo -e "${GREEN}✅ Validation tool is present and executable${NC}"
else
    echo -e "${RED}❌ Validation tool is missing or not executable${NC}"
    exit 1
fi

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ CSV Safety Pre-flight Check Complete${NC}"
echo "======================================"
echo ""
echo "Safe to proceed with CSV operations."
echo ""
echo "Remember:"
echo "  • Always create backup before modifying CSV"
echo "  • Always read ALL rows, modify specific ones, write ALL rows"
echo "  • Always validate row counts before and after"
echo "  • Always use error handling with backup restore"
echo ""
echo "See .claude/docs/policies/csv_safety_guide.md for detailed guidelines"
echo ""

exit 0

