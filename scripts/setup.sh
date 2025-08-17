#!/bin/bash

# Exit on any error
set -e

echo "🔧 Setting up environment..."

# Read environment variables
NODE_VERSION=${NODE_VERSION:-"22.17.0"}
TERRAFORM_VERSION=${TERRAFORM_VERSION:-"1.12.2"}
PULUMI_VERSION=${PULUMI_VERSION:-"3.109.0"}
DOWNLOAD_ARTIFACTS=${DOWNLOAD_ARTIFACTS:-"true"}
UPLOAD_ARTIFACTS=${UPLOAD_ARTIFACTS:-"false"}
PLATFORM=${PLATFORM:-""}

echo "Environment configuration:"
echo "  Node.js version: $NODE_VERSION"
echo "  Terraform version: $TERRAFORM_VERSION"
echo "  Pulumi version: $PULUMI_VERSION"
echo "  Platform: $PLATFORM"
echo "  Download artifacts: $DOWNLOAD_ARTIFACTS"
echo "  Upload artifacts: $UPLOAD_ARTIFACTS"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
  echo "Installing dependencies from requirements.txt..."
  pip install -r requirements.txt
elif [ -f "Pipfile" ]; then
  echo "Installing dependencies from Pipfile..."
  # Install pipenv if not available
  if ! command -v pipenv &> /dev/null; then
    echo "Installing pipenv..."
    pip install pipenv
  fi
  pipenv install --dev
else
  echo "No Python dependency files found, skipping Python setup"
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
if [ -f "package.json" ]; then
  echo "Installing dependencies from package.json..."
  npm ci
else
  echo "No package.json found, skipping Node.js setup"
fi

# Platform-specific setup
case $PLATFORM in
  "cdk"|"cdktf")
    echo "🔧 Setting up CDK/CDKTF environment..."
    if [ -f "cdk.json" ]; then
      echo "CDK configuration found"
    fi
    if [ -f "cdktf.json" ]; then
      echo "CDKTF configuration found"
    fi
    ;;
  "pulumi")
    echo "🔧 Setting up Pulumi environment..."
    if [ -f "Pulumi.yaml" ]; then
      echo "Pulumi configuration found"
    fi
    ;;
  "tf")
    echo "🔧 Setting up Terraform environment..."
    if [ -f "lib/main.tf" ] || [ -f "lib/provider.tf" ]; then
      echo "Terraform configuration found"
    fi
    ;;
  "cfn")
    echo "🔧 Setting up CloudFormation environment..."
    if [ -f "lib/TapStack.yml" ] || [ -f "lib/TapStack.json" ]; then
      echo "CloudFormation configuration found"
    fi
    ;;
  *)
    echo "🔧 Auto-detecting platform..."
    if [ -f "cdk.json" ]; then
      echo "Detected CDK platform"
    elif [ -f "cdktf.json" ]; then
      echo "Detected CDKTF platform"
    elif [ -f "Pulumi.yaml" ]; then
      echo "Detected Pulumi platform"
    elif [ -f "lib/main.tf" ] || [ -f "lib/provider.tf" ]; then
      echo "Detected Terraform platform"
    elif [ -f "lib/TapStack.yml" ] || [ -f "lib/TapStack.json" ]; then
      echo "Detected CloudFormation platform"
    else
      echo "No platform configuration detected"
    fi
    ;;
esac

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p cfn-outputs
mkdir -p bin
mkdir -p lib

# Set up environment for different platforms
if [ -f "metadata.json" ]; then
  echo "📋 Reading project metadata..."
  PLATFORM_FROM_METADATA=$(jq -r '.platform // "unknown"' metadata.json)
  LANGUAGE_FROM_METADATA=$(jq -r '.language // "unknown"' metadata.json)
  echo "  Platform from metadata: $PLATFORM_FROM_METADATA"
  echo "  Language from metadata: $LANGUAGE_FROM_METADATA"
fi

# Platform-specific initialization
case $PLATFORM in
  "cdk"|"cdktf")
    if [ -f "cdk.json" ] || [ -f "cdktf.json" ]; then
      echo "🔧 Initializing CDK/CDKTF..."
      npm run build || echo "Build failed, continuing..."
    fi
    ;;
  "pulumi")
    if [ -f "Pulumi.yaml" ]; then
      echo "🔧 Setting up Pulumi..."
      # Pulumi setup will be handled by the bootstrap script
    fi
    ;;
  "tf")
    if [ -f "lib/main.tf" ] || [ -f "lib/provider.tf" ]; then
      echo "🔧 Setting up Terraform..."
      # Terraform setup will be handled by the bootstrap script
    fi
    ;;
esac

echo "✅ Environment setup completed successfully"
