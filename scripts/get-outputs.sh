
#!/bin/bash

# Exit on any error
set -e

echo "📊 Getting deployment outputs..."

# Read platform and language from metadata.json
if [ ! -f "metadata.json" ]; then
  echo "❌ metadata.json not found, exiting with failure"
  exit 1
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)

echo "Project: platform=$PLATFORM, language=$LANGUAGE"

# Set default environment variables if not provided
export ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-dev}

echo "Environment suffix: $ENVIRONMENT_SUFFIX"

# Create outputs directory
mkdir -p cfn-outputs

if [ "$PLATFORM" = "cdk" ]; then
  echo "✅ CDK project detected, getting CDK outputs..."
  npx cdk list --json > cdk-stacks.json
  
  # possible regions to search (comma-separated, can be overridden by env var)
  POSSIBLE_REGIONS=${POSSIBLE_REGIONS:-"us-west-2,us-east-1,us-east-2,eu-west-1,eu-west-2,ap-southeast-2,ap-southeast-1,ap-northeast-1,eu-central-1,eu-central-2,eu-south-1,eu-south-2"}
  
  echo "Getting all CloudFormation stacks..."
  echo "Searching for stacks containing: TapStack${ENVIRONMENT_SUFFIX}"
  echo "Searching in regions: $POSSIBLE_REGIONS"
  
  # Convert comma-separated regions to array
  IFS=',' read -ra REGIONS <<< "$POSSIBLE_REGIONS"
  
  # Search across all regions
  > cf-stacks.txt  # Clear the file
  for region in "${REGIONS[@]}"; do
    echo "Searching in region: $region"
    aws cloudformation list-stacks --region "$region" --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --output json 2>/dev/null | \
      jq -r ".StackSummaries[] | select(.StackName | contains(\"TapStack${ENVIRONMENT_SUFFIX}\")) | .StackName" >> cf-stacks.txt || true
  done
  
  echo "Found stacks:"
  cat cf-stacks.txt
  echo "{}" > cfn-outputs/all-outputs.json
  
  if [ -s cf-stacks.txt ]; then
    # Get the region where the stack was found
    STACK_NAME=$(head -n 1 cf-stacks.txt)
    STACK_REGION=""
    
    # Find which region the stack is in
    for region in "${REGIONS[@]}"; do
      if aws cloudformation describe-stacks --region "$region" --stack-name "$STACK_NAME" &>/dev/null; then
        STACK_REGION="$region"
        echo "Stack found in region: $STACK_REGION"
        break
      fi
    done
    
    if [ -z "$STACK_REGION" ]; then
      echo "⚠️ Could not determine stack region, using default: us-east-1"
      STACK_REGION="us-east-1"
    fi
    
    for stack in $(cat cf-stacks.txt); do
      echo "Getting outputs for CloudFormation stack: $stack (region: $STACK_REGION)"
      aws cloudformation describe-stacks --region "$STACK_REGION" --stack-name "$stack" --query 'Stacks[0].Outputs' --output json > "temp-${stack}-outputs.json" 2>/dev/null || echo "No outputs for $stack"
      if [ -f "temp-${stack}-outputs.json" ]; then
        output_count=$(jq 'length' "temp-${stack}-outputs.json" 2>/dev/null || echo "0")
        if [ "$output_count" != "0" ] && [ "$output_count" != "null" ]; then
          jq -n --arg stack "$stack" --slurpfile outputs "temp-${stack}-outputs.json" '{($stack): $outputs[0]}' > "temp-stack.json"
          jq -s '.[0] * .[1]' cfn-outputs/all-outputs.json temp-stack.json > temp-merged.json
          mv temp-merged.json cfn-outputs/all-outputs.json
          if [ ! -f "cfn-outputs/flat-outputs.json" ]; then
            echo "{}" > cfn-outputs/flat-outputs.json
          fi
          jq -r '.[] | "\(.OutputKey)=\(.OutputValue)"' "temp-${stack}-outputs.json" | while IFS='=' read -r key value; do
            jq --arg key "$key" --arg value "$value" '. + {($key): $value}' cfn-outputs/flat-outputs.json > temp-flat.json
            mv temp-flat.json cfn-outputs/flat-outputs.json
          done
        fi
        rm -f "temp-${stack}-outputs.json"
      fi
    done
    rm -f temp-stack.json temp-merged.json temp-flat.json
  else
    echo "No TapStack CloudFormation stacks found in any region"
    echo "{}" > cfn-outputs/flat-outputs.json
  fi
  
  echo "Consolidated outputs:"
  cat cfn-outputs/all-outputs.json || echo "No consolidated outputs"
  echo "Flat outputs:"
  cat cfn-outputs/flat-outputs.json || echo "No flat outputs"

elif [ "$PLATFORM" = "cdktf" ]; then
  echo "✅ CDKTF project detected, writing outputs to cfn-outputs..."
  touch cfn-outputs/flat-outputs.json
  if npx --yes cdktf output --outputs-file cfn-outputs/flat-outputs.json; then
    echo "✅ CDKTF outputs retrieved successfully"
  else
    echo "⚠️ Failed to get CDKTF outputs, creating empty file"
    echo "{}" > cfn-outputs/flat-outputs.json
  fi
  cat cfn-outputs/flat-outputs.json || echo "No outputs found in cfn-outputs/flat-outputs.json"
  echo "{}" > cfn-outputs/all-outputs.json

