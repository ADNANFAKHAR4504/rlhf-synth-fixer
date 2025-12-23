#!/bin/bash
# Pre-Submission Validation Script
# Validates all requirements before PR creation
# Usage: bash .claude/scripts/pre-submission-check.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in a worktree
if [ ! -f metadata.json ]; then
  echo -e "${RED}❌ ERROR: metadata.json not found${NC}"
  echo "This script must be run from the worktree directory"
  exit 1
fi

TASK_ID=$(jq -r '.po_id' metadata.json)
PLATFORM=$(jq -r '.platform' metadata.json)
LANGUAGE=$(jq -r '.language' metadata.json)

echo -e "${BLUE}🔍 Pre-Submission Validation for Task ${TASK_ID}${NC}"
echo -e "${BLUE}Platform: ${PLATFORM}-${LANGUAGE}${NC}"
echo "================================================"

FAILED_CHECKS=0

# Function to report check result
check_result() {
  local check_name="$1"
  local result="$2"
  local details="$3"
  
  if [ "$result" -eq 0 ]; then
    echo -e "${GREEN}✅ ${check_name}${NC}"
    if [ -n "$details" ]; then
      echo -e "${GREEN}   ${details}${NC}"
    fi
  else
    echo -e "${RED}❌ ${check_name}${NC}"
    if [ -n "$details" ]; then
      echo -e "${RED}   ${details}${NC}"
    fi
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
}

# 1. Build Success
echo ""
echo -e "${BLUE}1️⃣ Checking Build...${NC}"
if bash scripts/build.sh > /dev/null 2>&1; then
  check_result "Build successful" 0
else
  check_result "Build failed" 1 "Run: bash scripts/build.sh"
fi

# 2. Lint Issues
echo ""
echo -e "${BLUE}2️⃣ Checking Lint...${NC}"
if bash scripts/lint.sh > /dev/null 2>&1; then
  check_result "No lint issues" 0
else
  check_result "Lint errors found" 1 "Run: bash scripts/lint.sh"
fi

# 3. Synth Issues (if applicable)
echo ""
echo -e "${BLUE}3️⃣ Checking Synth...${NC}"
if [ -f scripts/synth.sh ]; then
  if bash scripts/synth.sh > /dev/null 2>&1; then
    check_result "Synth successful" 0
  else
    check_result "Synth failed" 1 "Run: bash scripts/synth.sh"
  fi
else
  check_result "Synth not applicable for this platform" 0
fi

# 4. Deployment Success
echo ""
echo -e "${BLUE}4️⃣ Checking Deployment...${NC}"
if [ ! -f cfn-outputs/flat-outputs.json ]; then
  check_result "Deployment outputs not found" 1 "Run: bash scripts/deploy.sh"
else
  OUTPUTS_COUNT=$(jq 'length' cfn-outputs/flat-outputs.json)
  check_result "Deployment successful" 0 "${OUTPUTS_COUNT} outputs found"
fi

# 5. Test Coverage
echo ""
echo -e "${BLUE}5️⃣ Checking Test Coverage...${NC}"

# Run unit tests
if bash scripts/unit-tests.sh > /dev/null 2>&1; then
  echo -e "${GREEN}   Unit tests passed${NC}"
else
  check_result "Unit tests failed" 1 "Run: bash scripts/unit-tests.sh"
fi

# Extract coverage based on platform
COVERAGE_FOUND=false
COVERAGE_PASS=false

if [ -f coverage/coverage-summary.json ]; then
  COVERAGE_FOUND=true
  STMT_COV=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
  BRANCH_COV=$(jq -r '.total.branches.pct' coverage/coverage-summary.json)
  FUNC_COV=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
  LINE_COV=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
  
  echo -e "${BLUE}   Statement Coverage: ${STMT_COV}%${NC}"
  echo -e "${BLUE}   Branch Coverage: ${BRANCH_COV}%${NC}"
  echo -e "${BLUE}   Function Coverage: ${FUNC_COV}%${NC}"
  echo -e "${BLUE}   Line Coverage: ${LINE_COV}%${NC}"
  
  # Check if coverage meets 100% requirement
  if (( $(echo "$STMT_COV >= 100" | bc -l) )) && \
     (( $(echo "$FUNC_COV >= 100" | bc -l) )) && \
     (( $(echo "$LINE_COV >= 100" | bc -l) )); then
    COVERAGE_PASS=true
    check_result "Test coverage: 100%" 0
  else
    check_result "Test coverage below 100%" 1 "Statements: ${STMT_COV}%, Functions: ${FUNC_COV}%, Lines: ${LINE_COV}%"
  fi
elif [ -f coverage.xml ]; then
  COVERAGE_FOUND=true
  # Python coverage.xml
  COVERAGE=$(python3 -c "import xml.etree.ElementTree as ET; tree = ET.parse('coverage.xml'); root = tree.getroot(); print(root.attrib.get('line-rate', '0'))" 2>/dev/null || echo "0")
  COVERAGE_PCT=$(echo "$COVERAGE * 100" | bc)
  
  echo -e "${BLUE}   Line Coverage: ${COVERAGE_PCT}%${NC}"
  
  if (( $(echo "$COVERAGE_PCT >= 100" | bc -l) )); then
    COVERAGE_PASS=true
    check_result "Test coverage: 100%" 0
  else
    check_result "Test coverage below 100%" 1 "Coverage: ${COVERAGE_PCT}%"
  fi
