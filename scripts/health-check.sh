#!/bin/bash
set -e

echo "🏥 Running health checks for ${ENVIRONMENT} environment..."

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

echo "Checking endpoint: ${ENDPOINT}/health"

# Retry logic for health check
MAX_RETRIES=10
RETRY_DELAY=5
attempt=1

while [ $attempt -le $MAX_RETRIES ]; do
  echo "Health check attempt ${attempt}/${MAX_RETRIES}..."

  if curl -f -s -o /dev/null -w "%{http_code}" "${ENDPOINT}/health" | grep -q "200"; then
    echo "✅ Health check passed!"
    exit 0
  fi

  echo "Health check failed, retrying in ${RETRY_DELAY} seconds..."
  sleep $RETRY_DELAY
  attempt=$((attempt + 1))
done

echo "❌ Health check failed after ${MAX_RETRIES} attempts"
exit 1