elif [ "$PLATFORM" = "cfn" ]; then
  echo "✅ CloudFormation project detected, getting stack outputs..."
  # Try to find the stack name (assuming TapStack<ENVIRONMENT_SUFFIX>)
  STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"
  echo "Getting outputs for CloudFormation stack: $STACK_NAME"
  aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs' --output json > "temp-${STACK_NAME}-outputs.json" 2>/dev/null || echo "No outputs for $STACK_NAME"
  echo "{}" > cfn-outputs/all-outputs.json
  
  if [ -f "temp-${STACK_NAME}-outputs.json" ]; then
    output_count=$(jq 'length' "temp-${STACK_NAME}-outputs.json" 2>/dev/null || echo "0")
    if [ "$output_count" != "0" ] && [ "$output_count" != "null" ]; then
      jq -n --arg stack "$STACK_NAME" --slurpfile outputs "temp-${STACK_NAME}-outputs.json" '{($stack): $outputs[0]}' > temp-stack.json
      jq -s '.[0] * .[1]' cfn-outputs/all-outputs.json temp-stack.json > temp-merged.json
      mv temp-merged.json cfn-outputs/all-outputs.json
      if [ ! -f "cfn-outputs/flat-outputs.json" ]; then
        echo "{}" > cfn-outputs/flat-outputs.json
      fi
      jq -r '.[] | "\(.OutputKey)=\(.OutputValue)"' "temp-${STACK_NAME}-outputs.json" | while IFS='=' read -r key value; do
        jq --arg key "$key" --arg value "$value" '. + {($key): $value}' cfn-outputs/flat-outputs.json > temp-flat.json
        mv temp-flat.json cfn-outputs/flat-outputs.json
      done
    else
      echo "{}" > cfn-outputs/flat-outputs.json
    fi
    rm -f "temp-${STACK_NAME}-outputs.json"
  else
    echo "{}" > cfn-outputs/flat-outputs.json
  fi
  
  rm -f temp-stack.json temp-merged.json temp-flat.json
  echo "Consolidated outputs:"
  cat cfn-outputs/all-outputs.json || echo "No consolidated outputs"
  echo "Flat outputs:"
  cat cfn-outputs/flat-outputs.json || echo "No flat outputs"

elif [ "$PLATFORM" = "pulumi" ]; then
  echo "✅ Pulumi project detected, getting Pulumi stack outputs..."
  echo "{}" > cfn-outputs/all-outputs.json
  echo "{}" > cfn-outputs/flat-outputs.json
  
  # Get the current stack name
  if STACK_NAME=$(pulumi stack --show-name 2>/dev/null); then
    echo "Fetching outputs from Pulumi stack: $STACK_NAME"
    if pulumi stack output --json > "temp-${STACK_NAME}-outputs.json" 2>/dev/null; then
      jq -n --arg stack "$STACK_NAME" --slurpfile outputs "temp-${STACK_NAME}-outputs.json" '{($stack): $outputs[0]}' > temp-stack.json
      jq -s '.[0] * .[1]' cfn-outputs/all-outputs.json temp-stack.json > temp-merged.json && mv temp-merged.json cfn-outputs/all-outputs.json
      jq -r 'to_entries[] | "\(.key)=\(.value)"' "temp-${STACK_NAME}-outputs.json" | while IFS='=' read -r key value; do
        jq --arg key "$key" --arg value "$value" '. + {($key): $value}' cfn-outputs/flat-outputs.json > temp-flat.json
        mv temp-flat.json cfn-outputs/flat-outputs.json
      done
      rm -f "temp-${STACK_NAME}-outputs.json"
    else
      echo "⚠️ Failed to get Pulumi outputs, using empty outputs"
    fi
    rm -f temp-stack.json temp-merged.json temp-flat.json
  else
    echo "⚠️ Could not determine Pulumi stack name, using empty outputs"
  fi
  
  echo "Consolidated outputs:"
  cat cfn-outputs/all-outputs.json || echo "No consolidated outputs"
  echo "Flat outputs:"
  cat cfn-outputs/flat-outputs.json || echo "No flat outputs"

elif [ "$PLATFORM" = "tf" ]; then
  echo "✅ Terraform project detected, writing outputs to cfn-outputs..."
  touch cfn-outputs/flat-outputs.json
  
  # Change to lib directory where Terraform files are located
  cd lib
  
  # Get structured outputs (JSON)
  if terraform output -json > ../cfn-outputs/all-outputs.json; then
    echo "✅ Terraform outputs retrieved successfully"
    
    # Create flat key=value version
    echo "{}" > ../cfn-outputs/flat-outputs.json
    jq -r 'to_entries[] | "\(.key)=\(.value.value)"' ../cfn-outputs/all-outputs.json | while IFS='=' read -r key value; do
      jq --arg key "$key" --arg value "$value" '. + {($key): $value}' ../cfn-outputs/flat-outputs.json > ../temp-flat.json
      mv ../temp-flat.json ../cfn-outputs/flat-outputs.json
    done
  else
    echo "⚠️ Failed to get Terraform outputs, creating empty files"
    echo "{}" > ../cfn-outputs/all-outputs.json
    echo "{}" > ../cfn-outputs/flat-outputs.json
  fi
  
  # Go back to root directory
  cd ..

  echo "✅ Consolidated Terraform outputs:"
  cat cfn-outputs/all-outputs.json || echo "No structured outputs"

  echo "✅ Flat outputs:"
  cat cfn-outputs/flat-outputs.json || echo "No flat outputs"    

else
  echo "ℹ️ Not a recognized platform, creating empty outputs for consistency"
  echo "{}" > cfn-outputs/all-outputs.json
  echo "{}" > cfn-outputs/flat-outputs.json
  if [ ! -f "cdk-stacks.json" ]; then
    echo "# No CDK stacks for non-CDK projects" > cdk-stacks.json
  fi
fi

echo "✅ Deployment outputs collection completed successfully"
