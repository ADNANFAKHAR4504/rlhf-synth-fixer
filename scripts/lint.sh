#!/bin/bash
set -e

echo "🔍 Running Lint checks..."

# Read metadata
if [ ! -f "metadata.json" ]; then
    echo "❌ metadata.json not found, exiting with failure"
    exit 1
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json | tr -d '[:space:]')
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json | tr -d '[:space:]')

echo "Running linting for platform: $PLATFORM, language: $LANGUAGE"

# ---- Skip non-code stacks early ----
if [[ "$PLATFORM" == "tf" || "$PLATFORM" == "terraform" || "$LANGUAGE" == "hcl" ]]; then
    echo "🪶 Terraform project detected — skipping npm lint."
    exit 0
fi

if [[ "$PLATFORM" == "cfn" ]]; then
    echo "📜 CloudFormation project detected, running validation..."
    if [ "$LANGUAGE" == "json" ]; then
        pipenv run cfn-validate-json
    elif [ "$LANGUAGE" == "yaml" ]; then
        pipenv run cfn-validate-yaml
    else
        echo "ℹ️ Unknown CFN language ($LANGUAGE), skipping lint."
    fi
    echo "✅ CloudFormation lint completed successfully."
    exit 0
fi

# ---- Language specific linting ----

if [ "$LANGUAGE" = "ts" ]; then
    echo "✅ TypeScript project detected, running ESLint..."
    if command -v npm >/dev/null 2>&1; then
        NODE_OPTIONS="--max-old-space-size=4096" npm run lint
    else
        echo "⚠️ npm not found, skipping ESLint."
    fi

elif [ "$LANGUAGE" = "go" ]; then
    echo "✅ Go project detected, running go fmt and go vet..."
    if [ "$PLATFORM" = "cdktf" ]; then
        if [ -f "terraform.tfstate" ]; then
            echo "⚠️ Found legacy terraform.tfstate. Removing for clean CI run..."
            rm -f terraform.tfstate
        fi
        if [ ! -d ".gen/aws" ]; then
            echo "Generating .gen/aws bindings via cdktf get..."
            npx --yes cdktf get
        fi
    fi
    UNFORMATTED=$(gofmt -l lib tests || true)
    if [ -n "$UNFORMATTED" ]; then
        echo "❌ The following files are not gofmt formatted:"
        echo "$UNFORMATTED"
        exit 1
    fi
    PKGS=$(go list ./lib/... ./tests/... 2>/dev/null || true)
    if [ -n "$PKGS" ]; then
        echo "$PKGS" | xargs -r go vet
    else
        echo "ℹ️ No Go packages found to vet."
    fi

elif [ "$LANGUAGE" = "py" ]; then
    echo "✅ Python project detected, running pylint..."
    LINT_OUTPUT=$(pipenv run lint 2>&1 || true)
    SCORE=$(echo "$LINT_OUTPUT" | sed -n 's/.*rated at \([0-9.]*\)\/10.*/\1/p')
    if [[ -z "$SCORE" ]]; then
        echo "❌ Could not extract lint score."
        exit 1
    fi
    echo "Detected Pylint score: $SCORE/10"
    MIN_SCORE=7.0
    if (( $(echo "$SCORE >= $MIN_SCORE" | bc -l) )); then
        echo "✅ Passed linting threshold."
    else
        echo "❌ Linting score below threshold."
        exit 1
    fi

elif [ "$LANGUAGE" = "java" ]; then
    echo "✅ Java project detected, running Checkstyle..."
    chmod +x ./gradlew
    ./gradlew check --build-cache --no-daemon
    echo "✅ Java lint completed successfully."

else
    echo "ℹ️ Unknown platform/language combination: $PLATFORM/$LANGUAGE"
    if command -v npm >/dev/null 2>&1 && [ -f "package.json" ]; then
        echo "💡 Running fallback ESLint (npm run lint)..."
        npm run lint || echo "⚠️ Fallback lint failed, ignoring for non-TS project."
    else
        echo "ℹ️ No npm environment found — skipping fallback lint."
    fi
fi

echo "✅ Lint checks completed successfully."
