#!/bin/bash
set -e

echo "=== Docker Entry Point - Starting CI/CD Pipeline ==="

# Run setup.sh to prepare the environment
./scripts/setup.sh

# Set up AWS credentials if they exist
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "Setting up AWS credentials from environment variables..."
    export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
    
    # Set optional AWS environment variables if provided
    [ -n "$AWS_SESSION_TOKEN" ] && export AWS_SESSION_TOKEN="$AWS_SESSION_TOKEN"
    [ -n "$AWS_DEFAULT_REGION" ] && export AWS_DEFAULT_REGION="$AWS_DEFAULT_REGION"
    [ -n "$AWS_REGION" ] && export AWS_REGION="$AWS_REGION"
    [ -n "$AWS_PROFILE" ] && export AWS_PROFILE="$AWS_PROFILE"
    
    echo "AWS credentials configured successfully"
    
    # Verify AWS CLI is configured and ready
    echo "Verifying AWS CLI configuration..."
    if aws sts get-caller-identity >/dev/null 2>&1; then
        echo "AWS CLI is configured and ready to use"
        aws sts get-caller-identity --output table
    else
        echo "WARNING: AWS CLI configuration test failed"
        echo "Please check your AWS credentials and permissions"
    fi
else
    echo "No AWS credentials found in environment variables"
    echo "AWS CLI will not be available for use"
fi

# Set default environment variables
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-dev}
export CI=${CI:-1}
export RUN_TESTS=${RUN_TESTS:-0}

echo "Environment configuration:"
echo "  ENVIRONMENT_SUFFIX: $ENVIRONMENT_SUFFIX"
echo "  CI: $CI"
echo "  RUN_TESTS: $RUN_TESTS"

# If arguments are provided, execute them instead of the pipeline
if [ $# -gt 0 ]; then
    echo "Executing provided command: $*"
    exec "$@"
fi

# Check if metadata.json exists
if [ ! -f "metadata.json" ]; then
    echo "❌ metadata.json not found - cannot proceed with CI/CD pipeline"
    echo "Either provide metadata.json or pass a command to execute"
    exit 1
fi

# Read project metadata
PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
echo "Detected project: platform=$PLATFORM, language=$LANGUAGE"

# Execute CI/CD pipeline steps in order
echo ""
echo "=== STEP 1: BUILD ==="
if [ -f "scripts/build.sh" ]; then
    ./scripts/build.sh
else
    echo "Running build directly..."
    npm run build
fi

echo ""
echo "=== STEP 2: SYNTH ==="
./scripts/synth.sh


echo ""
echo "=== STEP 3: LINT ==="
./scripts/lint.sh

echo ""
echo "=== STEP 4: UNIT TESTS ==="
./scripts/unit-tests.sh

echo ""
echo "=== STEP 5: DEPLOY ==="
./scripts/deploy.sh

echo ""
echo "=== STEP 6: INTEGRATION TESTS ==="
./scripts/integration-tests.sh

echo ""
echo "=== STEP 7: DESTROY (Optional) ==="
./scripts/destroy.sh

echo ""
echo "=== CI/CD Pipeline Completed Successfully ==="