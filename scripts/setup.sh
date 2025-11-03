#!/bin/bash
set -e

echo "🔧 Starting optimized environment setup..."

NODE_VERSION=${NODE_VERSION:-22.17.0}
TERRAFORM_VERSION=${TERRAFORM_VERSION:-1.12.2}
PULUMI_VERSION=${PULUMI_VERSION:-3.109.0}
PLATFORM=${PLATFORM:-""}
LANGUAGE=${LANGUAGE:-""}

echo "Platform: $PLATFORM"
echo "Language: $LANGUAGE"
echo "Node: $NODE_VERSION | Terraform: $TERRAFORM_VERSION | Pulumi: $PULUMI_VERSION"

# -------------------------------------------------------------------
# Common sanity checks (without version matching or redundant installs)
# -------------------------------------------------------------------
echo "🔹 Checking available tools..."
node --version 2>/dev/null || echo "Node not found"
python --version 2>/dev/null || echo "Python not found"
terraform --version 2>/dev/null || true
pulumi version 2>/dev/null || true
go version 2>/dev/null || true
java -version 2>&1 | head -n 1 || true

# -------------------------------------------------------------------
# Conditional environment setup per platform/language
# -------------------------------------------------------------------
case "$PLATFORM" in
  cdk)
    echo "🪄 CDK project detected."
    if [[ "$LANGUAGE" =~ ^(ts|js)$ ]]; then
      echo "📦 Installing Node.js dependencies..."
      [ -d "node_modules" ] && echo "node_modules exists — skipping npm ci" || npm ci
    elif [ "$LANGUAGE" = "java" ]; then
      echo "📦 Java CDK project — verifying Gradle..."
      gradle --version || echo "Gradle wrapper will be used."
    elif [ "$LANGUAGE" = "py" ]; then
      echo "📦 Python CDK project — installing pipenv deps..."
      pip install pipenv
      pipenv install --dev
    fi
    ;;
  cdktf)
    echo "🪄 CDKTF project detected."
    if [ "$LANGUAGE" = "go" ]; then
      echo "📦 Go CDKTF project — skipping npm install."
    elif [[ "$LANGUAGE" =~ ^(ts|js)$ ]]; then
      echo "📦 Installing npm dependencies for CDKTF..."
      [ -d "node_modules" ] && echo "node_modules exists — skipping npm ci" || npm ci
    fi
    ;;
  tf)
    echo "🪄 Terraform project — no language runtime setup required."
    ;;
  pulumi)
    echo "🪄 Pulumi project detected."
    if [ "$LANGUAGE" = "py" ]; then
      echo "📦 Installing Python deps for Pulumi..."
      pip install pipenv
      [ -d ".venv" ] && echo "venv exists — skipping install" || pipenv install --dev
    elif [[ "$LANGUAGE" =~ ^(ts|js)$ ]]; then
      echo "📦 Installing Node deps for Pulumi..."
      [ -d "node_modules" ] && echo "node_modules exists — skipping npm ci" || npm ci
    elif [ "$LANGUAGE" = "java" ]; then
      echo "📦 Java Pulumi project — Gradle build expected."
      gradle --version || echo "Gradle wrapper will handle it."
    fi
    ;;
  *)
    echo "⚠️ Unknown or empty platform — skipping tool-specific setup."
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

# -------------------------------------------------------------------
# Summary
# -------------------------------------------------------------------
echo "✅ Environment setup complete."
echo "Summary:"
echo "- Node: $(node --version 2>/dev/null || echo 'N/A')"
echo "- Python: $(python --version 2>/dev/null || echo 'N/A')"
echo "- Terraform: $(terraform version -json 2>/dev/null | jq -r '.terraform_version' || echo 'N/A')"
echo "- Pulumi: $(pulumi version 2>/dev/null || echo 'N/A')"
echo "- Go: $(go version 2>/dev/null || echo 'N/A')"
echo "- Java: $(java -version 2>&1 | head -n 1 || echo 'N/A')"
