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
    npm run lint
elif [ "$LANGUAGE" = "py" ]; then
    LINT_OUTPUT=$(pipenv run lint 2>&1 || true)
    LINT_EXIT_CODE=$?
    echo "--- START PYLINT OUTPUT (Raw) ---"
    echo "$LINT_OUTPUT"
    echo "--- END PYLINT OUTPUT (Raw) ---"
    echo "Pylint command raw exit code: $LINT_EXIT_CODE"

    if [ "$LINT_EXIT_CODE" -ne 0 ]; then
        echo "⚠️ Pylint command exited with non-zero status code: $LINT_EXIT_CODE."
    fi
    
    # Extract the score from the Pylint output
    SCORE=$(echo "$LINT_OUTPUT" | sed -n 's/.*rated at \([0-9.]*\)\/10.*/\1/p')
    if [[ -z "$SCORE" || ! "$SCORE" =~ ^[0-9.]+$ ]]; then
        echo "❌ ERROR: Could not extract linting score from Pylint output."
        echo "Please verify Pylint's output format or if it ran successfully enough to produce a score."
        exit 1
    fi
    echo "Detected Pylint Score: $SCORE/10"
    
    # Define the minimum acceptable score
    MIN_SCORE=7.0
    
    # Compare the extracted score with the minimum threshold
    if (( $(echo "$SCORE >= $MIN_SCORE" | bc -l) )); then
        echo "✅ Linting score $SCORE/10 is greater than or equal to $MIN_SCORE. Linting passed."
        exit 0
    else
        echo "❌ Linting score $SCORE/10 is less than $MIN_SCORE. Linting failed."
        exit 1
    fi
elif [ "$PLATFORM" = "cfn" ]; then
    echo "✅ CloudFormation project detected, running CloudFormation validation..."
    if [ "$LANGUAGE" = "json" ]; then
        pipenv run cfn-lint lib/TapStack.json --regions us-east-1 -D
    elif [ "$LANGUAGE" = "yaml" ]; then
        pipenv run cfn-lint lib/TapStack.yml --regions us-east-1 -D
    fi
else
    echo "ℹ️ Unknown platform/language combination: $PLATFORM/$LANGUAGE"
    echo "💡 Running default ESLint only"
    npm run lint
fi

echo "✅ Lint checks completed successfully"