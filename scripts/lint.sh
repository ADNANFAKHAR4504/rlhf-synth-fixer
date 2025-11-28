#!/bin/bash
set -e

echo "🔍 Running Lint checks..."

# Read metadata to determine platform and language
if [ ! -f "metadata.json" ]; then
    echo "❌ metadata.json not found, exiting with failure"
    exit 1
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)

echo "Running linting for platform: $PLATFORM, language: $LANGUAGE"

if [ "$LANGUAGE" = "ts" ]; then
    echo "✅ TypeScript project detected, running ESLint..."
    NODE_OPTIONS="--max-old-space-size=4096" npm run lint

elif [ "$LANGUAGE" = "go" ]; then
    echo "✅ Go project detected, running go fmt and go vet..."
    if [ "$PLATFORM" = "cdktf" ]; then
        if [ -f "terraform.tfstate" ]; then
            echo "⚠️ Found legacy terraform.tfstate. Removing for clean CI run..."
            rm -f terraform.tfstate
        fi

        if [ ! -d ".gen/aws" ]; then
            echo "📦 Running cdktf get to generate local bindings (.gen folder missing)"
            npx --yes cdktf get
        else
            echo "✅ .gen/aws exists — skipping cdktf get"
        fi
    fi

    UNFORMATTED=$(gofmt -l lib tests || true)
    if [ -n "$UNFORMATTED" ]; then
        echo "❌ The following files are not gofmt formatted:"
        echo "$UNFORMATTED"
        exit 1
    fi

    PKGS=$(go list ./... | grep -v '/node_modules/' | grep -v '/\.gen/' | grep -E '/(lib|tests)($|/)' || true)
    if [ "$PLATFORM" = "cdk" ]; then
      PKGS=$(go list ./lib/... ./tests/... 2>/dev/null || true)
    fi

    if [ -n "$PKGS" ]; then
        echo "$PKGS" | xargs -r go vet
    else
        echo "ℹ️ No Go packages found to vet."
    fi

elif [[ "$LANGUAGE" = "py" || "$LANGUAGE" = "python" ]]; then
    echo "✅ Python project detected, running pylint..."

    if command -v pipenv &>/dev/null && [ -f "Pipfile" ]; then
        LINT_OUTPUT=$(pipenv run lint 2>&1 || true)
    else
        echo "⚠️ pipenv not found — falling back to raw pylint"
        pip install --quiet pylint >/dev/null 2>&1 || true
        LINT_OUTPUT=$(pylint lib tests 2>&1 || true)
    fi

    echo "--- START PYLINT OUTPUT (Raw) ---"
    echo "$LINT_OUTPUT"
    echo "--- END PYLINT OUTPUT (Raw) ---"

    SCORE=$(echo "$LINT_OUTPUT" | sed -n 's/.*rated at \([0-9.]*\)\/10.*/\1/p')
    if [[ -z "$SCORE" ]]; then
        echo "❌ ERROR: Could not extract linting score."
        exit 1
    fi

    MIN_SCORE=7.0
    if (( $(echo "$SCORE >= $MIN_SCORE" | bc -l) )); then
        echo "✅ Linting score $SCORE/10 ≥ $MIN_SCORE — Passed."
        exit 0
    else
        echo "❌ Linting score $SCORE/10 < $MIN_SCORE — Failed."
        exit 1
    fi

elif [ "$LANGUAGE" = "java" ]; then
    echo "✅ Java project detected, running Checkstyle..."
    chmod +x ./gradlew
    ./gradlew check --build-cache --no-daemon
    echo "✅ Java linting completed"

elif [ "$LANGUAGE" = "js" ]; then
    echo "✅ JavaScript project detected, running ESLint..."
    NODE_OPTIONS="--max-old-space-size=4096" npm run lint

elif [ "$PLATFORM" = "tf" ] && [ "$LANGUAGE" = "hcl" ]; then
    echo "✅ Terraform project detected, running terraform fmt and validate..."

    # Check if terraform is available
    if ! command -v terraform &>/dev/null; then
        echo "❌ terraform command not found"
        exit 1
    fi

    # Navigate to lib directory where terraform files are located
    cd lib

    # Always initialize terraform (required for fmt and validate)
    # Using -upgrade=false to use cache when available but ensure providers exist
    echo "📦 Initializing Terraform..."
    terraform init -backend=false -upgrade=false

    # Check terraform formatting
    echo "🔍 Checking Terraform formatting..."
    if ! terraform fmt -check -recursive; then
        echo "❌ Terraform files are not properly formatted. Run 'terraform fmt -recursive' to fix."
        exit 1
    fi

    # Validate terraform configuration
    echo "🔍 Validating Terraform configuration..."
    terraform validate

    cd ..

elif [ "$PLATFORM" = "cfn" ]; then
    echo "✅ CloudFormation project detected, running cfn-lint..."

    # If Pipfile exists → use pipenv environment
    if [ -f "Pipfile" ]; then
        echo "📦 Pipfile found — ensuring pipenv is available..."
        if ! command -v pipenv &>/dev/null; then
            echo "📦 Installing pipenv..."
            pip install pipenv
        fi

        # Create virtualenv only if needed (cached after first run)
        if [ ! -d ".venv" ]; then
            echo "📦 Installing Python dependencies via pipenv..."
            pipenv install --dev
        else
            echo "✅ .venv exists — skipping pipenv install"
        fi

        echo "🔍 Linting templates under lib/ using pipenv environment..."
        find lib -type f \( -name "*.yaml" -o -name "*.yml" -o -name "*.json" \) \
            -print0 | xargs -0 -r pipenv run cfn-lint -t

    else
        echo "ℹ️ No Pipfile found — using system Python environment"
        if ! command -v cfn-lint &>/dev/null; then
            echo "📦 Installing cfn-lint..."
            pip install cfn-lint >/dev/null 2>&1
        fi

        echo "🔍 Linting templates under lib/ ..."
        find lib -type f \( -name "*.yaml" -o -name "*.yml" -o -name "*.json" \) \
            -print0 | xargs -0 -r cfn-lint -t
    fi

elif [ "$PLATFORM" = "cicd" ] && [ "$LANGUAGE" = "yml" ]; then
    echo "✅ CI/CD YAML project detected, running yamllint..."

    # Install yamllint if not available
    if ! command -v yamllint &>/dev/null; then
        echo "📦 Installing yamllint..."
        pip install yamllint >/dev/null 2>&1
    fi

    # Run yamllint on lib directory
    echo "🔍 Linting YAML files under lib/..."
    if [ -d "lib" ]; then
        yamllint lib/
    else
        echo "⚠️ No lib/ directory found, skipping yamllint"
    fi

else
    echo "ℹ️ Unknown platform/language combination: $PLATFORM/$LANGUAGE"
    echo "💡 Running default ESLint fallback"
    npm run lint
fi

echo "✅ Lint checks completed successfully"
