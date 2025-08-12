#!/bin/bash

set -e

ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"

# echo "✅ Terraform project detected for environment: $ENVIRONMENT_SUFFIX"

cd ../bin

echo "🔄 Initializing Terraform backend..."
terraform init -input=false

# Back to root directory

cd ..

echo "📦 Getting Terraform outputs..."

mkdir -p tf-outputs

echo "📦 Back to Terraform directory"
cd bin

# Get structured outputs (JSON)
terraform output -json > ../tf-outputs/all-outputs.json

# Create flat key=value version
echo "{}" > ../tf-outputs/flat-outputs.json
jq -r 'to_entries[] | "\(.key)=\(.value.value)"' ../tf-outputs/all-outputs.json | while IFS='=' read -r key value; do
  jq --arg key "$key" --arg value "$value" '. + {($key): $value}' ../tf-outputs/flat-outputs.json > ../temp-flat.json
  mv ../temp-flat.json ../tf-outputs/flat-outputs.json
done

echo "✅ Consolidated Terraform outputs:"
cat ../tf-outputs/all-outputs.json || echo "No structured outputs"

echo "✅ Flat outputs:"
cat ../tf-outputs/flat-outputs.json || echo "No flat outputs"
