#!/bin/bash
set -e

echo "🔨 Running Build..."

if [ -f "metadata.json" ]; then
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
else
  echo "⚠️ metadata.json missing; skipping build."
  exit 0
fi

echo "Project: platform=$PLATFORM, language=$LANGUAGE"

case "$PLATFORM-$LANGUAGE" in
  cdk-ts|cdktf-ts|pulumi-ts)
    echo "📦 Building TypeScript-based project..."
    npm ci
    npm run build
    ;;
  pulumi-py|cdk-py)
    echo "🐍 Python project — skipping TS build."
    ;;
  pulumi-go|cdktf-go)
    echo "🐹 Go project — skipping TS build."
    ;;
  tf-hcl|cfn-yaml|cfn-json)
    echo "🪶 Terraform/CloudFormation — no build required."
    ;;
  pulumi-java|cdk-java)
    echo "☕ Building Java project with Gradle..."
    chmod +x ./gradlew
    ./gradlew assemble --no-daemon
    ;;
  *)
    echo "ℹ️ Unknown combination ($PLATFORM-$LANGUAGE) — skipping build."
    ;;
esac

# -------------------------------------------------------------------
# Configure AWS if credentials are available
# -------------------------------------------------------------------
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "🔧 Configuring AWS credentials..."
  ./scripts/configure-aws.sh
else
  echo "ℹ️ AWS credentials not set — skipping AWS config."
fi

# -------------------------------------------------------------------
# PATH setup
# -------------------------------------------------------------------
if [ -d "node_modules/.bin" ]; then
  echo "$(pwd)/node_modules/.bin" >> "$GITHUB_PATH"
fi
if [ -d ".venv/bin" ]; then
  echo "$(pwd)/.venv/bin" >> "$GITHUB_PATH"
fi

echo "✅ Environment setup completed successfully"
