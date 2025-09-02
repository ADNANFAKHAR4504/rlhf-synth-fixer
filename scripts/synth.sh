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
  # .gen should be restored via cache/artifacts; generate only if missing

  ensure_gen() {
    if [ ! -d ".gen" ]; then
      echo "❌ .gen not found; generating..."
      npx --yes cdktf get
    fi
    # --- FIX: Check for the new path OR the old path for backward compatibility ---
    if [ ! -d ".gen/aws" ] && [ ! -d ".gen/providers/aws" ]; then
      echo "❌ Neither .gen/aws nor .gen/providers/aws directory found after cdktf get."
      echo "Contents of .gen:"; ls -la .gen || true
      exit 1
    else
      echo "✅ Found generated provider directory."
    fi
    # --- END FIX ---
  }
  ensure_gen
  # Go modules are prepared during build; avoid extra operations here

  npm run cdktf:synth

else
  echo "ℹ️ Not a CDK project, skipping CDK synth"
  mkdir -p cdk.out
  echo "# No CDK artifacts generated for non-CDK projects" > cdk.out/README.md
fi

echo "Synth completed successfully"