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
  ./gradlew integrationTest --build-cache --no-daemon
elif [ "$LANGUAGE" = "py" ]; then
  echo "✅ Python project detected, running integration tests..."
  pipenv run test-py-integration
elif [ "$LANGUAGE" = "go" ]; then
  echo "✅ Go project detected, running integration tests..."
  # For CDKTF Go projects, generate local provider bindings if missing
  if [ "$PLATFORM" = "cdktf" ]; then
    echo "🔧 Ensuring .gen exists for CDKTF Go integration tests"
    if [ ! -d ".gen" ] || [ ! -d ".gen/aws" ]; then
      echo "Running cdktf get to generate .gen..."
      npm run cdktf:get || npx --yes cdktf get
    fi
    if [ ! -d ".gen/aws" ]; then
      echo "❌ .gen/aws missing after cdktf get; aborting"
      exit 1
    fi
    # Ensure CDKTF core deps are present to satisfy .gen imports
    export GOPROXY=${GOPROXY:-direct}
    export GONOSUMDB=${GONOSUMDB:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
    export GONOPROXY=${GONOPROXY:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
    export GOPRIVATE=${GOPRIVATE:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
    go clean -modcache || true
    go get github.com/hashicorp/terraform-cdk-go/cdktf@v0.21.0
    go mod tidy
  fi
  if [ -d "lib" ]; then
    # Ensure tests compile in same package as stack code
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
  npm run test:integration
fi

echo "Integration tests completed successfully"