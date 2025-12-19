#!/bin/bash

# Script to process tasks.json and run docker containers for each task

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

# Get the number of tasks
TASK_COUNT=$(jq '.workitems | length' "$JSON_FILE")

echo "Found $TASK_COUNT tasks in $JSON_FILE"
echo "TASK_ID                          | TASK_PATH    | STATUS           | ERROR"
echo "---------------------------------|--------------|------------------|-------"

# CSV file for task reporting
CSV_FILE="${CSV_FILE:-./task_reports.csv}"

# Function to write to CSV
write_to_csv() {
    local status="$1"
    local error="${2:-}"
    local timestamp
    timestamp=$(date -Iseconds)
    
    # Create CSV header if file doesn't exist
    if [ ! -f "$CSV_FILE" ]; then
        echo "TIMESTAMP,TASK_ID,TASK_PATH,STATUS,ERROR" > "$CSV_FILE"
    fi
    
    # Escape commas and quotes in the error field
    local escaped_error=""
    if [ -n "$error" ]; then
        escaped_error=$(echo "$error" | sed 's/"/\"\"/g' | sed 's/,/\\,/g')
    fi
    
    # Write the row
    echo "$timestamp,${WORK_ITEM_ID:-unknown},${TASK_PATH:-unknown},$status,\"$escaped_error\"" >> "$CSV_FILE"
}

update_status() {
    local status="$1"
    local error="${2:-}"
    
    # Write to CSV
    write_to_csv "$status" "$error"
    
    if [ -n "$error" ]; then
        printf "\r\033[K${WORK_ITEM_ID:-unknown} | ${TASK_PATH:-unknown} | %s | %s" "$status" "$error"
    else
        printf "\r\033[K${WORK_ITEM_ID:-unknown} | ${TASK_PATH:-unknown} | %s | " "$status"
    fi
}

# Process each task
for ((i=0; i<TASK_COUNT; i++)); do
    # echo "Processing task $((i+1)) of $TASK_COUNT..."
    
    # Extract task ID path from the JSON
    TASK_ID=$(jq -r ".workitems[$i][\"4bafac7c-465e-46b5-accb-4ee55255a739\"][0].metadata.taskId" "$JSON_FILE")
    WORK_ITEM_ID=$(jq -r ".workitems[$i].workItemId" "$JSON_FILE")
    
    if [ -z "$TASK_ID" ] || [ "$TASK_ID" = "null" ]; then
        echo "Warning: Could not extract taskId for task $((i+1)). Skipping."
        continue
    fi
    
    # echo "Task ID: $TASK_ID"
    
    # Extract TASK_PATH (everything before the last slash)
    TASK_PATH=$(echo "$TASK_ID" | sed -E 's|^(.*)/[^/]*$|\1|')
    
    # If sed didn't change anything (no slash found), take everything before the last segment
    if [ "$TASK_PATH" = "$TASK_ID" ]; then
        TASK_PATH=$(echo "$TASK_ID" | sed -E 's|^(.+)/[^/]+$|\1|')
        # If still no match, try another pattern
        if [ "$TASK_PATH" = "$TASK_ID" ]; then
            TASK_PATH=$(echo "$TASK_ID" | sed -E 's|(.+)/.+|\1|')
            # If still no match, use first two segments
            if [ "$TASK_PATH" = "$TASK_ID" ]; then
                # Split by "/" and take first two segments
                TASK_PATH=$(echo "$TASK_ID" | awk -F/ '{print $1"/"$2}')
            fi
        fi
    fi
    
    # echo "Task Path: $TASK_PATH"
    
    # Check if TASK_PATH is empty or equals TASK_ID
    if [ -z "$TASK_PATH" ] || [ "$TASK_PATH" = "$TASK_ID" ]; then
        echo "Warning: Could not extract a valid TASK_PATH from $TASK_ID. Skipping."
        continue
    fi
    
    # Remove existing Docker image if it exists
    if docker image inspect tap-app:worker &>/dev/null; then
        # echo "Removing existing Docker image..."
        update_status "Removing existing Docker image..."
        docker rmi tap-app:worker &>/dev/null
    fi
    
    # Build fresh Docker image for this task
    # echo "Building fresh Docker image for task $TASK_ID..."
    update_status "Building Docker image..."
    if ! (cd "$DOCKERFILE_DIR" && docker build -t tap-app:worker . &>/dev/null); then
        echo "Error: Failed to build Docker image for task $TASK_ID."
        continue
    fi
    # echo "Docker image built successfully."
    
    # Run the docker container
    # echo "Running docker container for $TASK_PATH..."
    
    # Check if a container with the same name already exists and remove it
    CONTAINER_NAME="task-processor-${TASK_ID//\//-}"
    if docker ps -a --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
        update_status "Removing existing container $CONTAINER_NAME"
        docker rm -f "$CONTAINER_NAME"
    fi

    # Ensure CSV file exists on host before mounting
    if [ ! -f "./task_reports.csv" ]; then
        echo "TIMESTAMP,TASK_ID,TASK_PATH,STATUS,ERROR" > "./task_reports.csv"
    fi

    docker run --rm \
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
        tap-app:worker
    # Remove Docker image after processing this task
    # echo "Removing Docker image after task completion..."
    if docker image inspect tap-app:worker &>/dev/null; then
        docker rmi tap-app:worker &>/dev/null
        # echo "Docker image removed."
    fi
    
    # Run aws-nuke every 30 tasks
    if (( (i + 1) % 30 == 0 )); then
        echo "Running aws-nuke cleanup after processing $((i + 1)) tasks..."
        NUKE_REPORT_FILE="aws-nuke-report-batch-$((i + 1)).txt"
        if ! aws-nuke run --config "$NUKE_CONFIG_RUNTIME" --no-alias-check --no-dry-run --force > "$NUKE_REPORT_FILE" 2>&1; then
            echo -e "\nWarning: aws-nuke cleanup encountered issues after $((i + 1)) tasks (see $NUKE_REPORT_FILE)"
        fi
    fi
    
    # echo "-----------------------------------"
done

echo "All tasks processed."

# Run final aws-nuke cleanup at the end
echo "Running final aws-nuke cleanup after processing all $TASK_COUNT tasks..."
FINAL_NUKE_REPORT_FILE="aws-nuke-report-final.txt"
if ! aws-nuke run --config "$NUKE_CONFIG_RUNTIME" --no-alias-check --no-dry-run --force > "$FINAL_NUKE_REPORT_FILE" 2>&1; then
    echo "Warning: final aws-nuke cleanup encountered issues (see $FINAL_NUKE_REPORT_FILE)"
else
    echo "Final aws-nuke cleanup completed successfully (report saved to $FINAL_NUKE_REPORT_FILE)"
fi