elif [ -f coverage/lcov.info ]; then
  COVERAGE_FOUND=true
  # Try to extract from lcov
  LINES_FOUND=$(grep -E '^LF:' coverage/lcov.info | cut -d: -f2 | paste -sd+ | bc)
  LINES_HIT=$(grep -E '^LH:' coverage/lcov.info | cut -d: -f2 | paste -sd+ | bc)
  
  if [ "$LINES_FOUND" -gt 0 ]; then
    COVERAGE_PCT=$(echo "scale=2; $LINES_HIT * 100 / $LINES_FOUND" | bc)
    echo -e "${BLUE}   Line Coverage: ${COVERAGE_PCT}%${NC}"
    
    if (( $(echo "$COVERAGE_PCT >= 100" | bc -l) )); then
      COVERAGE_PASS=true
      check_result "Test coverage: 100%" 0
    else
      check_result "Test coverage below 100%" 1 "Coverage: ${COVERAGE_PCT}%"
    fi
  else
    check_result "Unable to parse coverage" 1 "Manual verification needed"
  fi
else
  check_result "Coverage report not found" 1 "Run unit tests with coverage"
fi

# 6. Integration Tests
echo ""
echo -e "${BLUE}6️⃣ Checking Integration Tests...${NC}"
if [ -f scripts/integration-tests.sh ]; then
  if bash scripts/integration-tests.sh > /dev/null 2>&1; then
    check_result "Integration tests passed" 0
  else
    check_result "Integration tests failed" 1 "Run: bash scripts/integration-tests.sh"
  fi
else
  check_result "Integration tests not found" 1 "Create integration tests"
fi

# 7. File Locations
echo ""
echo -e "${BLUE}7️⃣ Checking File Locations...${NC}"

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  check_result "Not in a git repository" 1 "Unable to validate file locations"
else
  # Get changed files
  invalid_files=$(git diff --name-only origin/main...HEAD 2>/dev/null | \
    grep -v '^\.claude/' | \
    grep -v '^bin/' | \
    grep -v '^lib/' | \
    grep -v '^test/' | \
    grep -v '^tests/' | \
    grep -v '^metadata.json$' | \
    grep -v '^cdk.json$' | \
    grep -v '^cdktf.json$' | \
    grep -v '^Pulumi.yaml$' | \
    grep -v '^package.json$' | \
    grep -v '^package-lock.json$' | \
    grep -v '^Pipfile$' | \
    grep -v '^Pipfile.lock$' | \
    grep -v '^tap.py$' | \
    grep -v '^tap.go$' | \
    grep -v '^main.py$' || true)

  if [ -n "$invalid_files" ]; then
    check_result "Files in wrong locations" 1
    echo -e "${RED}   Invalid files:${NC}"
    echo "$invalid_files" | while read -r file; do
      echo -e "${RED}     - $file${NC}"
    done
    echo -e "${YELLOW}   Move files to lib/ or remove them${NC}"
  else
    check_result "All files in correct locations" 0
  fi
fi

# 8. Required Documentation
echo ""
echo -e "${BLUE}8️⃣ Checking Documentation...${NC}"

required_docs=("lib/PROMPT.md" "lib/MODEL_RESPONSE.md" "lib/IDEAL_RESPONSE.md" "lib/MODEL_FAILURES.md")
missing_docs=()

for doc in "${required_docs[@]}"; do
  if [ ! -f "$doc" ]; then
    missing_docs+=("$doc")
  fi
done

if [ ${#missing_docs[@]} -eq 0 ]; then
  check_result "All required documentation present" 0
else
  check_result "Missing documentation files" 1
  for doc in "${missing_docs[@]}"; do
    echo -e "${RED}     - $doc${NC}"
  done
fi

# 9. Training Quality
echo ""
echo -e "${BLUE}9️⃣ Checking Training Quality...${NC}"

if [ -f metadata.json ]; then
  TRAINING_QUALITY=$(jq -r '.training_quality // 0' metadata.json)
  
  if [ "$TRAINING_QUALITY" -ge 8 ]; then
    check_result "Training quality: ${TRAINING_QUALITY}/10" 0 "Meets minimum threshold"
  else
    check_result "Training quality: ${TRAINING_QUALITY}/10" 1 "Below minimum threshold of 8"
  fi
else
  check_result "Training quality not set" 1 "iac-code-reviewer needs to set this"
fi

# Final Summary
echo ""
echo "================================================"

if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${GREEN}✅ All Pre-Submission Checks Passed!${NC}"
  echo "================================================"
  echo ""
  echo -e "${GREEN}Ready for PR creation ✅${NC}"
  exit 0
else
  echo -e "${RED}❌ ${FAILED_CHECKS} Check(s) Failed${NC}"
  echo "================================================"
  echo ""
  echo -e "${RED}Fix all issues before PR creation${NC}"
  echo ""
  echo "References:"
  echo "  - Pre-Submission Checklist: .claude/docs/references/pre-submission-checklist.md"
  echo "  - Validation Guide: .claude/docs/guides/validation_and_testing_guide.md"
  echo "  - Common Issues: .claude/lessons_learnt.md"
  exit 1
fi

