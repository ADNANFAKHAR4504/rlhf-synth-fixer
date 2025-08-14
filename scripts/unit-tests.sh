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

# Convert YAML to JSON for CloudFormation projects
if [ "$PLATFORM" = "cfn" ] && [ "$LANGUAGE" = "yaml" ]; then
  echo "✅ CloudFormation YAML project detected, converting YAML to JSON for unit tests..."
  pipenv run cfn-flip-to-json > lib/TapStack.json
fi

# Run unit tests based on platform and language
if [ "$LANGUAGE" = "ts" ] && [ "$PLATFORM" = "cdktf" ]; then
  echo "✅ Terraform TypeScript project detected, running unit tests..."
  npm run test:unit-cdktf
elif [ "$LANGUAGE" = "ts" ]; then
  echo "✅ TypeScript project detected, running unit tests..."
  npm run test:unit
elif [ "$LANGUAGE" = "py" ]; then
  echo "✅ Python project detected, running pytest unit tests..."
  pipenv run test-py-unit
else
  echo "✅ Running default unit tests..."
  npm run test:unit
fi

echo "Unit tests completed successfully"