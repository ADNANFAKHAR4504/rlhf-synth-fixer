#!/bin/bash

# Exit on any error
set -e

echo "🔧 Setting up environment..."

# Set default values if not provided via environment variables
NODE_VERSION=${NODE_VERSION:-22.17.0}
TERRAFORM_VERSION=${TERRAFORM_VERSION:-1.12.2}
PULUMI_VERSION=${PULUMI_VERSION:-3.109.0}
PYTHON_VERSION=${PYTHON_VERSION:-3.12.11}
PIPENV_VERSION=${PIPENV_VERSION:-2025.0.4}
JAVA_VERSION=${JAVA_VERSION:-17}
DOWNLOAD_ARTIFACTS=${DOWNLOAD_ARTIFACTS:-false}
UPLOAD_ARTIFACTS=${UPLOAD_ARTIFACTS:-false}
PLATFORM=${PLATFORM:-""}
LANGUAGE=${LANGUAGE:-""}

echo "Environment setup configuration:"
echo "  Node.js version: $NODE_VERSION"
echo "  Terraform version: $TERRAFORM_VERSION"
echo "  Pulumi version: $PULUMI_VERSION"
echo "  Python version: $PYTHON_VERSION" 
echo "  Pipenv version: $PIPENV_VERSION"
echo "  Java version: $JAVA_VERSION"
echo "  Platform: $PLATFORM"
echo "  Language: $LANGUAGE"
echo "  Download artifacts: $DOWNLOAD_ARTIFACTS"
echo "  Upload artifacts: $UPLOAD_ARTIFACTS"

# Setup Node.js
echo "📦 Setting up Node.js $NODE_VERSION..."
if command -v node >/dev/null 2>&1; then
  CURRENT_NODE=$(node --version)
  echo "Current Node.js version: $CURRENT_NODE"
  if [ "$CURRENT_NODE" != "v$NODE_VERSION" ]; then
    echo "⚠️ Node.js version mismatch. Expected: v$NODE_VERSION, Current: $CURRENT_NODE"
    echo "Please ensure correct Node.js version is available in PATH"
  fi
else
  echo "❌ Node.js not found in PATH"
  exit 1
fi

# Setup Python
echo "📦 Setting up Python $PYTHON_VERSION..."
if command -v python >/dev/null 2>&1; then
  CURRENT_PYTHON=$(python --version)
  echo "Current Python version: $CURRENT_PYTHON"
  if [ "$CURRENT_PYTHON" != "Python $PYTHON_VERSION" ]; then
    echo "⚠️ Python version mismatch. Expected: Python $PYTHON_VERSION, Current: $CURRENT_PYTHON"
    echo "Please ensure correct Python version is available in PATH"
  fi
else
  echo "❌ Python not found in PATH"
  exit 1
fi

# Setup Terraform if needed
if [ "$PLATFORM" = "cdktf" ] || [ "$PLATFORM" = "tf" ] || [ "$PLATFORM" = "" ]; then
  echo "📦 Setting up Terraform $TERRAFORM_VERSION..."
  if command -v terraform >/dev/null 2>&1; then
    CURRENT_TERRAFORM=$(terraform version -json 2>/dev/null | jq -r '.terraform_version' || echo 'unknown')
    echo "Current Terraform version: $CURRENT_TERRAFORM"
    if [ "$CURRENT_TERRAFORM" != "$TERRAFORM_VERSION" ]; then
      echo "⚠️ Terraform version mismatch. Expected: $TERRAFORM_VERSION, Current: $CURRENT_TERRAFORM"
      echo "Please ensure correct Terraform version is available in PATH"
    fi
  else
    echo "❌ Terraform not found in PATH"
    if [ "$PLATFORM" = "tf" ] || [ "$PLATFORM" = "cdktf" ]; then
      exit 1
    fi
  fi
fi

# Setup Pulumi if needed
if [ "$PLATFORM" = "pulumi" ] || [ "$PLATFORM" = "" ]; then
  echo "📦 Setting up Pulumi $PULUMI_VERSION..."
  if command -v pulumi >/dev/null 2>&1; then
    CURRENT_PULUMI=$(pulumi version 2>/dev/null || echo 'unknown')
    echo "Current Pulumi version: $CURRENT_PULUMI"
    # Note: Pulumi version output format is different, so we don't do strict comparison
  else
    echo "❌ Pulumi not found in PATH"
    if [ "$PLATFORM" = "pulumi" ]; then
      exit 1
    fi
  fi
