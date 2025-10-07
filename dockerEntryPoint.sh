#!/bin/bash

# Debug mode control - set DEBUG_MODE=1 to continue on failures
DEBUG_MODE=${DEBUG_MODE:-0}

# Report mode control - set REPORT=1 to show minimal status updates
REPORT=${REPORT:-0}

# CSV file for task reporting
CSV_FILE="${CSV_FILE:-/app/task_reports.csv}"

# Function to write to CSV
write_to_csv() {
    local status="$1"
    local error="${2:-}"
    local timestamp=$(date -Iseconds)
    
    # Create CSV header if file doesn't exist
    if [ ! -f "$CSV_FILE" ]; then
        echo "TIMESTAMP,TASK_ID,TASK_PATH,STATUS,ERROR" > "$CSV_FILE"
    fi
    
    # Escape line breaks, commas, and quotes in the error field
    local escaped_error=""
    if [ -n "$error" ]; then
        escaped_error=$(echo "$error" | sed 's/"/\"\"/g' | sed 's/,/\\,/g' | tr '\n' '\\n' | tr '\r' ' ')
    fi
    
    # Write the row
    echo "$timestamp,${TASK_ID:-unknown},${TASK_PATH:-unknown},$status,\"$escaped_error\"" >> "$CSV_FILE"
}

# Function to update status in report mode
update_status() {
    local status="$1"
    local error="${2:-}"
    
    # Write to CSV
    write_to_csv "$status" "$error"
    
    if [ "$REPORT" = "1" ]; then
        if [ -n "$error" ]; then
            printf "\r\033[K${TASK_ID:-unknown} | ${TASK_PATH:-unknown} | %s | %s" "$status" "$error"
        else
            printf "\r\033[K${TASK_ID:-unknown} | ${TASK_PATH:-unknown} | %s | " "$status"
        fi
    fi
}

if [ "$DEBUG_MODE" = "1" ]; then
    [ "$REPORT" != "1" ] && echo "🔧 DEBUG MODE ENABLED - Script will continue on failures"
else
    set -e  # Exit on error only if not in debug mode
fi

[ "$REPORT" != "1" ] && echo "=== Docker Entry Point - Starting CI/CD Pipeline ==="

# Initialize status display for report mode
update_status "Starting..."

# Track failed steps
FAILED_STEPS=()
FAILED_STEP=""

# Function to run a step and handle errors
run_step() {
    local step_name="$1"
    local command="$2"
    
    # Update status to show current step
    update_status "Running $step_name"
    
    if [ "$REPORT" != "1" ]; then
        echo ""
        echo "=== $step_name ==="
    fi

    local success=true

    if [ "$DEBUG_MODE" = "1" ]; then
        # In debug mode, capture exit code but continue
        if [ "$REPORT" = "1" ]; then
            # Run command silently in report mode, capture error
            local error_output
            error_output=$(eval "$command" 2>&1)
            if [ $? -eq 0 ]; then
                [ "$REPORT" != "1" ] && echo "✅ $step_name completed successfully"
                write_to_csv "$step_name completed" ""
            else
                local exit_code=$?
                [ "$REPORT" != "1" ] && echo "❌ $step_name failed with exit code: $exit_code"
                FAILED_STEPS+=("$step_name (exit code: $exit_code)")
                FAILED_STEP="$step_name"
                update_status "Failed" "$step_name"
                write_to_csv "$step_name failed" "Exit code: $exit_code | $error_output"
                success=false
            fi
        else
            # Normal debug mode with output
            if eval "$command"; then
                echo "✅ $step_name completed successfully"
                write_to_csv "$step_name completed" ""
            else
                local exit_code=$?
                echo "❌ $step_name failed with exit code: $exit_code"
                FAILED_STEPS+=("$step_name (exit code: $exit_code)")
                write_to_csv "$step_name failed" "Exit code: $exit_code"
                success=false
            fi
        fi
    else
        # Normal mode - let errors propagate
        if [ "$REPORT" = "1" ]; then
            # Run command silently in report mode, capture error
            local error_output
            error_output=$(eval "$command" 2>&1)
            if [ $? -ne 0 ]; then
                FAILED_STEP="$step_name"
                update_status "Failed" "$step_name"
                write_to_csv "$step_name failed" "Command failed in normal mode | $error_output"
                exit 1
            else
                write_to_csv "$step_name completed" ""
            fi
        else
            local error_output
            error_output=$(eval "$command" 2>&1)
            if [ $? -eq 0 ]; then
                echo "✅ $step_name completed successfully"
                write_to_csv "$step_name completed" ""
            else
                write_to_csv "$step_name failed" "Command failed in normal mode | $error_output"
                exit 1
            fi
        fi
    fi

   # The function now returns success status
    if [ "$success" = true ]; then
        return 0
    else
        return 1
    fi
}

