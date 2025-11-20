#!/bin/bash
# Attempts to fix test coverage gaps
# Usage: fix-test-coverage.sh [coverage_file] [source_dir]

set -euo pipefail

COVERAGE_FILE="${1:-coverage/coverage-summary.json}"
SOURCE_DIR="${2:-lib}"

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "❌ Coverage file not found: $COVERAGE_FILE"
  echo "⚠️ Run tests with coverage first"
  exit 1
fi

echo "🔍 Analyzing coverage gaps..."

# Extract coverage percentage
STATEMENTS_PCT=$(jq -r '.statements.pct // 0' "$COVERAGE_FILE" 2>/dev/null || echo "0")
FUNCTIONS_PCT=$(jq -r '.functions.pct // 0' "$COVERAGE_FILE" 2>/dev/null || echo "0")
LINES_PCT=$(jq -r '.lines.pct // 0' "$COVERAGE_FILE" 2>/dev/null || echo "0")

echo "Current coverage:"
echo "  Statements: ${STATEMENTS_PCT}%"
echo "  Functions: ${FUNCTIONS_PCT}%"
echo "  Lines: ${LINES_PCT}%"

if [ "$(echo "$STATEMENTS_PCT >= 100" | bc 2>/dev/null || echo "0")" = "1" ] && \
   [ "$(echo "$FUNCTIONS_PCT >= 100" | bc 2>/dev/null || echo "0")" = "1" ] && \
   [ "$(echo "$LINES_PCT >= 100" | bc 2>/dev/null || echo "0")" = "1" ]; then
  echo "✅ Coverage already at 100%"
  exit 0
fi

# Extract uncovered files
echo "📝 Identifying uncovered code..."

UNCOVERED_FILES=$(jq -r '.files[] | select(.statements.pct < 100) | .path' "$COVERAGE_FILE" 2>/dev/null || echo "")

if [ -z "$UNCOVERED_FILES" ]; then
  echo "⚠️ No uncovered files found in coverage report"
  echo "⚠️ May need to run tests with coverage again"
  exit 1
fi

echo "Found uncovered files:"
echo "$UNCOVERED_FILES" | head -10

# Platform-specific test generation
if [ -f "metadata.json" ]; then
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null || echo "unknown")
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json 2>/dev/null || echo "unknown")
else
  PLATFORM="unknown"
  LANGUAGE="unknown"
fi

echo ""
echo "🔧 Platform: $PLATFORM, Language: $LANGUAGE"
echo "⚠️ Automatic test generation requires manual intervention"
echo ""
echo "To fix coverage gaps:"
echo "1. Review uncovered files listed above"
echo "2. Identify uncovered branches/functions"
echo "3. Add test cases for uncovered code paths"
echo "4. Re-run tests with coverage"
echo ""
echo "For platform-specific guidance, see:"
echo "  - .claude/docs/guides/validation_and_testing_guide.md"
echo "  - .claude/lessons_learnt.md"

# Return non-zero to indicate fix needed
exit 1

