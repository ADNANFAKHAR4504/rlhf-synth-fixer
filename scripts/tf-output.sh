#!/bin/bash

set -e

ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"

# echo "✅ Terraform project detected for environment: $ENVIRONMENT_SUFFIX"

cd ../lib

echo "🔄 Initializing Terraform backend..."
terraform init -input=false

# Back to root directory

cd ..

echo "📦 Getting Terraform outputs..."

mkdir -p cfn-outputs

echo "📦 Back to Terraform directory"
cd lib

# Get structured outputs (JSON)
terraform output -json > ../cfn-outputs/all-outputs.json

# Create flat key=value version
echo "{}" > ../cfn-outputs/flat-outputs.json
jq -r 'to_entries[] | "\(.key)=\(.value.value)"' ../cfn-outputs/all-outputs.json | while IFS='=' read -r key value; do
  jq --arg key "$key" --arg value "$value" '. + {($key): $value}' ../cfn-outputs/flat-outputs.json > ../temp-flat.json
  mv ../temp-flat.json ../cfn-outputs/flat-outputs.json
done

echo "✅ Consolidated Terraform outputs:"
cat ../cfn-outputs/all-outputs.json || echo "No structured outputs"

echo "✅ Flat outputs:"
cat ../cfn-outputs/flat-outputs.json || echo "No flat outputs"
