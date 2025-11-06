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

# Change to lib directory where Terraform files are
cd "$PROJECT_ROOT/lib"

# Check if Terraform is initialized
if [ ! -d ".terraform" ]; then
    echo "❌ Terraform not initialized. Run 'terraform init' first."
    exit 1
fi

# Extract outputs to JSON and flatten them
# Terraform output -json returns: {"key": {"value": "actual_value", "type": "string", "sensitive": bool}}
# We need: {"key": "actual_value"}
# Note: Use terraform output -json (not --json) to include sensitive outputs in the JSON

echo "🔍 Extracting Terraform outputs (including sensitive values)..."
if terraform output -json > "$OUTPUT_DIR/temp-outputs.json" 2>&1; then
    # Check if output file has any content
    if [ ! -s "$OUTPUT_DIR/temp-outputs.json" ] || [ "$(cat "$OUTPUT_DIR/temp-outputs.json")" = "{}" ]; then
        echo "⚠️  Warning: No outputs found in Terraform state"
        echo "   This usually means:"
        echo "   1. Terraform apply hasn't been run yet"
        echo "   2. No output blocks are defined in *.tf files"
        echo "   3. All outputs failed to evaluate (resource errors)"
        echo ""
        echo "   Checking Terraform state..."
        terraform show -json > "$OUTPUT_DIR/state-debug.json" 2>&1 || true
        echo "   State file written to: $OUTPUT_DIR/state-debug.json"
        echo ""
        # Create empty outputs file for tests to detect
        echo "{}" > "$OUTPUT_FILE"
        exit 1
    fi

    # Flatten the outputs by extracting just the values
    # Handle both string values and JSON array/object values
    # This works for both sensitive and non-sensitive outputs
    jq 'with_entries(.value =
        if .value.value | type == "string" then
            .value.value
        elif .value.value | type == "array" then
            .value.value | tojson
        elif .value.value | type == "object" then
            .value.value | tojson
        else
            .value.value | tostring
        end
    )' "$OUTPUT_DIR/temp-outputs.json" > "$OUTPUT_FILE"

    rm "$OUTPUT_DIR/temp-outputs.json"

    echo "✅ Outputs extracted successfully to: $OUTPUT_FILE"
    echo ""
    echo "📊 Extracted outputs:"
    cat "$OUTPUT_FILE" | jq 'keys' || cat "$OUTPUT_FILE"
    echo ""

    # Check for critical missing outputs
    CRITICAL_OUTPUTS=("cluster_name" "cluster_endpoint" "cluster_certificate_authority_data" "oidc_provider_url" "oidc_provider_arn" "vpc_id")
    MISSING_OUTPUTS=()

    for output in "${CRITICAL_OUTPUTS[@]}"; do
        if ! jq -e "has(\"$output\")" "$OUTPUT_FILE" > /dev/null 2>&1; then
            MISSING_OUTPUTS+=("$output")
        fi
    done

    if [ ${#MISSING_OUTPUTS[@]} -gt 0 ]; then
        echo "⚠️  Warning: Critical outputs are missing:"
        printf '   - %s\n' "${MISSING_OUTPUTS[@]}"
        echo ""
        echo "   This may indicate:"
        echo "   1. Resources failed to create during terraform apply"
        echo "   2. Output definitions reference non-existent resources"
        echo "   3. Terraform state is incomplete or corrupted"
        echo ""
        echo "   Troubleshooting:"
        echo "   - Run: terraform plan -out=tfplan"
        echo "   - Check: terraform show"
        echo "   - Review: terraform state list"
        echo ""
    fi

    echo "🧪 You can now run integration tests:"
    echo "   npm test -- terraform.int.test.ts"
else
    echo "❌ Failed to extract outputs. Ensure Terraform has been applied."
    echo "   Run: cd lib && terraform apply"
    echo ""
    echo "   Error output:"
    cat "$OUTPUT_DIR/temp-outputs.json" 2>/dev/null || echo "   (no error details available)"
    exit 1
fi

