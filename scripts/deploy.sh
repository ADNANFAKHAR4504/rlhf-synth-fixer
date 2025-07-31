#!/bin/bash

# Exit on any error
set -e

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
export REPOSITORY=${REPOSITORY:-$(basename "$(pwd)")}
export COMMIT_AUTHOR=${COMMIT_AUTHOR:-$(git config user.name || echo "unknown")}
export AWS_REGION=${AWS_REGION:-us-east-1}
export S3_DEPLOY_BUCKET=${S3_DEPLOY_BUCKET:-cfn-deploy-${REPOSITORY}-${ENVIRONMENT_SUFFIX}}

echo "Environment suffix: $ENVIRONMENT_SUFFIX"
echo "Repository: $REPOSITORY"
echo "Commit author: $COMMIT_AUTHOR"
echo "AWS region: $AWS_REGION"
echo "S3 deployment bucket: $S3_DEPLOY_BUCKET"

# Bootstrap step
echo "=== Bootstrap Phase ==="
echo "Cleaning up cdk.out directory before bootstrap..."
if [ -d "cdk.out" ]; then
  rm -rf cdk.out
fi

if [ "$PLATFORM" = "cdk" ]; then
  echo "✅ CDK project detected, running CDK bootstrap..."
  npm run cdk:bootstrap
else
  echo "ℹ️ Not a CDK project, skipping CDK bootstrap"
fi

# Deploy step
echo "=== Deploy Phase ==="
if [ "$PLATFORM" = "cdk" ]; then
  echo "✅ CDK project detected, running CDK deploy..."
  npm run cdk:deploy
elif [ "$PLATFORM" = "cdktf" ]; then
  echo "✅ CDKTF project detected, running CDKTF deploy..."
  npm run cdktf:deploy
elif [ "$PLATFORM" = "cfn" ] && [ "$LANGUAGE" = "yaml" ]; then
  echo "✅ CloudFormation YAML project detected, deploying with AWS CLI..."
  npm run cfn:deploy-yaml
elif [ "$PLATFORM" = "cfn" ] && [ "$LANGUAGE" = "json" ]; then
  echo "✅ CloudFormation JSON project detected, deploying with AWS CLI..."
  npm run cfn:deploy-json
else
  echo "ℹ️ Unknown deployment method for platform: $PLATFORM, language: $LANGUAGE"
  echo "💡 Supported combinations: cdk+typescript, cdk+python, cfn+yaml, cfn+json, cdktf+typescript, cdktf+python"
  exit 1
fi

echo "Deploy completed successfully"

if [ "$PLATFORM" = "cdk" ]; then
    echo "✅ CDK project detected, getting CDK outputs..."
    npx cdk list --json > cdk-stacks.json
    mkdir -p cfn-outputs
    echo "Getting all CloudFormation stacks..."
    aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query "StackSummaries[?contains(StackName, \`TapStack${ENVIRONMENT_SUFFIX}\`)].StackName" --output text > cf-stacks.txt
    echo "{}" > cfn-outputs/all-outputs.json
    if [ -s cf-stacks.txt ]; then
      for stack in $(cat cf-stacks.txt); do
        echo "Getting outputs for CloudFormation stack: $stack"
        aws cloudformation describe-stacks --stack-name "$stack" --query 'Stacks[0].Outputs' --output json > "temp-${stack}-outputs.json" 2>/dev/null || echo "No outputs for $stack"
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
      echo "No TapStack CloudFormation stacks found"
    fi
    echo "Consolidated outputs:"
    cat cfn-outputs/all-outputs.json || echo "No consolidated outputs"
    echo "Flat outputs:"
    cat cfn-outputs/flat-outputs.json || echo "No flat outputs"
  elif [ "$PLATFORM" = "cdktf" ]; then
    echo "✅ CDKTF project detected, writing outputs to cfn-outputs..."
    mkdir -p cfn-outputs/
    touch cfn-outputs/flat-outputs.json
    cdktf output --outputs-file cfn-outputs/flat-outputs.json
    cat cfn-outputs/flat-outputs.json || echo "No outputs found in cfn-outputs/flat-outputs.json"
  elif [ "$PLATFORM" = "cfn" ]; then
    echo "✅ CloudFormation project detected, getting stack outputs..."
    mkdir -p cfn-outputs
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
      fi
      rm -f "temp-${STACK_NAME}-outputs.json"
    fi
    rm -f temp-stack.json temp-merged.json temp-flat.json
    echo "Consolidated outputs:"
    cat cfn-outputs/all-outputs.json || echo "No consolidated outputs"
    echo "Flat outputs:"
    cat cfn-outputs/flat-outputs.json || echo "No flat outputs"
  else
    echo "ℹ️ Not a CDK TypeScript or CloudFormation project, creating empty outputs for consistency"
    mkdir -p cfn-outputs
    echo "{}" > cfn-outputs/all-outputs.json
    echo "{}" > cfn-outputs/flat-outputs.json
    echo "# No CDK outputs for non-CDK projects" > cdk-stacks.json
  fi

