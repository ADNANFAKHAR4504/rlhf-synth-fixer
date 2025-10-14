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

  case "$LANGUAGE" in
    py|python|go|ts|typescript|java|csharp)
      if [ ! -d ".gen" ]; then
        echo "❌ No .gen directory found; generating..."
        npx --yes cdktf get
      fi
      if [ -d ".gen/aws" ] || [ -d ".gen/providers/aws" ]; then
        echo "✅ Found other language CDKTF generated provider directory in .gen"
      else
        echo "❌ No generated provider directory found after cdktf get."
        echo "Contents of project root:"; ls -la || true
        exit 1
      fi
      ;;
    *)
      echo "ℹ️ Skipping ensure_gen for LANGUAGE=$LANGUAGE"
      ;;
  esac
  # Go modules are prepared during build; avoid extra operations here

  npm run cdktf:synth

else
  echo "ℹ️ Not a CDK project, skipping CDK synth"
  mkdir -p cdk.out
  echo "# No CDK artifacts generated for non-CDK projects" > cdk.out/README.md
fi

echo "Synth completed successfully"
