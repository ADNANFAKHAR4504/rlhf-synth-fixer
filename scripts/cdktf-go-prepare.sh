#!/bin/bash

# Exit on any error
set -e

# Ensure metadata exists
if [ ! -f "metadata.json" ]; then
  echo "❌ metadata.json not found, exiting with failure"
  exit 1
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)

if [ "$PLATFORM" != "cdktf" ] || [ "$LANGUAGE" != "go" ]; then
  echo "ℹ️ Not a CDKTF Go project (platform=$PLATFORM, language=$LANGUAGE). Nothing to prepare."
  exit 0
fi

echo "🔧 Preparing CDKTF Go environment"

# Remove legacy local state that interferes with CI idempotency
if [ -f "terraform.tfstate" ]; then
  echo "⚠️ Found legacy terraform.tfstate. Removing for clean CI run..."
  rm -f terraform.tfstate
fi

# Ensure .gen exists (avoid reruns if cached or restored from artifacts)
if [ ! -d ".gen" ] || [ ! -d ".gen/aws" ]; then
  echo ".gen/aws missing; generating providers with cdktf get..."
  npm run cdktf:get || npx --yes cdktf get
fi
if [ ! -d ".gen/aws" ]; then
  echo "❌ .gen/aws still missing after cdktf get; aborting"
  exit 1
fi

echo "Ensuring Go module dependencies are available"
export GOPROXY=${GOPROXY:-direct}
export GONOSUMDB=${GONOSUMDB:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
export GONOPROXY=${GONOPROXY:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
export GOPRIVATE=${GOPRIVATE:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}

# Download and tidy modules once in build; do not clear caches
if [ -f "go.mod" ]; then
  go mod download || true
  # Ensure CDKTF and AWS SDK v2 deps required by tests are present
  go get github.com/hashicorp/terraform-cdk-go/cdktf@v0.21.0
  go get \
    github.com/aws/aws-sdk-go-v2/config \
    github.com/aws/aws-sdk-go-v2/service/s3 \
    github.com/aws/aws-sdk-go-v2/service/lambda \
    github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs
  go mod tidy
fi

echo "✅ CDKTF Go preparation complete"
