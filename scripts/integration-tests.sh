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

# Detect Jest version for CLI compatibility
JEST_VERSION=$(npx jest --version 2>/dev/null || echo "0")
if [[ "$JEST_VERSION" =~ ^[0-9]+ && "$JEST_VERSION" -ge 29 ]]; then
  TEST_PATTERN_FLAG="--testPathPatterns"
else
  TEST_PATTERN_FLAG="--testPathPattern"
fi
echo "🧩 Using Jest flag: $TEST_PATTERN_FLAG (version $JEST_VERSION)"

# -------------------------------
# Run integration tests by type
# -------------------------------

if [ "$LANGUAGE" = "java" ]; then
  echo "✅ Java project detected, running integration tests..."
  chmod +x ./gradlew
  ./gradlew integrationTest jacocoIntegrationTestReport --build-cache --no-daemon

elif [ "$LANGUAGE" = "py" ] || [ "$LANGUAGE" = "python" ]; then
  echo "✅ Python project detected, running integration tests..."
  pipenv run test-py-integration || npx jest --coverage $TEST_PATTERN_FLAG ".*integration\\.test\\.ts$" --runInBand --ci --passWithNoTests

elif [ "$LANGUAGE" = "go" ]; then
  echo "✅ Go project detected, running integration tests..."
  if [ "$PLATFORM" = "cdktf" ]; then
    echo "🔧 Ensuring .gen exists for CDKTF Go integration tests"
    bash ./scripts/cdktf-go-prepare.sh

    # Clean up old state if present
    [ -f "terraform.tfstate" ] && rm -f terraform.tfstate

    if [ ! -d ".gen" ] || [ ! -d ".gen/aws" ]; then
      echo "Running cdktf get to generate .gen..."
      npm run cdktf:get || npx --yes cdktf get
    fi
    [ ! -d ".gen/aws" ] && { echo "❌ .gen/aws missing after cdktf get; aborting"; exit 1; }
  fi

  if [ -d "lib" ]; then
    if [ -d "tests/integration" ]; then
      echo "📦 Copying integration *_test.go files into lib/ for package alignment"
      cp tests/integration/*_test.go lib/ || true
    fi
    cd lib
    echo "🔧 Updating go.sum for integration test dependencies..."
    go mod tidy
    go test ./... -v -tags "integration"
    cd ..
  else
    echo "ℹ️ lib directory not found, skipping Go integration tests"
  fi

elif [ "$LANGUAGE" = "js" ]; then
  echo "✅ JavaScript project detected, running integration tests..."
  npm run test:integration-js || npx jest --coverage $TEST_PATTERN_FLAG ".*integration\\.test\\.js$" --runInBand --ci --passWithNoTests

elif [ "$LANGUAGE" = "ts" ]; then
  echo "✅ TypeScript project detected, running integration tests..."
  npm run test:integration || npx jest --coverage $TEST_PATTERN_FLAG ".*integration\\.test\\.ts$" --runInBand --ci --passWithNoTests

elif [ "$PLATFORM" = "tf" ] || [ "$PLATFORM" = "cfn" ]; then
  echo "✅ $PLATFORM IaC project detected, running Jest-based integration validation..."
  npx jest --coverage $TEST_PATTERN_FLAG ".*integration\\.test\\.ts$" --runInBand --ci --passWithNoTests

else
  echo "✅ Running default Jest-based integration tests..."
  npx jest --coverage $TEST_PATTERN_FLAG ".*integration\\.test\\.ts$" --runInBand --ci --passWithNoTests
fi

echo "✅ Integration tests completed successfully"
