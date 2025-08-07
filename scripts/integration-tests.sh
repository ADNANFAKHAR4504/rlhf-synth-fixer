#!/bin/bash

# Exit on any error
set -e

# Read platform and language from metadata.json
if [ ! -f "metadata.json" ]; then
  echo "❌ metadata.json not found, exiting with failure"
  exit 1
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)

echo "Project: platform=$PLATFORM, language=$LANGUAGE"

# Set default environment variables if not provided
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-dev}
export CI=${CI:-1}

echo "Environment suffix: $ENVIRONMENT_SUFFIX"
echo "CI mode: $CI"

# Run integration tests based on language
if [ "$LANGUAGE" = "py" ]; then
  echo "✅ Python project detected, running integration tests..."
  pipenv run test-py-integration
else
  echo "✅ Running default integration tests..."
  npm run test:integration
fi

echo "Integration tests completed successfully"