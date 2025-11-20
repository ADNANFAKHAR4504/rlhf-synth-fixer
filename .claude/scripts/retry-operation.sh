#!/bin/bash
# Retries an operation with exponential backoff
# Usage: retry-operation.sh <operation> <max_retries> <initial_delay>
# Note: Operation should be a function name or command that can be evaluated

set -euo pipefail

OPERATION="$1"
MAX_RETRIES="${2:-3}"
INITIAL_DELAY="${3:-5}"

RETRY_DELAY=$INITIAL_DELAY
LAST_EXIT_CODE=1

for attempt in $(seq 1 $MAX_RETRIES); do
  echo "🔄 Attempt $attempt/$MAX_RETRIES: $OPERATION"
  
  # Evaluate the operation (could be a function or command)
  if eval "$OPERATION" 2>&1; then
    LAST_EXIT_CODE=0
    echo "✅ Operation succeeded on attempt $attempt"
    exit 0
  else
    LAST_EXIT_CODE=$?
    
    if [ $attempt -lt $MAX_RETRIES ]; then
      echo "⚠️ Attempt $attempt failed (exit code: $LAST_EXIT_CODE), waiting ${RETRY_DELAY}s before retry..."
      sleep $RETRY_DELAY
      RETRY_DELAY=$((RETRY_DELAY * 2))  # Exponential backoff
    else
      echo "❌ All $MAX_RETRIES attempts failed"
    fi
  fi
done

echo "❌ Operation failed after $MAX_RETRIES attempts (last exit code: $LAST_EXIT_CODE)"
exit $LAST_EXIT_CODE