fi

# Setup Go for CDKTF Go projects
if [ "$PLATFORM" = "cdktf" ] && [ "$LANGUAGE" = "go" ]; then
  echo "📦 Verifying Go toolchain for CDKTF Go..."
  if command -v go >/dev/null 2>&1; then
    echo "Go: $(go version)"
  else
    echo "❌ Go not found in PATH (should be installed by setup-environment action)"
    exit 1
  fi

  # Enforce single-module layout
  if [ -f "lib/go.mod" ] || [ -f "lib/go.sum" ]; then
    echo "⚠️ Found lib/go.mod or lib/go.sum. Removing to avoid multi-module conflicts."
    rm -f lib/go.mod lib/go.sum || true
  fi
fi 

# Check metadata to see if Java is needed
if [ -f "metadata.json" ]; then
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
  if [ "$LANGUAGE" = "java" ] || [ "$PLATFORM" = "pulumi" ] || [ "$PLATFORM" = "" ]; then
    echo "📦 Setting up Java $JAVA_VERSION..."
    if command -v java >/dev/null 2>&1; then
      CURRENT_JAVA=$(java -version 2>&1 | head -n 1)
      echo "Current Java version: $CURRENT_JAVA"
    else
      echo "❌ Java not found in PATH"
      if [ "$LANGUAGE" = "java" ]; then
        exit 1
      fi
    fi
    
    echo "📦 Setting up Gradle..."
    if command -v gradle >/dev/null 2>&1; then
      CURRENT_GRADLE=$(gradle --version 2>/dev/null | grep "Gradle" | head -n 1)
      echo "Current Gradle version: $CURRENT_GRADLE"
    else
      echo "ℹ️ Gradle not found in PATH, using Gradle wrapper"
    fi
  fi
fi

# Configure AWS if credentials are available
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "🔧 AWS credentials found, configuring AWS..."
  ./scripts/configure-aws.sh
else
  echo "ℹ️ No AWS credentials found, skipping AWS configuration"
fi

# Install pipenv
echo "📦 Installing pipenv $PIPENV_VERSION..."
pip install --upgrade pip pipenv==$PIPENV_VERSION

# Set pipenv environment variable
export PIPENV_VENV_IN_PROJECT=1
if [ -n "$GITHUB_ENV" ]; then
  echo "PIPENV_VENV_IN_PROJECT=1" >> "$GITHUB_ENV"
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
if [ -f "package.json" ]; then
  npm ci
else
  echo "⚠️ No package.json found, skipping npm install"
fi

# Install Python dependencies if Pipfile exists
echo "📦 Installing Python dependencies..."
if [ -f "Pipfile" ]; then
  pipenv install --dev
  pipenv install cfn-lint
  pipenv install cfn-flip
else
  echo "ℹ️ No Pipfile found, skipping Python dependencies installation"
fi

# Verify environment
echo "=== Environment Verification ==="
echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "Python: $(python --version 2>/dev/null || echo 'Not installed')"
echo "Pipenv: $(pipenv --version 2>/dev/null || echo 'Not installed')"
echo "Java: $(java -version 2>&1 | head -n 1 2>/dev/null || echo 'Not installed')"
echo "Gradle: $(gradle --version 2>/dev/null | grep "Gradle" | head -n 1 || echo 'Not installed')"
echo "Terraform: $(terraform version -json 2>/dev/null | jq -r '.terraform_version' || echo 'Not installed')"
echo "Terraform location: $(which terraform 2>/dev/null || echo 'Not found in PATH')"
echo "Pulumi: $(pulumi version 2>/dev/null || echo 'Not installed')"
echo "Pulumi location: $(which pulumi 2>/dev/null || echo 'Not found in PATH')"
echo "=============================="

# Setup PATH
echo "📦 Setting up PATH..."
# Add node_modules/.bin to PATH if it exists
if [ -d "node_modules/.bin" ]; then
  export PATH="$(pwd)/node_modules/.bin:$PATH"
  if [ -n "$GITHUB_PATH" ]; then
    echo "$(pwd)/node_modules/.bin" >> "$GITHUB_PATH"
  fi
fi

# Add .venv/bin to PATH if it exists
if [ -d ".venv/bin" ]; then
  export PATH="$(pwd)/.venv/bin:$PATH"
  if [ -n "$GITHUB_PATH" ]; then
    echo "$(pwd)/.venv/bin" >> "$GITHUB_PATH"
  fi
fi

echo "✅ Environment setup completed successfully"
