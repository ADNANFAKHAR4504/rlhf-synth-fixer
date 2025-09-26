#!/bin/bash

# Parallel Script to process tasks.json and run docker containers for each task

# Configuration - override with environment variables
MAX_PARALLEL_JOBS=${MAX_PARALLEL_JOBS:-6}
BATCH_SIZE=${BATCH_SIZE:-20}

# Job tracking
declare -a JOB_PIDS=()
JOB_COUNT=0

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install jq."
    exit 1
fi

# Check if aws-nuke is installed, install if not
if ! command -v aws-nuke &> /dev/null; then
    echo "aws-nuke not found. Installing aws-nuke..."

    # Detect architecture
    ARCH=$(uname -m)
    if [[ "$ARCH" == "x86_64" ]]; then
        ARCH="amd64"
    elif [[ "$ARCH" == "aarch64" ]]; then
        ARCH="arm64"
    fi

    # Download and install aws-nuke
    AWS_NUKE_VERSION="v3.29.5"
    AWS_NUKE_URL="https://github.com/ekristen/aws-nuke/releases/download/${AWS_NUKE_VERSION}/aws-nuke-${AWS_NUKE_VERSION}-linux-${ARCH}.tar.gz"

    echo "Downloading aws-nuke from $AWS_NUKE_URL"
    curl -L "$AWS_NUKE_URL" -o aws-nuke.tar.gz
    tar -xzf aws-nuke.tar.gz
    sudo mv aws-nuke /usr/local/bin/
    rm aws-nuke.tar.gz

    echo "aws-nuke installed successfully."
fi

# Path to the JSON file
JSON_FILE="./tasks.json"

# Check if the JSON file exists
if [ ! -f "$JSON_FILE" ]; then
    echo "Error: $JSON_FILE not found."
    exit 1
fi

# Find the zip file with pattern turing-iac-tasks-processor-dockerfile-*.zip
ZIP_FILE=$(ls turing-iac-tasks-processor-dockerfile-*.zip 2>/dev/null | head -n 1)
if [ -z "$ZIP_FILE" ]; then
    echo "Error: No turing-iac-tasks-processor-dockerfile-*.zip file found."
    exit 1
fi
echo "Found zip file: $ZIP_FILE"

# Extract directory name from zip file (remove .zip extension)
DOCKERFILE_DIR="${ZIP_FILE%.zip}"

# Check if the dockerfile directory exists, extract if not
if [ ! -d "$DOCKERFILE_DIR" ]; then
    echo "Extracting dockerfile from $ZIP_FILE..."
    unzip -q -d "$DOCKERFILE_DIR" "$ZIP_FILE"
fi

# Check if AWS_ACCOUNT_ID environment variable is set
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "Error: AWS_ACCOUNT_ID environment variable is not set."
    echo "Please set your AWS Account ID as an environment variable:"
    echo "  export AWS_ACCOUNT_ID=123456789012"
    echo "Replace 123456789012 with your actual AWS account ID."
    exit 1
fi

# Prepare aws-nuke configuration file with provided AWS account ID
NUKE_CONFIG="aws-nuke-config.yaml"
NUKE_CONFIG_RUNTIME="aws-nuke-config-runtime.yaml"

echo "Preparing aws-nuke configuration for account $AWS_ACCOUNT_ID..."

# Verify the provided account ID matches current AWS credentials
CURRENT_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

if [ "$AWS_ACCOUNT_ID" != "$CURRENT_ACCOUNT_ID" ]; then
    echo "Error: Account ID mismatch!"
    echo "  Environment variable AWS_ACCOUNT_ID: $AWS_ACCOUNT_ID"
    echo "  Current AWS credentials account: $CURRENT_ACCOUNT_ID"
    echo "Please ensure AWS_ACCOUNT_ID matches your current AWS account."
    exit 1
fi

# Copy the template config and substitute account ID
sed "s/AWS_ACCOUNT_ID_PLACEHOLDER/$AWS_ACCOUNT_ID/g" "$NUKE_CONFIG" > "$NUKE_CONFIG_RUNTIME"
echo "Runtime aws-nuke configuration file created."

# Build Docker image once for all tasks
echo "Building Docker image for all tasks..."
if ! (cd "$DOCKERFILE_DIR" && docker build -t tap-app:worker .); then
#if ! (cd "$DOCKERFILE_DIR" && docker build -t tap-app:worker . &>/dev/null); then
    echo "Error: Failed to build Docker image."
    exit 1
fi
echo "Docker image built successfully."

