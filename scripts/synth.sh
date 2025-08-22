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

if [ "$PLATFORM" = "cdk" ]; then
  echo "✅ CDK project detected, running CDK synth..."
  npm run cdk:synth
elif [ "$PLATFORM" = "cdktf" ]; then
  echo "✅ CDKTF project detected, running CDKTF get and synth..."
    # Handle CDKTF multi-stack state naming
  if [ -f "terraform.tfstate" ]; then
    echo "⚠️ Found legacy terraform.tfstate. Renaming to TapStack.tfstate..."
    mv terraform.tfstate TapStack.tfstate
  fi
  # Pre-fetch Go modules to ensure go.sum is populated before any go run steps
  echo "Pre-fetching Go modules (go mod download)"
  export GOPROXY=${GOPROXY:-direct}
  export GONOSUMDB=${GONOSUMDB:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
  export GONOPROXY=${GONOPROXY:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
  export GOPRIVATE=${GOPRIVATE:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
  if [ -f "go.mod" ]; then
    # Fetch core CDKTF modules proactively to satisfy .gen imports
    go mod download || true
    go mod download github.com/hashicorp/terraform-cdk-go/cdktf@v0.21.0 || true
  fi
  npm run cdktf:get
  # Preflight: verify local provider bindings exist under .gen
  ensure_gen() {
    if [ ! -d ".gen" ]; then
      echo "❌ .gen not found; generating..."
      npx --yes cdktf get
    fi
    # Some CDKTF versions generate providers under .gen/aws (without providers/ prefix)
    if [ ! -d ".gen/aws" ]; then
      echo "❌ .gen/aws missing after cdktf get"
      echo "Contents of .gen:"; ls -la .gen || true
      exit 1
    fi
  }
  ensure_gen
  # Ensure Go module dependencies (e.g., cdktf core) are downloaded before synth
  echo "Ensuring Go module deps are available (go mod tidy)"
  export GOPROXY=${GOPROXY:-direct}
  # Bypass checksum DB and proxy for provider and CDKTF core modules
  export GONOSUMDB=${GONOSUMDB:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
  export GONOPROXY=${GONOPROXY:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
  export GOPRIVATE=${GOPRIVATE:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
  # Pre-fetch CDKTF core used by .gen code (jsii is a subpackage of the same module)
  go clean -modcache || true
  go get github.com/hashicorp/terraform-cdk-go/cdktf@v0.21.0
  go mod download github.com/hashicorp/terraform-cdk-go/cdktf@v0.21.0 || true
  go mod tidy
  npm run cdktf:synth
else
  echo "ℹ️ Not a CDK project, skipping CDK synth"
  echo "This is expected for non-CDK projects like CloudFormation templates"
  # Create empty cdk.out directory to satisfy artifact upload
  mkdir -p cdk.out
  echo "# No CDK artifacts generated for non-CDK projects" > cdk.out/README.md
fi

echo "Synth completed successfully"