#!/bin/bash
set -e

echo "🔥 Running smoke tests for ${ENVIRONMENT} environment..."

# Validate required environment variables
if [ -z "$ENVIRONMENT" ]; then
  echo "Error: ENVIRONMENT environment variable is not set"
  exit 1
fi

# Get the application endpoint based on environment
case "$ENVIRONMENT" in
  dev)
    ENDPOINT="${DEV_ENDPOINT:-http://localhost:3000}"
    ;;
  staging)
    ENDPOINT="${STAGING_ENDPOINT:-http://staging.example.com}"
    ;;
  production)
    ENDPOINT="${PROD_ENDPOINT:-http://production.example.com}"
    ;;
  *)
    echo "Error: Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

echo "Testing endpoint: ${ENDPOINT}"

# Test 1: Health check endpoint
echo "Test 1: Health check endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${ENDPOINT}/health")
if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Health check passed (HTTP ${HTTP_CODE})"
else
  echo "❌ Health check failed (HTTP ${HTTP_CODE})"
  exit 1
fi

# Test 2: API availability
echo "Test 2: API availability..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${ENDPOINT}/api")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 404 ]; then
  echo "✅ API endpoint accessible (HTTP ${HTTP_CODE})"
else
  echo "❌ API endpoint not accessible (HTTP ${HTTP_CODE})"
  exit 1
fi

# Test 3: Response time check
echo "Test 3: Response time check..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "${ENDPOINT}/health")
THRESHOLD=2
if (( $(echo "$RESPONSE_TIME < $THRESHOLD" | bc -l) )); then
  echo "✅ Response time acceptable: ${RESPONSE_TIME}s (threshold: ${THRESHOLD}s)"
else
  echo "⚠️ Response time slow: ${RESPONSE_TIME}s (threshold: ${THRESHOLD}s)"
fi

echo "✅ All smoke tests passed!"
