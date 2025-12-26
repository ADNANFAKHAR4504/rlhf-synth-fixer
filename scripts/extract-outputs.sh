#!/bin/bash
# Script to extract Terraform/CloudFormation outputs to flat-outputs.json for integration tests
# Usage: ./scripts/extract-outputs.sh
# Output: cfn-outputs/flat-outputs.json

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/cfn-outputs"
OUTPUT_FILE="$OUTPUT_DIR/flat-outputs.json"

echo "🔍 Extracting Terraform/CloudFormation outputs..."

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Detect project type and set appropriate directory
if [ -d "$PROJECT_ROOT/cdktf.out/stacks/tap" ]; then
    # CDKTF project
    TERRAFORM_DIR="$PROJECT_ROOT/cdktf.out/stacks/tap"
    echo "📦 Detected CDKTF project"
elif [ -d "$PROJECT_ROOT/lib/.terraform" ]; then
    # Regular Terraform project
    TERRAFORM_DIR="$PROJECT_ROOT/lib"
    echo "📦 Detected Terraform project"
else
    echo "⚠️ No Terraform state found, using empty outputs"
    echo "{}" > "$OUTPUT_FILE"
    exit 0
fi

# Change to Terraform directory
cd "$TERRAFORM_DIR"

# Check if Terraform is initialized
if [ ! -d ".terraform" ]; then
    echo "⚠️ Terraform not initialized. Using empty outputs."
    echo "{}" > "$OUTPUT_FILE"
    exit 0
fi

# Extract outputs to JSON and flatten them
# Terraform output -json returns: {"key": {"value": "actual_value", "type": "string"}}
# We need: {"key": "actual_value"}
if terraform output -json > "$OUTPUT_DIR/temp-outputs.json" 2>/dev/null; then
    # Flatten the outputs by extracting just the values
    # Handle both string values and JSON array/object values
    jq 'with_entries(.value =
        if .value.value | type == "string" then
            .value.value
        elif .value.value | type == "array" then
            .value.value
        elif .value.value | type == "object" then
            .value.value
        else
            .value.value | tostring
        end
    )' "$OUTPUT_DIR/temp-outputs.json" > "$OUTPUT_FILE"

    rm "$OUTPUT_DIR/temp-outputs.json"

    echo "✅ Outputs extracted successfully to: $OUTPUT_FILE"
    echo ""
    echo "📊 Extracted outputs:"
    cat "$OUTPUT_FILE" | jq '.' 2>/dev/null || cat "$OUTPUT_FILE"
    echo ""
else
    echo "⚠️ Failed to extract outputs. Using empty outputs."
    echo "{}" > "$OUTPUT_FILE"
    exit 0
fi

