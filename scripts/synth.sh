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
  # Preflight: verify local provider bindings exist under .gen
  ensure_gen() {
    if [ ! -d ".gen" ]; then
      echo "❌ .gen not found; generating..."
      npx --yes cdktf get
    fi
    if [ ! -d ".gen/providers/aws" ]; then
      echo "❌ .gen/providers/aws missing after cdktf get"
      echo "Contents of .gen:"; ls -la .gen || true
      exit 1
    fi
  }
  # Optional: assert specific subpackages exist (edit list to match imports/replace)
  assert_gen_subdirs() {
    missing=0
    for d in \
      cloudwatchloggroup \
      iampolicy \
      iamrole \
      iamrolepolicyattachment \
      lambdafunction \
      lambdapermission \
      provider \
      s3bucket \
      s3bucketnotification \
      s3bucketpublicaccessblock \
      s3bucketserversideencryptionconfiguration \
      s3bucketversioning; do
      if [ ! -d ".gen/providers/aws/$d" ]; then
        echo "❌ Missing: .gen/providers/aws/$d"
        echo "  Candidates:"
        find .gen/providers/aws -maxdepth 1 -type d -iname "*$d*" -print || true
        missing=1
      fi
    done
    if [ "$missing" -ne 0 ]; then
      echo "❌ One or more expected provider subdirs are missing. Adjust imports or go.mod replace to match actual .gen names."
      exit 1
    fi
  }
  ensure_gen
  assert_gen_subdirs
  # Ensure Go module dependencies (e.g., cdktf core) are downloaded before synth
  echo "Ensuring Go module deps are available (go mod tidy)"
  export GOPROXY=${GOPROXY:-direct}
  export GONOSUMDB=${GONOSUMDB:-github.com/cdktf/*}
  export GOPRIVATE=${GOPRIVATE:-github.com/cdktf/*}
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