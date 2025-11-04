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
# Pre-check for required system utilities
# -------------------------------------------------------------------
if ! command -v jq &>/dev/null; then
  echo "📦 Installing jq (required for metadata parsing)..."
  sudo apt-get update -y && sudo apt-get install -y jq
fi

# Fix npm global path to avoid permission issues in CI runners
export NPM_CONFIG_PREFIX="$HOME/.npm-global"
export PATH="$PATH:$HOME/.npm-global/bin"

# -------------------------------------------------------------------
# Common sanity checks (without version matching or redundant installs)
# -------------------------------------------------------------------
echo "🔹 Checking available tools..."
node --version 2>/dev/null || echo "⚠️ Node not found"
python --version 2>/dev/null || echo "⚠️ Python not found"
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
      if [ -d "node_modules" ]; then
        echo "node_modules exists — skipping npm ci"
      elif [ -f "package-lock.json" ]; then
        npm ci
      else
        echo "⚠️ No package-lock.json found — running npm install instead."
        npm install
      fi
    elif [ "$LANGUAGE" = "java" ]; then
      echo "📦 Java CDK project — verifying Gradle..."
      gradle --version || echo "Gradle wrapper will be used."
    elif [ "$LANGUAGE" = "py" ]; then
      echo "📦 Python CDK project — installing pipenv deps..."
      if ! command -v pipenv &>/dev/null; then
        pip install pipenv
      fi
      pipenv install --dev
    fi
    ;;

  cdktf)
    echo "🪄 CDKTF project detected."
    if [ "$LANGUAGE" = "go" ]; then
      echo "📦 Go CDKTF project — skipping npm install."
    elif [[ "$LANGUAGE" =~ ^(ts|js)$ ]]; then
      echo "📦 Installing npm dependencies for CDKTF..."
      if [ -d "node_modules" ]; then
        echo "node_modules exists — skipping npm ci"
      elif [ -f "package-lock.json" ]; then
        npm ci
      else
        npm install
      fi
    elif [ "$LANGUAGE" = "java" ]; then
      gradle --version || echo "Gradle wrapper will handle it."
    fi
    ;;

  tf)
    echo "🪄 Terraform project — minimal setup required."
    # Ensure Jest available for static IaC validation
    if ! command -v jest &>/dev/null; then
      echo "📦 Installing Jest v28.1.3 + TypeScript for Terraform validation..."
      npm install -g jest@28.1.3 ts-node typescript@5.4.5 @types/jest
    else
      echo "✅ Jest already available — skipping install."
    fi
    # Optional: verify Terraform version (non-breaking)
    if command -v terraform &>/dev/null; then
      TF_VERSION_INSTALLED=$(terraform version -json 2>/dev/null | jq -r '.terraform_version' || echo "")
      if [ "$TF_VERSION_INSTALLED" != "$TERRAFORM_VERSION" ]; then
        echo "⚠️ Terraform version mismatch: expected $TERRAFORM_VERSION, got $TF_VERSION_INSTALLED"
      fi
    fi
    ;;

  pulumi)
    echo "🪄 Pulumi project detected."
    if [ "$LANGUAGE" = "py" ]; then
      echo "📦 Installing Python deps for Pulumi..."
      if ! command -v pipenv &>/dev/null; then
        pip install pipenv
      fi
      [ -d ".venv" ] && echo "venv exists — skipping install" || pipenv install --dev
    elif [[ "$LANGUAGE" =~ ^(ts|js)$ ]]; then
      echo "📦 Installing Node deps for Pulumi..."
      if [ -d "node_modules" ]; then
        echo "node_modules exists — skipping npm ci"
      elif [ -f "package-lock.json" ]; then
        npm ci
      else
        npm install
      fi
    elif [ "$LANGUAGE" = "java" ]; then
      echo "📦 Java Pulumi project — Gradle build expected."
      gradle --version || echo "Gradle wrapper will handle it."
    fi
    ;;

  cfn)
    echo "🪄 CloudFormation project detected — enabling Jest for template validation..."
    if ! command -v jest &>/dev/null; then
      npm install -g jest@28.1.3 ts-node typescript@5.4.5 @types/jest
    fi
    ;;

  *)
    echo "⚠️ Unknown or empty platform — skipping tool-specific setup."
    ;;
esac

# -------------------------------------------------------------------
# Universal Jest fallback setup (for all languages/platforms)
# -------------------------------------------------------------------
if ! command -v jest &>/dev/null; then
  echo "📦 Installing Jest v28.1.3 globally for universal IaC test fallback..."
  npm install -g jest@28.1.3 ts-node typescript@5.4.5 @types/jest
else
  echo "✅ Jest already available globally — skipping fallback install."
fi

# -------------------------------------------------------------------
# Go environment consistency
# -------------------------------------------------------------------
if [ "$LANGUAGE" = "go" ]; then
  echo "🔧 Ensuring Go module mode and proxy settings..."
  export GO111MODULE=on
  go env -w GOPROXY=https://proxy.golang.org,direct || true
fi

# -------------------------------------------------------------------
# Java wrapper safety (non-breaking)
# -------------------------------------------------------------------
if [ "$LANGUAGE" = "java" ] && [ ! -f "./gradlew" ]; then
  echo "⚠️ gradlew missing — generating temporary wrapper"
  gradle wrapper || echo "Gradle wrapper generation failed, continuing..."
fi

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
# PATH setup for local dependencies
# -------------------------------------------------------------------
if [ -d "node_modules/.bin" ]; then
  echo "$(pwd)/node_modules/.bin" >> "$GITHUB_PATH"
fi
if [ -d ".venv/bin" ]; then
  echo "$(pwd)/.venv/bin" >> "$GITHUB_PATH"
fi

# -------------------------------------------------------------------
# Verification summary
# -------------------------------------------------------------------
echo "🔍 Verifying essential tools after setup..."
for tool in node npm jq terraform pulumi go python java jest; do
  command -v "$tool" >/dev/null 2>&1 && echo "✅ $tool available" || echo "⚠️ $tool missing (may not be needed)"
done

echo "🔧 Environment summary:"
echo "Node: $(node --version 2>/dev/null || echo 'missing')"
echo "Python: $(python --version 2>/dev/null || echo 'missing')"
echo "Terraform: $(terraform version -json 2>/dev/null | jq -r '.terraform_version' || echo 'missing')"
echo "Pulumi: $(pulumi version 2>/dev/null || echo 'missing')"
echo "Go: $(go version 2>/dev/null || echo 'missing')"
echo "Java: $(java -version 2>&1 | head -n 1 || echo 'missing')"
echo "Jest: $(npx jest --version 2>/dev/null || echo 'missing')"

echo "✅ Environment setup completed successfully"