# Set up AWS credentials if they exist
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    [ "$REPORT" != "1" ] && echo "Setting up AWS credentials from environment variables..."
    update_status "Setting up AWS..."
    export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
    
    # Set optional AWS environment variables if provided
    [ -n "$AWS_SESSION_TOKEN" ] && export AWS_SESSION_TOKEN="$AWS_SESSION_TOKEN"
    [ -n "$AWS_DEFAULT_REGION" ] && export AWS_DEFAULT_REGION="$AWS_DEFAULT_REGION"
    [ -n "$AWS_REGION" ] && export AWS_REGION="$AWS_REGION"
    [ -n "$AWS_PROFILE" ] && export AWS_PROFILE="$AWS_PROFILE"
    
    [ "$REPORT" != "1" ] && echo "AWS credentials configured successfully"
    
    # Verify AWS CLI is configured and ready
    if [ "$REPORT" != "1" ]; then
        echo "Verifying AWS CLI configuration..."
        if aws sts get-caller-identity >/dev/null 2>&1; then
            echo "AWS CLI is configured and ready to use"
        else
            echo "WARNING: AWS CLI configuration test failed"
            echo "Please check your AWS credentials and permissions"
        fi
    fi
    
    # Ensure required S3 buckets exist
    [ "$REPORT" != "1" ] && echo "Ensuring required S3 buckets exist..."
    update_status "Creating S3 buckets..."

    # Define bucket-region pairs
    declare -A BUCKETS=(
        ["iac-rlhf-cfn-states-$CURRENT_ACCOUNT_ID"]="us-east-1"
        ["iac-rlhf-cfn-states-ap-northeast-1-$CURRENT_ACCOUNT_ID"]="ap-northeast-1"
        ["iac-rlhf-cfn-states-ap-south-1-$CURRENT_ACCOUNT_ID"]="ap-south-1"
        ["iac-rlhf-cfn-states-ap-southeast-1-$CURRENT_ACCOUNT_ID"]="ap-southeast-1"
        ["iac-rlhf-cfn-states-ap-southeast-2-$CURRENT_ACCOUNT_ID"]="ap-southeast-2"
        ["iac-rlhf-cfn-states-eu-central-1-$CURRENT_ACCOUNT_ID"]="eu-central-1"
        ["iac-rlhf-cfn-states-eu-north-1-$CURRENT_ACCOUNT_ID"]="eu-north-1"
        ["iac-rlhf-cfn-states-eu-west-1-$CURRENT_ACCOUNT_ID"]="eu-west-1"
        ["iac-rlhf-cfn-states-eu-west-2-$CURRENT_ACCOUNT_ID"]="eu-west-2"
        ["iac-rlhf-cfn-states-eu-west-3-$CURRENT_ACCOUNT_ID"]="eu-west-3"
        ["iac-rlhf-cfn-states-us-east-1-$CURRENT_ACCOUNT_ID"]="us-east-1"
        ["iac-rlhf-cfn-states-us-east-2-$CURRENT_ACCOUNT_ID"]="us-east-2"
        ["iac-rlhf-cfn-states-us-west-1-$CURRENT_ACCOUNT_ID"]="us-west-1"
        ["iac-rlhf-cfn-states-us-west-2-$CURRENT_ACCOUNT_ID"]="us-west-2"
        ["iac-rlhf-pulumi-states-$CURRENT_ACCOUNT_ID"]="us-east-1"
        ["iac-rlhf-tf-states-$CURRENT_ACCOUNT_ID"]="us-east-1"
    )
    
    # Buckets that need versioning enabled
    VERSIONED_BUCKETS=("iac-rlhf-pulumi-states-$CURRENT_ACCOUNT_ID" "iac-rlhf-tf-states-$CURRENT_ACCOUNT_ID")

    # Function to enable versioning on a bucket
    enable_versioning() {
        local bucket_name=$1
        local region=$2
        if aws s3api get-bucket-versioning --bucket "$bucket_name" --region "$region" >/dev/null 2>&1 | grep -q 'Enabled'; then
            [ "$REPORT" != "1" ] && echo "✅ Versioning already enabled on $bucket_name in $region"
        else
            [ "$REPORT" != "1" ] && echo "Enabling versioning on bucket $bucket_name in region $region..."
            if aws s3api put-bucket-versioning --bucket "$bucket_name" --region "$region" --versioning-configuration Status=Enabled >/dev/null 2>&1; then
                [ "$REPORT" != "1" ] && echo "✅ Versioning enabled on $bucket_name"
            else
                [ "$REPORT" != "1" ] && echo "❌ Failed to enable versioning on $bucket_name"
            fi
        fi
    }

    # Create buckets if they don't exist
    for bucket in "${!BUCKETS[@]}"; do
        region="${BUCKETS[$bucket]}"

        # Check if bucket exists
        if aws s3api head-bucket --bucket "$bucket" --region "$region" >/dev/null 2>&1; then
            [ "$REPORT" != "1" ] && echo "✅ Bucket $bucket already exists in $region"
        else
            [ "$REPORT" != "1" ] && echo "Creating bucket $bucket in region $region..."

            MAX_RETRIES=3
            RETRY_DELAY=5  # seconds

            if [ "$region" = "us-east-1" ]; then
                # us-east-1 doesn't need LocationConstraint
                for ((i=1; i<=MAX_RETRIES; i++)); do
                    if aws s3api create-bucket --bucket "$bucket" --region "$region" >/dev/null; then
                        [ "$REPORT" != "1" ] && echo "✅ Created bucket $bucket in $region"
                        # Add tagging after successful creation
                        aws s3api put-bucket-tagging --bucket "$bucket" --region "$region" --tagging 'TagSet=[{Key=NUKE_RETAIN,Value=true}]' >/dev/null 2>&1
                        break # Success, exit retry loop
                    else
                        [ "$REPORT" != "1" ] && echo "❌ Failed to create bucket $bucket in $region (Attempt $i/$MAX_RETRIES)"
                        if [ $i -eq $MAX_RETRIES ]; then
                            [ "$REPORT" != "1" ] && echo "❌ All retries failed. Exiting."
                            if [ "$DEBUG_MODE" = "0" ]; then
                                exit 1
                            fi
                        fi
                        sleep "$RETRY_DELAY"
                    fi
                done
            else
                # Other regions need LocationConstraint
                for ((i=1; i<=MAX_RETRIES; i++)); do
                    if aws s3api create-bucket --bucket "$bucket" --region "$region" --create-bucket-configuration LocationConstraint="$region" >/dev/null; then
                        [ "$REPORT" != "1" ] && echo "✅ Created bucket $bucket in $region"
                        # Add tagging after successful creation
                        aws s3api put-bucket-tagging --bucket "$bucket" --region "$region" --tagging 'TagSet=[{Key=NUKE_RETAIN,Value=true}]' >/dev/null 2>&1
                        break # Success, exit retry loop
                    else
                        [ "$REPORT" != "1" ] && echo "❌ Failed to create bucket $bucket in $region (Attempt $i/$MAX_RETRIES)"
                        if [ $i -eq $MAX_RETRIES ]; then
                            [ "$REPORT" != "1" ] && echo "❌ All retries failed. Exiting."
                            if [ "$DEBUG_MODE" = "0" ]; then
                                exit 1
                            fi
                        fi
                        sleep "$RETRY_DELAY"
                    fi
                done
            fi
        fi

        # Enable versioning if bucket is in the versioned list
        if [[ " ${VERSIONED_BUCKETS[@]} " =~ " ${bucket} " ]]; then
            enable_versioning "$bucket" "$region"
        fi
    done

    [ "$REPORT" != "1" ] && echo "S3 bucket setup completed"
    write_to_csv "S3 bucket setup completed" ""