# Get the number of tasks
TASK_COUNT=$(jq '.workitems | length' "$JSON_FILE")

echo "Found $TASK_COUNT tasks in $JSON_FILE"
echo "Using $MAX_PARALLEL_JOBS parallel workers"
echo ""
echo "TASK_ID                          | TASK_PATH    | STATUS           | ERROR"
echo "---------------------------------|--------------|------------------|-------"

# CSV file for task reporting
CSV_FILE="${CSV_FILE:-./task_reports.csv}"

# Initialize CSV file with header if it doesn't exist
if [ ! -f "$CSV_FILE" ]; then
    echo "TIMESTAMP,TASK_ID,TASK_PATH,STATUS,ERROR" > "$CSV_FILE"
fi

# Function to acquire lock (cross-platform)
acquire_lock() {
    local lockdir="$CSV_FILE.lock"
    local timeout=30
    local count=0

    while ! mkdir "$lockdir" 2>/dev/null; do
        sleep 0.1
        count=$((count + 1))
        if [ $count -gt $((timeout * 10)) ]; then
            echo "Error: Could not acquire lock after ${timeout}s" >&2
            return 1
        fi
    done
    echo $$ > "$lockdir/pid"
}

# Function to release lock
release_lock() {
    local lockdir="$CSV_FILE.lock"
    rm -rf "$lockdir" 2>/dev/null
}

# Function to write to CSV with file locking
write_to_csv() {
    local status="$1"
    local error="${2:-}"
    local work_item_id="${3:-unknown}"
    local task_path="${4:-unknown}"
    local timestamp
    timestamp=$(date -Iseconds)

    # Escape commas and quotes in the error field
    local escaped_error=""
    if [ -n "$error" ]; then
        escaped_error=$(echo "$error" | sed 's/"/\"\"/g' | sed 's/,/\\,/g')
    fi

    # Write the row with directory-based locking
    if acquire_lock; then
        echo "$timestamp,$work_item_id,$task_path,$status,\"$escaped_error\"" >> "$CSV_FILE"
        release_lock
    else
        # Fallback: write without locking (may cause issues in high concurrency)
        echo "$timestamp,$work_item_id,$task_path,$status,\"$escaped_error\"" >> "$CSV_FILE"
    fi
}

# Function to update status display and CSV
update_status() {
    local status="$1"
    local error="${2:-}"
    local work_item_id="${3:-unknown}"
    local task_path="${4:-unknown}"

    # Write to CSV
    write_to_csv "$status" "$error" "$work_item_id" "$task_path"

    # Update display
    if [ -n "$error" ]; then
        printf "${work_item_id} | ${task_path} | %s | %s\n" "$status" "$error"
    else
        printf "${work_item_id} | ${task_path} | %s |\n" "$status"
    fi
}

# Function to process a single task
process_task() {
    local task_index=$1
    local task_data=$(jq -c ".workitems[$task_index]" "$JSON_FILE")

    # Extract task information
    local TASK_ID=$(echo "$task_data" | jq -r '."4bafac7c-465e-46b5-accb-4ee55255a739"[0].metadata.taskId')
    local WORK_ITEM_ID=$(echo "$task_data" | jq -r '.workItemId')

    if [ -z "$TASK_ID" ] || [ "$TASK_ID" = "null" ]; then
        update_status "SKIPPED" "Could not extract taskId" "$WORK_ITEM_ID" "unknown"
        return
    fi

    # Extract TASK_PATH (everything before the last slash)
    local TASK_PATH=$(echo "$TASK_ID" | sed -E 's|^(.*)/[^/]*$|\1|')

    # If sed didn't change anything (no slash found), try other patterns
    if [ "$TASK_PATH" = "$TASK_ID" ]; then
        TASK_PATH=$(echo "$TASK_ID" | sed -E 's|^(.+)/[^/]+$|\1|')
        if [ "$TASK_PATH" = "$TASK_ID" ]; then
            TASK_PATH=$(echo "$TASK_ID" | sed -E 's|(.+)/.+|\1|')
            if [ "$TASK_PATH" = "$TASK_ID" ]; then
                TASK_PATH=$(echo "$TASK_ID" | awk -F/ '{print $1"/"$2}')
            fi
        fi
    fi

    # Check if TASK_PATH is empty or equals TASK_ID
    if [ -z "$TASK_PATH" ] || [ "$TASK_PATH" = "$TASK_ID" ]; then
        update_status "SKIPPED" "Could not extract valid TASK_PATH" "$WORK_ITEM_ID" "$TASK_PATH"
        return
    fi

    update_status "STARTING" "" "$WORK_ITEM_ID" "$TASK_PATH"

    # Create unique container name
    local CONTAINER_NAME="task-processor-${TASK_ID//\//-}-$$-$task_index"

    # Remove existing container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        update_status "CLEANUP" "Removing existing container" "$WORK_ITEM_ID" "$TASK_PATH"
        docker rm -f "$CONTAINER_NAME" &>/dev/null
    fi

    # Run the docker container
    update_status "RUNNING" "" "$WORK_ITEM_ID" "$TASK_PATH"

    if docker run --rm \
        --name "$CONTAINER_NAME" \
        -v "$(pwd)/task_reports.csv:/app/task_reports.csv" \
        -e AWS_ACCESS_KEY_ID="$(aws configure get aws_access_key_id)" \
        -e AWS_SECRET_ACCESS_KEY="$(aws configure get aws_secret_access_key)" \
        -e AWS_DEFAULT_REGION="us-east-1" \
        -e CURRENT_ACCOUNT_ID="$CURRENT_ACCOUNT_ID" \
        -e TASK_PATH="$TASK_PATH" \
        -e TASK_ID="$WORK_ITEM_ID" \
        -e REPORT="1" \
        -e DEBUG_MODE="1" \
        tap-app:worker &>/dev/null; then
        update_status "COMPLETED" "" "$WORK_ITEM_ID" "$TASK_PATH"
    else
        update_status "FAILED" "Task Execution Failed" "$WORK_ITEM_ID" "$TASK_PATH"
    fi
}

