#!/bin/bash

# Process CDK outputs into flat-outputs.json format
# This script converts cdk-outputs.json to the format expected by integration tests

set -e

echo "📊 Processing CDK outputs..."

# Ensure cfn-outputs directory exists
mkdir -p cfn-outputs

# Check if cdk-outputs.json exists
if [ ! -f "cfn-outputs/cdk-outputs.json" ]; then
  echo "⚠️ cdk-outputs.json not found, checking for existing outputs..."
  if [ -f "cfn-outputs/flat-outputs.json" ]; then
    echo "✅ flat-outputs.json already exists"
    exit 0
  else
    echo "❌ No CDK outputs found"
    exit 1
  fi
fi

echo "✅ Found cdk-outputs.json, processing..."

# Initialize flat-outputs.json
echo "{}" > cfn-outputs/flat-outputs.json

# Process CDK outputs: { "StackName": { "OutputKey": "OutputValue", ... }, ... }
# Extract all outputs from all stacks and flatten them
jq -r 'to_entries[] | .value | to_entries[] | "\(.key)=\(.value)"' cfn-outputs/cdk-outputs.json | while IFS='=' read -r key value; do
  # Add each output to flat-outputs.json
  jq --arg key "$key" --arg value "$value" '. + {($key): $value}' cfn-outputs/flat-outputs.json > cfn-outputs/temp-flat.json
  mv cfn-outputs/temp-flat.json cfn-outputs/flat-outputs.json
done

# Also copy to all-outputs.json for compatibility
cp cfn-outputs/cdk-outputs.json cfn-outputs/all-outputs.json

echo "✅ Processed CDK outputs successfully"
echo "📊 Output summary:"
OUTPUT_COUNT=$(jq 'length' cfn-outputs/flat-outputs.json)
echo "   Total outputs: $OUTPUT_COUNT"

if [ "$OUTPUT_COUNT" -gt 0 ]; then
  echo "   Sample outputs:"
  jq -r 'keys[:5][]' cfn-outputs/flat-outputs.json | while read -r key; do
    echo "     - $key"
  done
else
  echo "⚠️ Warning: No outputs found in cdk-outputs.json"
fi

echo "✅ CDK outputs processing completed"
