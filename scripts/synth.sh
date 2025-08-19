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
  npm run cdktf:synth
else
  echo "ℹ️ Not a CDK project, skipping CDK synth"
  echo "This is expected for non-CDK projects like CloudFormation templates"
  # Create empty cdk.out directory to satisfy artifact upload
  mkdir -p cdk.out
  echo "# No CDK artifacts generated for non-CDK projects" > cdk.out/README.md
fi

echo "Synth completed successfully"