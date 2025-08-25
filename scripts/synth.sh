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
  npm run cdktf:get

  # Verify .gen/aws exists (AWS provider bindings)
  if [ ! -d ".gen/aws" ]; then
    echo "❌ .gen/aws missing after cdktf get"

    # Try adding AWS provider automatically if not present
    if ! grep -q '"hashicorp/aws' cdktf.json 2>/dev/null; then
      echo "ℹ️ Adding AWS provider to cdktf.json..."
      npx cdktf provider add "hashicorp/aws@~> 5.0"
      npm run cdktf:get
    fi

    # If still missing, fail fast
    if [ ! -d ".gen/aws" ]; then
      echo "❌ Failed to generate AWS provider bindings. Please check cdktf.json."
      exit 1
    fi
  fi

  npm run cdktf:synth

else
  echo "ℹ️ Not a CDK project, skipping CDK synth"
  echo "This is expected for non-CDK projects like CloudFormation templates"
  # Create empty cdk.out directory to satisfy artifact upload
  mkdir -p cdk.out
  echo "# No CDK artifacts generated for non-CDK projects" > cdk.out/README.md
fi

echo "✅ Synth completed successfully"