# Function to wait for available job slot
wait_for_slot() {
    while [ ${#JOB_PIDS[@]} -ge $MAX_PARALLEL_JOBS ]; do
        # Check for completed jobs
        local new_pids=()
        for pid in "${JOB_PIDS[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                new_pids+=("$pid")
            fi
        done
        JOB_PIDS=("${new_pids[@]}")

        # Small delay to avoid busy waiting
        sleep 0.1
    done
}

# Function to cleanup batch of jobs
cleanup_batch() {
    local batch_num=$1
    echo ""
    echo "Running aws-nuke cleanup after processing batch $batch_num..."
    local NUKE_REPORT_FILE="aws-nuke-report-batch-$batch_num.txt"

    if ! aws-nuke run --config "$NUKE_CONFIG_RUNTIME" --no-alias-check --no-dry-run --force > "$NUKE_REPORT_FILE" 2>&1; then
        echo "Warning: aws-nuke cleanup encountered issues after batch $batch_num (see $NUKE_REPORT_FILE)"
    else
        echo "Batch $batch_num cleanup completed successfully"
    fi
    echo ""
}

# Process tasks with parallel execution
echo "Processing tasks with up to $MAX_PARALLEL_JOBS parallel workers..."

for ((i=0; i<TASK_COUNT; i++)); do
    # Wait for available slot
    wait_for_slot

    # Launch task in background
    process_task $i &
    pid=$!
    JOB_PIDS+=("$pid")

    # Run cleanup every BATCH_SIZE tasks
    if (( (i + 1) % BATCH_SIZE == 0 )); then
        # Wait for current batch to complete
        for pid in "${JOB_PIDS[@]}"; do
            wait "$pid" 2>/dev/null
        done
        JOB_PIDS=()

        cleanup_batch $((i + 1))
    fi
done

# Wait for all remaining jobs to complete
echo ""
echo "Waiting for remaining tasks to complete..."
for pid in "${JOB_PIDS[@]}"; do
    wait "$pid" 2>/dev/null
done

echo ""
echo "All tasks processed."

# Clean up Docker image
echo "Cleaning up Docker image..."
if docker image inspect tap-app:worker &>/dev/null; then
    docker rmi tap-app:worker &>/dev/null
    echo "Docker image removed."
fi

# Run final aws-nuke cleanup
echo "Running final aws-nuke cleanup after processing all $TASK_COUNT tasks..."
FINAL_NUKE_REPORT_FILE="aws-nuke-report-final.txt"
if ! aws-nuke run --config "$NUKE_CONFIG_RUNTIME" --no-alias-check --no-dry-run --force > "$FINAL_NUKE_REPORT_FILE" 2>&1; then
    echo "Warning: final aws-nuke cleanup encountered issues (see $FINAL_NUKE_REPORT_FILE)"
else
    echo "Final aws-nuke cleanup completed successfully (report saved to $FINAL_NUKE_REPORT_FILE)"
fi

echo ""
echo "Parallel processing complete!"
echo "Task reports available in: $CSV_FILE"