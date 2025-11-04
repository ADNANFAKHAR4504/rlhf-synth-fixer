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
# Common sanity checks
# -------------------------------------------------------------------
echo "🔹 Checking available tools..."
node --version || echo "⚠️ Node not found"
python --version || echo "⚠️ Python not found"
terraform --version || true
pulumi version || true
go version || true
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
      echo "📦 CDKTF (Go) → skipping Node installs."

    elif [[ "$LANGUAGE" =~ ^(ts|js)$ ]]; then
      echo "📦 Installing npm dependencies for CDKTF..."
      if [ -d "node_modules" ]; then
        echo "node_modules exists — skipping npm ci"
      elif [ -f "package-lock.json" ]; then
        npm ci
      else
        npm install
      fi

    elif [ "$LANGUAGE" = "py" ]; then
      echo "🐍 CDKTF + Python detected — preparing environment..."

      # Ensure pipenv exists
      if ! command -v pipenv &>/dev/null; then
        echo "📦 Installing pipenv..."
        pip install pipenv
      fi

      # Create or reuse virtual environment
      if [ -d ".venv" ]; then
        echo "✅ Python virtualenv exists — skipping pipenv install"
      else
        echo "📦 Installing Python dependencies via pipenv..."
        pipenv install --dev
      fi

      # ✅ REQUIRED: ensure CDKTF CLI exists
      if ! command -v cdktf &>/dev/null; then
        echo "📦 Installing CDKTF CLI globally..."
        npm install -g cdktf-cli@latest >/dev/null 2>&1
      else
        echo "✅ CDKTF CLI already available"
      fi

    elif [ "$LANGUAGE" = "java" ]; then
      gradle --version || echo "Gradle wrapper will handle it."
    fi
    ;;

  tf)
    echo "🪄 Terraform project — minimal setup required."
    if [ ! -d "node_modules" ]; then
      echo "📦 Installing minimal Jest environment for Terraform test support..."
      npm init -y >/dev/null 2>&1 || true
      npm install --no-save jest ts-jest typescript @types/jest >/dev/null 2>&1
    fi
    ;;

  pulumi)
    echo "🪄 Pulumi project detected."
    if [ "$LANGUAGE" = "py" ]; then
      pip install pipenv
      [ -d ".venv" ] && echo "✅ venv exists — skipping pipenv install" || pipenv install --dev
    elif [[ "$LANGUAGE" =~ ^(ts|js)$ ]]; then
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

  cfn)
    echo "🪄 CloudFormation project detected — enabling Jest for validation..."
    if ! command -v jest &>/dev/null; then
      npm install -g jest@28.1.3 ts-node typescript@5.4.5 @types/jest
    fi
    ;;
esac

# -------------------------------------------------------------------
# Universal Jest fallback
# -------------------------------------------------------------------
if ! command -v jest &>/dev/null; then
  npm install -g jest@28.1.3 ts-node typescript@5.4.5 @types/jest
fi

# -------------------------------------------------------------------
# PATH setup
# -------------------------------------------------------------------
[ -d "node_modules/.bin" ] && echo "$(pwd)/node_modules/.bin" >> "$GITHUB_PATH"
[ -d ".venv/bin" ] && echo "$(pwd)/.venv/bin" >> "$GITHUB_PATH"

echo "✅ Environment setup completed successfully"
