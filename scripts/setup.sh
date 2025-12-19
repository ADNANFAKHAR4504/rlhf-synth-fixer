#!/bin/bash
set -e

echo "🔧 Starting optimized environment setup..."
export PIPENV_VENV_IN_PROJECT=1

NODE_VERSION=${NODE_VERSION:-22.17.0}
TERRAFORM_VERSION=${TERRAFORM_VERSION:-1.12.2}
PULUMI_VERSION=${PULUMI_VERSION:-3.109.0}
PLATFORM=${PLATFORM:-""}
LANGUAGE=${LANGUAGE:-""}

echo "Platform: $PLATFORM"
echo "Language: $LANGUAGE"
echo "Node: $NODE_VERSION | Terraform: $TERRAFORM_VERSION | Pulumi: $PULUMI_VERSION"

# Ensure system utilities
if ! command -v jq &>/dev/null; then
  echo "📦 Installing jq..."
  sudo apt-get update -y && sudo apt-get install -y jq
fi

# Configure npm global directory
export NPM_CONFIG_PREFIX="$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"

echo "🔹 Checking tools..."
node --version || echo "⚠️ Node not found"
python --version || echo "⚠️ Python not found"

# 1) === Install Node.js dependencies IF package.json exists ===
if [ -f "package.json" ]; then
  echo "📦 Ensuring Node dependencies..."

  if [ -d "node_modules" ]; then
    echo "✅ node_modules exists — cache restored — skipping npm ci"
  elif [ -f "package-lock.json" ]; then
    echo "📦 Running npm ci (first install or cache miss)"
    npm ci
  else
    echo "📦 Running npm install (no lockfile)"
    npm install
  fi
fi

# 2) === Install Python dependencies IF Pipfile exists ===
if [ -f "Pipfile" ]; then
  echo "🐍 Ensuring pipenv environment..."

  if ! command -v pipenv &>/dev/null; then
    echo "📦 Installing pipenv..."
    pip install pipenv
  fi

  # Rebuild venv if cache mismatched interpreter version
  if [ -d ".venv" ] && [ ! -f ".venv/bin/python" ]; then
    echo "⚠️ Cached venv invalid — removing and recreating..."
    rm -rf .venv
  fi

  if [ -d ".venv" ]; then
    echo "✅ .venv exists — using cached environment"
    pipenv sync --dev
  else
    echo "📦 Creating new pipenv environment..."
    pipenv install --dev
  fi
  if [ "$PLATFORM" = "cdktf" ] && [ "$LANGUAGE" = "py" ]; then
    echo "📦 Ensuring CDKTF Python libraries are available..."

    # Check if cdktf is installed in the venv
    if ! pipenv run python -c "import cdktf" 2>/dev/null; then
      echo "📦 Installing CDKTF Python SDK into existing venv..."
      pipenv install "cdktf~=0.21.0" "constructs>=10.0.0,<11.0.0"
    else
      echo "✅ CDKTF Python library already installed in venv"
    fi
  fi

  echo "$(pwd)/.venv/bin" >> "$GITHUB_PATH"
fi

# 3) === CDKTF extra handling ===
if [ "$PLATFORM" = "cdktf" ]; then
  if ! command -v cdktf &>/dev/null; then
    echo "📦 Installing CDKTF CLI..."
    npm install -g cdktf-cli@latest >/dev/null 2>&1
  else
    echo "✅ CDKTF CLI already installed"
  fi

  if [ ! -d ".gen/aws" ]; then
    echo "📦 Generating provider bindings (.gen)..."
    npx --yes cdktf get
  else
    echo "✅ .gen restored from cache — skipping cdktf get"
  fi
fi

# 4) Universal Jest fallback
if ! command -v jest &>/dev/null; then
  echo "📦 Installing Jest fallback..."
  npm install -g jest@28.1.3 ts-node typescript @types/jest >/dev/null 2>&1 || true
fi

echo "✅ Environment setup completed successfully"