#!/bin/bash
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
  
  # --- FIX: remove legacy terraform.tfstate for clean runs ---
  if [ -f "terraform.tfstate" ]; then
    echo "⚠️ Found legacy terraform.tfstate. Removing for clean CI run..."
    rm -f terraform.tfstate
  fi

  echo "Pre-fetching Go modules (go mod download)"
  export GOPROXY=${GOPROXY:-direct}
  export GONOSUMDB=${GONOSUMDB:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
  export GONOPROXY=${GONOPROXY:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
  export GOPRIVATE=${GOPRIVATE:-github.com/cdktf/*,github.com/hashicorp/terraform-cdk-go/*}
  
  if [ -f "go.mod" ]; then
    go mod download || true
    go mod download github.com/hashicorp/terraform-cdk-go/cdktf@v0.21.0 || true
  fi

  npm run cdktf:get

  ensure_gen() {
    if [ ! -d ".gen" ]; then
      echo "❌ .gen not found; generating..."
      npx --yes cdktf get
    fi
    
    # Check for AWS provider and create symlink if needed
    if [ ! -d ".gen/aws" ]; then
      if [ -d ".gen/providers" ]; then
        # Find the actual AWS provider directory
        AWS_DIR=$(find .gen/providers -name "*aws*" -type d | head -1)
        if [ -n "$AWS_DIR" ]; then
          # Create relative symlink (remove .gen/ prefix)
          REL_PATH=$(echo "$AWS_DIR" | sed 's|^\.gen/||')
          ln -sf "$REL_PATH" .gen/aws
          echo "✅ Created symlink .gen/aws -> $REL_PATH"
        fi
      fi
    fi
    
    # Final check
    if [ ! -d ".gen/aws" ]; then
      echo "❌ .gen/aws missing after cdktf get"
      echo "Contents of .gen:"; ls -la .gen || true
      echo "Contents of .gen/providers:"; ls -la .gen/providers 2>/dev/null || echo "No providers directory"
      exit 1
    fi
  }
  ensure_gen

  echo "Ensuring Go module deps are available (go mod tidy)"
  go clean -modcache || true
  go get github.com/hashicorp/terraform-cdk-go/cdktf@v0.21.0
  go mod download github.com/hashicorp/terraform-cdk-go/cdktf@v0.21.0 || true
  go mod tidy

  npm run cdktf:synth

else
  echo "ℹ️ Not a CDK project, skipping CDK synth"
  mkdir -p cdk.out
  echo "# No CDK artifacts generated for non-CDK projects" > cdk.out/README.md
fi

echo "Synth completed successfully"
