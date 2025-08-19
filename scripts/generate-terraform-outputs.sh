#!/bin/bash

# generate-terraform-outputs.sh
# Generates Terraform outputs in the format expected by integration tests

set -e

echo "🔄 Generating Terraform outputs for integration tests..."

cd lib

# Check if Terraform is initialized and state exists
if [ ! -d ".terraform" ]; then
    echo "❌ Terraform not initialized. Please run './scripts/deploy-without-lock.sh' first."
    exit 1
fi

# Generate outputs
echo "📊 Extracting Terraform outputs..."
terraform output -json > ../tf-outputs/terraform-outputs.json

# Create the flat outputs format expected by tests
echo "🔨 Converting to flat format..."
cd ..

# Create the output directory if it doesn't exist
mkdir -p cfn-outputs

# Convert Terraform JSON outputs to flat format
node -e "
const fs = require('fs');
const terraformOutputs = JSON.parse(fs.readFileSync('tf-outputs/terraform-outputs.json', 'utf8'));

const flatOutputs = {};
for (const [key, value] of Object.entries(terraformOutputs)) {
    // Extract the actual value from Terraform output format
    flatOutputs[key] = value.value;
}

// Write to the file the tests expect
fs.writeFileSync('cfn-outputs/flat-outputs.json', JSON.stringify(flatOutputs, null, 2));
console.log('✅ Generated flat-outputs.json with', Object.keys(flatOutputs).length, 'outputs');
"

echo "✅ Terraform outputs generated successfully!"
echo "📁 Files created:"
echo "  - tf-outputs/terraform-outputs.json (raw Terraform format)"
echo "  - cfn-outputs/flat-outputs.json (flat format for tests)"
