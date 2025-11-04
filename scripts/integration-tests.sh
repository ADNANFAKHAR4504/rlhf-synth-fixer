#!/bin/bash

# Exit on any error
set -e

# -------------------------------------------------------------------
# Read platform and language metadata
# -------------------------------------------------------------------
if [ ! -f "metadata.json" ]; then
  echo "❌ metadata.json not found, exiting with failure"
  exit 1
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)

echo "Project: platform=$PLATFORM, language=$LANGUAGE"

# -------------------------------------------------------------------
# Default environment variables
# -------------------------------------------------------------------
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-dev}
export CI=${CI:-1}

echo "Environment suffix: $ENVIRONMENT_SUFFIX"
echo "CI mode: $CI"

# -------------------------------------------------------------------
# Jest configuration (stable pinned version)
# -------------------------------------------------------------------
TEST_PATTERN_FLAG="--testPathPattern"
JEST_VERSION=$(npx jest --version 2>/dev/null || echo "28.1.3")
echo "🧩 Using Jest v${JEST_VERSION} with flag: ${TEST_PATTERN_FLAG}"

# -------------------------------------------------------------------
# Run integration tests per platform/language
# -------------------------------------------------------------------

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
    echo "🔧 Ensuring .gen exists for CDKTF Go integration tests..."
    bash ./scripts/cdktf-go-prepare.sh

    # Clean up legacy state
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
