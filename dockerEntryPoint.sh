#!/bin/bash

# Debug mode control - set DEBUG_MODE=1 to continue on failures
DEBUG_MODE=${DEBUG_MODE:-0}

if [ "$DEBUG_MODE" = "1" ]; then
    echo "🔧 DEBUG MODE ENABLED - Script will continue on failures"
else
    set -e  # Exit on error only if not in debug mode
fi

echo "=== Docker Entry Point - Starting CI/CD Pipeline ==="

# Track failed steps
FAILED_STEPS=()

# Function to run a step and handle errors
run_step() {
    local step_name="$1"
    local command="$2"
    
    echo ""
    echo "=== $step_name ==="
    
    if [ "$DEBUG_MODE" = "1" ]; then
        # In debug mode, capture exit code but continue
        if eval "$command"; then
            echo "✅ $step_name completed successfully"
        else
            local exit_code=$?
            echo "❌ $step_name failed with exit code: $exit_code"
            FAILED_STEPS+=("$step_name (exit code: $exit_code)")
        fi
    else
        # Normal mode - let errors propagate
        eval "$command"
        echo "✅ $step_name completed successfully"
    fi
}

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
export CI=${CI:-1}
export TASK_PATH=${TASK_PATH:unknown} # cfn-yaml/Pr278 
export DEBUG_MODE=${DEBUG_MODE:-1}
# Set ENVIRONMENT_SUFFIX as the last part of the task path lowercased
if [[ "$TASK_PATH" == */* ]]; then
    ENVIRONMENT_SUFFIX=$(echo "$TASK_PATH" | awk -F/ '{print $NF}' | tr '[:upper:]' '[:lower:]')
else
    ENVIRONMENT_SUFFIX="$TASK_PATH"
fi

echo "Environment configuration:"
echo "  ENVIRONMENT_SUFFIX: $ENVIRONMENT_SUFFIX"
echo "  CI: $CI"

# If arguments are provided, execute them instead of the pipeline
if [ $# -gt 0 ]; then
    echo "Executing provided command: $*"
    exec "$@"
fi

# Extract task from archive
cp -r archive/"$TASK_PATH"/* ./
echo "Extracted task from archive: $TASK_PATH"

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
echo "Starting CI/CD pipeline execution..."

# STEP 1: BUILD
if [ -f "scripts/build.sh" ]; then
    run_step "STEP 1: BUILD" "./scripts/build.sh"
else
    run_step "STEP 1: BUILD" "npm run build"
fi

# STEP 2: SYNTH
run_step "STEP 2: SYNTH" "./scripts/synth.sh"

# STEP 3: LINT
run_step "STEP 3: LINT" "./scripts/lint.sh"

# STEP 4: UNIT TESTS
run_step "STEP 4: UNIT TESTS" "./scripts/unit-tests.sh"

# STEP 5: DEPLOY
run_step "STEP 5: DEPLOY" "./scripts/deploy.sh"

# STEP 6: INTEGRATION TESTS
run_step "STEP 6: INTEGRATION TESTS" "./scripts/integration-tests.sh"

# STEP 7: DESTROY (Optional)
run_step "STEP 7: DESTROY (Optional)" "./scripts/destroy.sh"

echo ""
echo "=== CI/CD Pipeline Execution Complete ==="

# Report results
if [ "$DEBUG_MODE" = "1" ] && [ ${#FAILED_STEPS[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  SUMMARY: The following steps failed:"
    for step in "${FAILED_STEPS[@]}"; do
        echo "   - $step"
    done
    echo ""
    echo "Exit with failure code since some steps failed"
    exit 1
elif [ ${#FAILED_STEPS[@]} -eq 0 ]; then
    echo "✅ All pipeline steps completed successfully!"
else
    echo "=== CI/CD Pipeline Completed Successfully ==="
fi