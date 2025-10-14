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

# Extract outputs to JSON
if terraform output -json > "$OUTPUT_FILE" 2>/dev/null; then
    echo "✅ Outputs extracted successfully to: $OUTPUT_FILE"
    echo ""
    echo "📊 Extracted outputs:"
    cat "$OUTPUT_FILE" | jq 'keys' || cat "$OUTPUT_FILE"
    echo ""
    echo "🧪 You can now run integration tests:"
    echo "   npm test -- terraform.int.test.ts"
else
    echo "❌ Failed to extract outputs. Ensure Terraform has been applied."
    echo "   Run: cd lib && terraform apply"
    exit 1
fi

