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
elif [ "$LANGUAGE" = "go" ]; then
  echo "✅ Go project detected, running go unit tests..."
  # For CDKTF Go projects, generate local provider bindings if missing
  if [ "$PLATFORM" = "cdktf" ]; then
    echo "🔧 Ensuring .gen exists for CDKTF Go tests"
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
    # Ensure Go sees tests even if they live under root tests/
    if [ -d "tests/unit" ]; then
      echo "📦 Copying unit test files into lib/ so they share the same package"
      # Copy only *_test.go files into lib root so they can access package main symbols
      cp tests/unit/*_test.go lib/ || true
    fi
    cd lib
    go test ./... -v -coverprofile=../coverage.out
    cd ..
  else
    echo "ℹ️ lib directory not found, skipping Go unit tests"
  fi
elif [ "$LANGUAGE" = "js" ]; then
  echo "✅ JavaScript project detected, running unit tests..."
  npm run test:unit-js
elif [ "$LANGUAGE" = "py" ]; then
  echo "✅ Python project detected, running pytest unit tests..."
  pipenv run test-py-unit
else
  echo "✅ Running default unit tests..."
  npm run test:unit
fi

echo "Unit tests completed successfully"