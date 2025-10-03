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
if [ "$LANGUAGE" = "java" ]; then
  echo "✅ Java project detected, running integration tests..."
  chmod +x ./gradlew
  ./gradlew integrationTest jacocoIntegrationTestReport --build-cache --no-daemon

elif [ "$LANGUAGE" = "py" ]; then
  echo "✅ Python project detected, running integration tests..."
  pipenv run test-py-integration

elif [ "$LANGUAGE" = "go" ]; then
  echo "✅ Go project detected, running integration tests..."
  if [ "$PLATFORM" = "cdktf" ]; then
    echo "🔧 Ensuring .gen exists for CDKTF Go integration tests"
    # Ensure CDKTF Go deps and .gen are prepared (idempotent, uses cache)
    bash ./scripts/cdktf-go-prepare.sh

    # --- FIX: remove legacy terraform.tfstate for clean CI runs ---
    if [ -f "terraform.tfstate" ]; then
      echo "⚠️ Found legacy terraform.tfstate. Removing for clean CI run..."
      rm -f terraform.tfstate
    fi

    if [ ! -d ".gen" ] || [ ! -d ".gen/aws" ]; then
      echo "Running cdktf get to generate .gen..."
      npm run cdktf:get || npx --yes cdktf get
    fi
    if [ ! -d ".gen/aws" ]; then
      echo "❌ .gen/aws missing after cdktf get; aborting"
      exit 1
    fi

  fi

  if [ -d "lib" ]; then
    if [ -d "tests/integration" ]; then
      echo "📦 Copying integration *_test.go files into lib/ for package alignment"
      cp tests/integration/*_test.go lib/ || true
    fi
    cd lib
    go test ./... -v -tags "integration"
    cd ..
  else
    echo "ℹ️ lib directory not found, skipping Go integration tests"
  fi

elif [ "$LANGUAGE" = "js" ]; then
  echo "✅ JavaScript project detected, running integration tests..."
  npm run test:integration-js

else
  echo "✅ Running default integration tests..."
  
  # For CDK TypeScript projects, ensure we have current deployment outputs
  if [ "$PLATFORM" = "cdk" ] && [ "$LANGUAGE" = "ts" ]; then
    echo "📊 Generating current deployment outputs for integration tests..."
    
    # First try to get outputs using CDK
    if npx cdk deploy --all --require-approval never --context environmentSuffix=${ENVIRONMENT_SUFFIX} --outputs-file cdk-outputs.json --no-rollback; then
      echo "✅ CDK outputs file generated successfully"
    else
      echo "⚠️ CDK deploy failed, trying to get existing outputs..."
      # Fallback to get-outputs script
      ./scripts/get-outputs.sh || echo "⚠️ Could not retrieve outputs, proceeding with existing files"
    fi
  fi
  
  npm run test:integration
fi

echo "Integration tests completed successfully"
