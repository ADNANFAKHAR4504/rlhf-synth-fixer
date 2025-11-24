#!/bin/bash

echo "=== FINAL VALIDATION SUMMARY ==="
echo ""

# 1. Emoji Check
echo "1. Emoji Check:"
if LC_ALL=C grep -E '[🚀🎯📊✨💡🔥⚡️🌟💻🛠️⚠️✅❌🔴🟢🟡]|:[a-z_]+:' lib/IDEAL_RESPONSE.md 2>/dev/null; then
  echo "   ❌ FAILED - Emojis found"
  EMOJI_STATUS="FAILED"
else
  echo "   ✅ PASSED - No emojis found"
  EMOJI_STATUS="PASSED"
fi
echo ""

# 2. Test Coverage
echo "2. Unit Test Coverage:"
COVERAGE_OUTPUT=$(python -m pytest test/lambda_functions/ --cov=lib/lambda --cov-report=term 2>&1 | grep "TOTAL")
echo "   $COVERAGE_OUTPUT"
if echo "$COVERAGE_OUTPUT" | grep -q "100%"; then
  echo "   ✅ PASSED - 100% coverage"
  COVERAGE_STATUS="PASSED"
else
  echo "   ❌ FAILED - Coverage below 100%"
  COVERAGE_STATUS="FAILED"
fi
echo ""

# 3. Training Quality
echo "3. Training Quality Score:"
SCORE=$(jq -r '.training_quality' metadata.json)
echo "   Score: ${SCORE}/10"
if [ "$SCORE" -ge 8 ]; then
  echo "   ✅ PASSED - Meets threshold (≥8)"
  SCORE_STATUS="PASSED"
else
  echo "   ❌ FAILED - Below threshold"
  SCORE_STATUS="FAILED"
fi
echo ""

# 4. Required Files
echo "4. Required Documentation Files:"
for file in lib/PROMPT.md lib/IDEAL_RESPONSE.md lib/MODEL_FAILURES.md metadata.json; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file MISSING"
  fi
done
echo ""

# 5. Test Files
echo "5. Test Files:"
UNIT_TEST_COUNT=$(ls -1 test/lambda_functions/*.py 2>/dev/null | wc -l)
echo "   Unit tests: $UNIT_TEST_COUNT files"
if [ -f "test/tapstack_integration_test.py" ]; then
  echo "   ✅ Integration tests: tapstack_integration_test.py"
else
  echo "   ❌ Integration tests: MISSING"
fi
echo ""

# 6. Deployment Status
echo "6. Deployment Status:"
if [ -f "lib/terraform.tfstate" ]; then
  RESOURCE_COUNT=$(jq '.resources | length' lib/terraform.tfstate 2>/dev/null)
  echo "   ✅ terraform.tfstate exists"
  echo "   Resources deployed: $RESOURCE_COUNT"
  DEPLOY_STATUS="PASSED"
else
  echo "   ❌ terraform.tfstate missing"
  DEPLOY_STATUS="FAILED"
fi
echo ""

# 7. Integration Test Results
echo "7. Integration Test Results:"
INT_TEST_OUTPUT=$(python -m pytest test/tapstack_integration_test.py -v 2>&1 | tail -1)
echo "   $INT_TEST_OUTPUT"
if echo "$INT_TEST_OUTPUT" | grep -q "passed"; then
  echo "   ✅ PASSED"
  INT_STATUS="PASSED"
else
  echo "   ❌ FAILED"
  INT_STATUS="FAILED"
fi
echo ""

# 8. File Location Compliance
echo "8. File Location Compliance:"
# Check if all files are in lib/ or test/
VIOLATIONS=""
if [ -f "PROMPT.md" ] || [ -f "README.md" ] || [ -f "IDEAL_RESPONSE.md" ]; then
  VIOLATIONS="Files in root directory"
fi

if [ -z "$VIOLATIONS" ]; then
  echo "   ✅ PASSED - All files in correct locations"
  LOCATION_STATUS="PASSED"
else
  echo "   ❌ FAILED - $VIOLATIONS"
  LOCATION_STATUS="FAILED"
fi
echo ""

# Final Summary
echo "=== FINAL DECISION ==="
echo ""
if [ "$EMOJI_STATUS" = "PASSED" ] && \
   [ "$COVERAGE_STATUS" = "PASSED" ] && \
   [ "$SCORE_STATUS" = "PASSED" ] && \
   [ "$DEPLOY_STATUS" = "PASSED" ] && \
   [ "$INT_STATUS" = "PASSED" ] && \
   [ "$LOCATION_STATUS" = "PASSED" ]; then
  echo "✅ ALL VALIDATIONS PASSED"
  echo ""
  echo "Status: READY FOR PR CREATION"
  exit 0
else
  echo "❌ SOME VALIDATIONS FAILED"
  echo ""
  echo "Status: NOT READY"
  exit 1
fi
