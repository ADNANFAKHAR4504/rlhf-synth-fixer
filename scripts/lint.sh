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
        # --- FIX: remove legacy terraform.tfstate before cdktf get ---
        if [ -f "terraform.tfstate" ]; then
            echo "⚠️ Found legacy terraform.tfstate. Removing for clean CI run..."
            rm -f terraform.tfstate
        fi

        if [ ! -d ".gen/aws" ]; then
            echo "Running cdktf get to generate local bindings in .gen/ (missing .gen/aws)"
            npx --yes cdktf get
        else
            echo ".gen/aws exists, skipping cdktf get"
        fi
    fi

    # Module dependencies are prepared during build; skipping go mod tidy here

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
        echo "No Go packages found under lib or tests to vet."
    fi

elif [ "$LANGUAGE" = "py" ]; then
    # (unchanged pylint block)
    LINT_OUTPUT=$(pipenv run lint 2>&1 || true)
    LINT_EXIT_CODE=$?
    echo "--- START PYLINT OUTPUT (Raw) ---"
    echo "$LINT_OUTPUT"
    echo "--- END PYLINT OUTPUT (Raw) ---"
    echo "Pylint command raw exit code: $LINT_EXIT_CODE"

    if [ "$LINT_EXIT_CODE" -ne 0 ]; then
        echo "⚠️ Pylint command exited with non-zero status code: $LINT_EXIT_CODE."
    fi
    
    SCORE=$(echo "$LINT_OUTPUT" | sed -n 's/.*rated at \([0-9.]*\)\/10.*/\1/p')
    if [[ -z "$SCORE" || ! "$SCORE" =~ ^[0-9.]+$ ]]; then
        echo "❌ ERROR: Could not extract linting score from Pylint output."
        exit 1
    fi
    echo "Detected Pylint Score: $SCORE/10"

    MIN_SCORE=7.0
    if (( $(echo "$SCORE >= $MIN_SCORE" | bc -l) )); then
        echo "✅ Linting score $SCORE/10 is greater than or equal to $MIN_SCORE. Linting passed."
        exit 0
    else
        echo "❌ Linting score $SCORE/10 is less than $MIN_SCORE. Linting failed."
        exit 1
    fi

elif [ "$LANGUAGE" = "java" ]; then
    echo "✅ Java project detected, running Checkstyle..."
    chmod +x ./gradlew
    ./gradlew check --build-cache --no-daemon
    echo "✅ Java linting completed successfully"

elif [ "$PLATFORM" = "cfn" ]; then
    echo "✅ CloudFormation project detected, running CloudFormation validation..."
    if [ "$LANGUAGE" = "json" ]; then
        pipenv run cfn-validate-json
    elif [ "$LANGUAGE" = "yaml" ]; then
        pipenv run cfn-validate-yaml
    fi

else
    echo "ℹ️ Unknown platform/language combination: $PLATFORM/$LANGUAGE"
    echo "💡 Running default ESLint only"
    npm run lint
fi

echo "✅ Lint checks completed successfully"