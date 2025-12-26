#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# LocalStack Migration - Generate IDEAL_RESPONSE.md
# ═══════════════════════════════════════════════════════════════════════════
# Generates lib/IDEAL_RESPONSE.md with all infrastructure code and tests.
# Required for the claude-review-ideal-response CI/CD job.
#
# Usage: ./localstack-generate-ideal-response.sh [work_dir]
#
# Exit codes:
#   0 - Success
#   1 - Failed to generate
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Parse arguments
WORK_DIR="${1:-.}"
cd "$WORK_DIR"

# Detect platform and language
PLATFORM="unknown"
LANGUAGE="unknown"

if [[ -f "metadata.json" ]]; then
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null || echo "unknown")
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json 2>/dev/null || echo "unknown")
fi

log_info "Generating IDEAL_RESPONSE.md for $PLATFORM ($LANGUAGE)"

# Create output file
mkdir -p lib
OUTPUT_FILE="lib/IDEAL_RESPONSE.md"

# Start the file
cat > "$OUTPUT_FILE" << 'HEADER'
# Ideal Response

This document contains the final, working implementation of the infrastructure code and tests.

## Infrastructure Code

HEADER

# ═══════════════════════════════════════════════════════════════════════════
# Add infrastructure files based on platform
# ═══════════════════════════════════════════════════════════════════════════

add_code_block() {
  local file="$1"
  local lang="$2"
  
  if [[ -f "$file" ]]; then
    local filename=$(basename "$file")
    echo "" >> "$OUTPUT_FILE"
    echo "### $file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "\`\`\`$lang" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    log_success "Added: $file"
  fi
}

# Add main infrastructure files based on platform
case "$PLATFORM" in
  cdk)
    case "$LANGUAGE" in
      ts)
        for f in lib/tap-stack.ts lib/TapStack.ts lib/index.ts lib/main.ts; do
          add_code_block "$f" "typescript"
        done
        # Add any other .ts files in lib/
        for f in lib/*.ts; do
          [[ -f "$f" ]] && [[ "$f" != lib/tap-stack.ts ]] && [[ "$f" != lib/index.ts ]] && add_code_block "$f" "typescript"
        done
        ;;
      py|python)
        for f in lib/tap_stack.py lib/__init__.py; do
          add_code_block "$f" "python"
        done
        for f in lib/*.py; do
          [[ -f "$f" ]] && add_code_block "$f" "python"
        done
        ;;
      java)
        for f in lib/*.java; do
          [[ -f "$f" ]] && add_code_block "$f" "java"
        done
        ;;
      go)
        for f in lib/*.go; do
          [[ -f "$f" ]] && add_code_block "$f" "go"
        done
        ;;
    esac
    ;;
  
  cfn)
    for f in lib/TapStack.yml lib/TapStack.yaml lib/template.yml lib/template.yaml; do
      add_code_block "$f" "yaml"
    done
    for f in lib/TapStack.json lib/template.json; do
      add_code_block "$f" "json"
    done
    ;;
  
  tf)
    for f in lib/*.tf; do
      [[ -f "$f" ]] && add_code_block "$f" "hcl"
    done
    ;;
  
  cdktf)
    case "$LANGUAGE" in
      ts)
        for f in lib/main.ts lib/tap-stack.ts; do
          add_code_block "$f" "typescript"
        done
        ;;
      py|python)
        for f in lib/__main__.py lib/tap_stack.py; do
          add_code_block "$f" "python"
        done
        ;;
    esac
    ;;
  
  pulumi)
    case "$LANGUAGE" in
      ts)
        add_code_block "lib/index.ts" "typescript"
        ;;
      py|python)
        add_code_block "lib/__main__.py" "python"
        add_code_block "lib/tap_stack.py" "python"
        ;;
      go)
        add_code_block "lib/main.go" "go"
        ;;
      java)
        for f in lib/*.java; do
          [[ -f "$f" ]] && add_code_block "$f" "java"
        done
        ;;
    esac
    ;;
esac

# ═══════════════════════════════════════════════════════════════════════════
# Add test files
# ═══════════════════════════════════════════════════════════════════════════

echo "" >> "$OUTPUT_FILE"
echo "## Unit Tests" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Find and add unit test files
TEST_DIR=""
[[ -d "test" ]] && TEST_DIR="test"
[[ -d "tests" ]] && TEST_DIR="tests"

if [[ -n "$TEST_DIR" ]]; then
  # TypeScript/JavaScript unit tests
  for f in "$TEST_DIR"/*.unit.test.ts "$TEST_DIR"/*_unit_test.ts "$TEST_DIR"/*.unit.test.js; do
    [[ -f "$f" ]] && add_code_block "$f" "typescript"
  done
  
  # Python unit tests
  for f in "$TEST_DIR"/test_*_unit.py "$TEST_DIR"/*_unit_test.py; do
    [[ -f "$f" ]] && add_code_block "$f" "python"
  done
  
  # Java unit tests
  for f in "$TEST_DIR"/*UnitTest.java "$TEST_DIR"/*Unit.java; do
    [[ -f "$f" ]] && add_code_block "$f" "java"
  done
  
  # Go unit tests
  for f in "$TEST_DIR"/*_unit_test.go; do
    [[ -f "$f" ]] && add_code_block "$f" "go"
  done
fi

echo "" >> "$OUTPUT_FILE"
echo "## Integration Tests" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

if [[ -n "$TEST_DIR" ]]; then
  # TypeScript/JavaScript integration tests
  for f in "$TEST_DIR"/*.int.test.ts "$TEST_DIR"/*_int_test.ts "$TEST_DIR"/*.int.test.js "$TEST_DIR"/*.integration.test.ts; do
    [[ -f "$f" ]] && add_code_block "$f" "typescript"
  done
  
  # Python integration tests
  for f in "$TEST_DIR"/test_*_int.py "$TEST_DIR"/*_int_test.py "$TEST_DIR"/integration/*.py; do
    [[ -f "$f" ]] && add_code_block "$f" "python"
  done
  
  # Java integration tests
  for f in "$TEST_DIR"/*IntTest.java "$TEST_DIR"/*IntegrationTest.java; do
    [[ -f "$f" ]] && add_code_block "$f" "java"
  done
  
  # Go integration tests
  for f in "$TEST_DIR"/*_int_test.go "$TEST_DIR"/integration/*_test.go; do
    [[ -f "$f" ]] && add_code_block "$f" "go"
  done
fi

# ═══════════════════════════════════════════════════════════════════════════
# Verify output
# ═══════════════════════════════════════════════════════════════════════════

if [[ -f "$OUTPUT_FILE" ]]; then
  LINE_COUNT=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')
  CODE_BLOCKS=$(grep -c '```' "$OUTPUT_FILE" 2>/dev/null || echo "0")
  
  log_success "Generated $OUTPUT_FILE"
  log_info "  Lines: $LINE_COUNT"
  log_info "  Code blocks: $((CODE_BLOCKS / 2))"
  
  # Warn if empty
  if [[ "$CODE_BLOCKS" -lt 2 ]]; then
    log_warning "No code files found - IDEAL_RESPONSE.md may be incomplete"
    log_warning "Please manually add infrastructure code to lib/IDEAL_RESPONSE.md"
  fi
else
  log_error "Failed to generate IDEAL_RESPONSE.md"
  exit 1
fi

echo ""
log_success "IDEAL_RESPONSE.md generation complete!"

