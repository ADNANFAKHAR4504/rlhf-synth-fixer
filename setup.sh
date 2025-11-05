#!/bin/bash

# Setup script for TAP project
# This script ensures the correct Node.js, Python, and pipenv versions are being used

set -e

echo "🔧 Setting up TAP project..."

# Check if we have the required Node.js version
REQUIRED_NODE_VERSION="v22.17.0"
CURRENT_NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")

if [ "$CURRENT_NODE_VERSION" != "$REQUIRED_NODE_VERSION" ]; then
    echo "❌ Node.js version mismatch!"
    echo "   Required: $REQUIRED_NODE_VERSION"
    echo "   Current:  $CURRENT_NODE_VERSION"
    echo ""
    echo "Please install Node.js $REQUIRED_NODE_VERSION using one of these methods:"
    echo ""
    echo "📋 Using NVM (recommended):"
    echo "   nvm install 22.17.0"
    echo "   nvm use 22.17.0"
    echo ""
    echo "📋 Using nodenv:"
    echo "   nodenv install 22.17.0"
    echo "   nodenv local 22.17.0"
    echo ""
    echo "📋 Direct download:"
    echo "   Visit: https://nodejs.org/download/release/v22.17.0/"
    echo ""
    exit 1
fi

echo "✅ Node.js version is correct: $CURRENT_NODE_VERSION"

# Check if we have the required Python version
REQUIRED_PYTHON_VERSION="Python 3.13"
CURRENT_PYTHON_VERSION=$(python --version 2>/dev/null || python3 --version 2>/dev/null || echo "not installed")

if [ "$CURRENT_PYTHON_VERSION" != "$REQUIRED_PYTHON_VERSION" ]; then
    echo "❌ Python version mismatch!"
    echo "   Required: $REQUIRED_PYTHON_VERSION"
    echo "   Current:  $CURRENT_PYTHON_VERSION"
    echo ""
    echo "Please install Python 3.13 using one of these methods:"
    echo ""
    echo "📋 Using pyenv (recommended):"
    echo "   pyenv install 3.13"
    echo "   pyenv local 3.13"
    echo ""
    echo "📋 Using conda:"
    echo "   conda install python=3.13"
    echo ""
    echo "� Direct download:"
    echo "   Visit: https://www.python.org/downloads/"
    echo ""
    exit 1
fi

echo "✅ Python version is correct: $CURRENT_PYTHON_VERSION"

# Check if we have the required pipenv version
REQUIRED_PIPENV_VERSION="2025.0.4"
CURRENT_PIPENV_VERSION=$(pipenv --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "not installed")

if [ "$CURRENT_PIPENV_VERSION" != "$REQUIRED_PIPENV_VERSION" ]; then
    echo "❌ Pipenv version mismatch!"
    echo "   Required: $REQUIRED_PIPENV_VERSION"
    echo "   Current:  $CURRENT_PIPENV_VERSION"
    echo ""
    echo "Installing pipenv $REQUIRED_PIPENV_VERSION..."
    pip install pipenv==$REQUIRED_PIPENV_VERSION
    
    # Verify installation
    NEW_PIPENV_VERSION=$(pipenv --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "failed")
    if [ "$NEW_PIPENV_VERSION" != "$REQUIRED_PIPENV_VERSION" ]; then
        echo "❌ Failed to install correct pipenv version"
        exit 1
    fi
fi

echo "✅ Pipenv version is correct: $CURRENT_PIPENV_VERSION"

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm ci

echo "📦 Installing Python dependencies (if any)..."
if [ -f "Pipfile" ]; then
    pipenv install --dev
fi

echo "🎉 Setup complete! You can now run:"
echo "   npm run build    - to compile TypeScript"
echo "   npm run test     - to run tests"
echo "   npm start        - to start the CLI"