else
    [ "$REPORT" != "1" ] && echo "No AWS credentials found in environment variables"
    [ "$REPORT" != "1" ] && echo "AWS CLI will not be available for use"
    write_to_csv "No AWS credentials found" "AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not set"
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

# export it to be available across whole environment
export ENVIRONMENT_SUFFIX

if [ "$REPORT" != "1" ]; then
    echo "Environment configuration:"
    echo "  ENVIRONMENT_SUFFIX: $ENVIRONMENT_SUFFIX"
    echo "  CI: $CI"
fi

# Export STATE BUCKETS
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states-$CURRENT_ACCOUNT_ID"
export PULUMI_BACKEND_URL="s3://iac-rlhf-pulumi-states-$CURRENT_ACCOUNT_ID"

# Update status for task extraction
update_status "Extracting task..."

# If arguments are provided, execute them instead of the pipeline
if [ $# -gt 0 ]; then
    [ "$REPORT" != "1" ] && echo "Executing provided command: $*"
    exec "$@"
fi

# Extract task from archive
cp -r archive/"$TASK_PATH"/* ./
[ "$REPORT" != "1" ] && echo "Extracted task from archive: $TASK_PATH"
update_status "Reading metadata..."

# Check if metadata.json exists
if [ ! -f "metadata.json" ]; then
    echo "❌ metadata.json not found - cannot proceed with CI/CD pipeline"
    echo "Either provide metadata.json or pass a command to execute"
    exit 1
fi

# Read project metadata
PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
[ "$REPORT" != "1" ] && echo "Detected project: platform=$PLATFORM, language=$LANGUAGE"

# Set CFN_S3_BUCKET. If lib/AWS_REGION is present, use the region there. If not use us-east-1
if [ -f "lib/AWS_REGION" ]; then
    region="$(cat lib/AWS_REGION)"
    export AWS_REGION="$region"
    export AWS_DEFAULT_REGION="$region"
else
    region="us-east-1"
fi

export CFN_S3_BUCKET="iac-rlhf-cfn-states-$region-$CURRENT_ACCOUNT_ID"

# Execute CI/CD pipeline steps in order
if [ "$REPORT" != "1" ]; then
    echo ""
    echo "Starting CI/CD pipeline execution..."
fi

update_status "Starting pipeline..."

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
DEPLOY_SUCCESS=$?

# STEP 6: INTEGRATION TESTS
if [ "$DEPLOY_SUCCESS" -eq 0 ]; then
    run_step "STEP 6: INTEGRATION TESTS" "./scripts/integration-tests.sh"
else
    echo "❌ Deployment failed. Skipping integration tests."
    # Log the skip to the CSV file
    write_to_csv "STEP 6: INTEGRATION TESTS skipped" "Deployment failed"
    # Add a note to the FAILED_STEPS for reporting if in debug mode
    if [ "$DEBUG_MODE" = "1" ]; then
        FAILED_STEPS+=("STEP 6: INTEGRATION TESTS (skipped)")
    fi
fi

# STEP 7: DESTROY (Optional)
run_step "STEP 7: DESTROY (Optional)" "./scripts/destroy.sh"

if [ "$REPORT" != "1" ]; then
    echo ""
    echo "=== CI/CD Pipeline Execution Complete ==="
fi

# Report results
if [ "$DEBUG_MODE" = "1" ] && [ ${#FAILED_STEPS[@]} -gt 0 ]; then
    # Check if only integration tests and/or lint failed
    NON_CRITICAL_ONLY=true
    for step in "${FAILED_STEPS[@]}"; do
        if [[ "$step" != *"STEP 6: INTEGRATION TESTS"* ]] && [[ "$step" != *"STEP 3: LINT"* ]]; then
            NON_CRITICAL_ONLY=false
            break
        fi
    done
    
    if [ "$NON_CRITICAL_ONLY" = "true" ]; then
        # Only non-critical steps failed - log error but don't fail the task
        if [ "$REPORT" = "1" ]; then
            update_status "Success" "Non-critical steps failed - logged in error column"
            printf "\n"
        else
            echo ""
            echo "⚠️  SUMMARY: Non-critical steps failed but pipeline completed:"
            for step in "${FAILED_STEPS[@]}"; do
                echo "   - $step (error logged)"
            done
            echo ""
            echo "Task completed successfully - non-critical step errors logged for analysis"
        fi
        write_to_csv "Pipeline completed with non-critical step errors" "$(IFS=', '; echo "${FAILED_STEPS[*]}")"
        exit 0
    else
        # Other steps failed - fail the task
        if [ "$REPORT" = "1" ]; then
            update_status "Fail" "$(IFS=', '; echo "${FAILED_STEPS[*]}")"
            printf "\n"
        else
            echo ""
            echo "⚠️  SUMMARY: The following steps failed:"
            for step in "${FAILED_STEPS[@]}"; do
                echo "   - $step"
            done
            echo ""
            echo "Exit with failure code since some steps failed"
        fi
        write_to_csv "Pipeline failed" "$(IFS=', '; echo "${FAILED_STEPS[*]}")"
        exit 1
    fi
elif [ ${#FAILED_STEPS[@]} -eq 0 ]; then
    if [ "$REPORT" = "1" ]; then
        update_status "Success" ""
        printf "\n"
    else
        echo "✅ All pipeline steps completed successfully!"
    fi
    write_to_csv "Pipeline completed successfully" ""
else
    if [ "$REPORT" = "1" ]; then
        update_status "Success" ""
        printf "\n"
    else
        echo "=== CI/CD Pipeline Completed Successfully ==="
    fi
    write_to_csv "Pipeline completed successfully" ""
fi