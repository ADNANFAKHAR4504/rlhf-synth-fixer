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

export NPM_CONFIG_PREFIX="$HOME/.npm-global"
export PATH="$PATH:$HOME/.npm-global/bin"

# -------------------------------------------------------------------
# Common sanity checks
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
      if [ -d "node_modules" ]; then echo "node_modules exists — skipping npm ci";
      elif [ -f "package-lock.json" ]; then npm ci;
      else npm install; fi
    elif [ "$LANGUAGE" = "java" ]; then
      gradle --version || echo "Gradle wrapper will be used."
    elif [ "$LANGUAGE" = "py" ]; then
      if ! command -v pipenv &>/dev/null; then pip install pipenv; fi
      pipenv install --dev
    fi
    ;;

  cdktf)
    echo "🪄 CDKTF project detected."
    if [ "$LANGUAGE" = "go" ]; then
      echo "📦 Go CDKTF project — skipping npm install."

    elif [[ "$LANGUAGE" =~ ^(ts|js)$ ]]; then
      if [ -d "node_modules" ]; then echo "node_modules exists — skipping npm ci";
      elif [ -f "package-lock.json" ]; then npm ci;
      else npm install; fi

    elif [ "$LANGUAGE" = "py" ]; then
      echo "🐍 CDKTF + Python detected — preparing environment..."

      # ✅ Guarantee pipenv available
      if ! command -v pipenv &>/dev/null; then
        echo "📦 Installing pipenv..."
        pip install pipenv
      fi

      # ✅ Create venv if missing
      if [ ! -d ".venv" ]; then
        echo "📦 Installing Python dependencies..."
        pipenv install --dev
      else
        echo "✅ .venv exists — skipping pipenv install"
      fi

      # ✅ Ensure CDKTF CLI installed (required for cdktf synth / get)
      if ! command -v cdktf &>/dev/null; then
        echo "📦 Installing CDKTF CLI globally..."
        npm install -g cdktf-cli@latest >/dev/null 2>&1
      else
        echo "✅ CDKTF CLI already available"
      fi

      # ✅ Ensure .gen exists (critical for synth + lint + integration tests)
      if [ ! -d ".gen/aws" ]; then
        echo "📦 Generating provider bindings (.gen)..."
        npx --yes cdktf get
      else
        echo "✅ .gen/aws exists — skipping cdktf get"
      fi
    fi
    ;;

  tf)
    echo "🪄 Terraform project — minimal setup."
    if [ ! -d "node_modules" ]; then
      npm init -y >/dev/null 2>&1 || true
      npm install --no-save jest ts-jest typescript @types/jest >/dev/null 2>&1
    fi
    ;;

  pulumi)
    echo "🪄 Pulumi project detected."
    if [ "$LANGUAGE" = "py" ]; then
      if ! command -v pipenv &>/dev/null; then pip install pipenv; fi
      [ -d ".venv" ] && echo "✅ venv exists" || pipenv install --dev
    elif [[ "$LANGUAGE" =~ ^(ts|js)$ ]]; then
      if [ -d "node_modules" ]; then echo "node_modules exists — skipping npm ci";
      elif [ -f "package-lock.json" ]; then npm ci;
      else npm install; fi
    elif [ "$LANGUAGE" = "java" ]; then
      gradle --version || echo "Gradle wrapper will handle it."
    fi
    ;;

  cfn)
    echo "🪄 CloudFormation project detected."

    # CFN projects use pipenv in lint/unit tests, so ensure pipenv exists
    if [ -f "Pipfile" ]; then
      echo "📦 Pipfile found — installing pipenv environment..."
      if ! command -v pipenv &>/dev/null; then
        pip install pipenv
      fi

      # Create virtualenv only if not already present (fast on repeat runs)
      if [ ! -d ".venv" ]; then
        pipenv install --dev
      else
        echo "✅ .venv exists — skipping pipenv install"
      fi
    else
      echo "ℹ️ No Pipfile present — using system python + pip"
      pip install --user cfn-lint cfn-flip || pip install cfn-lint cfn-flip
      export PATH="$PATH:$HOME/.local/bin"
    fi

    # Jest for template structure validation tests
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
# Java wrapper fallback
# -------------------------------------------------------------------
if [ "$LANGUAGE" = "java" ] && [ ! -f "./gradlew" ]; then
  gradle wrapper || echo "Gradle wrapper generation failed"
fi

# -------------------------------------------------------------------
# Configure AWS
# -------------------------------------------------------------------
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  ./scripts/configure-aws.sh
fi

# -------------------------------------------------------------------
# PATH setup
# -------------------------------------------------------------------
[ -d "node_modules/.bin" ] && echo "$(pwd)/node_modules/.bin" >> "$GITHUB_PATH"
[ -d ".venv/bin" ] && echo "$(pwd)/.venv/bin" >> "$GITHUB_PATH"

echo "✅ Environment setup completed successfully"
