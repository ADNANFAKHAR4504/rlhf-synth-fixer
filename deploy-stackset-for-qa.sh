#!/bin/bash
# CloudFormation StackSet Deployment Helper for QA Testing
# This script adapts StackSet templates for single-account deployment testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Configuration
STACK_NAME="PaymentProcessingStack-${ENVIRONMENT_SUFFIX:-dev}"
REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="${CURRENT_ACCOUNT_ID:-342597974367}"
S3_BUCKET="iac-rlhf-cfn-states-${REGION}-${ACCOUNT_ID}"
S3_PREFIX="${ENVIRONMENT_SUFFIX:-dev}/nested-stacks"

echo "=== CloudFormation StackSet QA Deployment ==="
echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"
echo "Account ID: $ACCOUNT_ID"
echo "S3 Bucket: $S3_BUCKET"
echo "S3 Prefix: $S3_PREFIX"
echo ""

# Step 1: Create S3 bucket if it doesn't exist
echo "📦 Ensuring S3 bucket exists..."
if ! aws s3api head-bucket --bucket "$S3_BUCKET" --region "$REGION" 2>/dev/null; then
    echo "Creating S3 bucket: $S3_BUCKET"
    aws s3api create-bucket --bucket "$S3_BUCKET" --region "$REGION"

    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "$S3_BUCKET" \
        --versioning-configuration Status=Enabled \
        --region "$REGION"
else
    echo "✅ S3 bucket already exists"
fi

# Step 2: Upload nested stack templates to S3
echo ""
echo "📤 Uploading nested stack templates..."
for template in lib/nested/*.json; do
    template_name=$(basename "$template")
    s3_key="${S3_PREFIX}/${template_name}"

    echo "Uploading $template_name..."
    aws s3 cp "$template" "s3://${S3_BUCKET}/${s3_key}" \
        --region "$REGION" \
        --content-type "application/json"
done

echo "✅ Nested templates uploaded successfully"

# Step 3: Build template URLs for parameters
NETWORK_URL="https://s3.${REGION}.amazonaws.com/${S3_BUCKET}/${S3_PREFIX}/NetworkStack.json"
COMPUTE_URL="https://s3.${REGION}.amazonaws.com/${S3_BUCKET}/${S3_PREFIX}/ComputeStack.json"
STORAGE_URL="https://s3.${REGION}.amazonaws.com/${S3_BUCKET}/${S3_PREFIX}/StorageStack.json"
MONITORING_URL="https://s3.${REGION}.amazonaws.com/${S3_BUCKET}/${S3_PREFIX}/MonitoringStack.json"

echo ""
echo "Template URLs:"
echo "  Network: $NETWORK_URL"
echo "  Compute: $COMPUTE_URL"
echo "  Storage: $STORAGE_URL"
echo "  Monitoring: $MONITORING_URL"

# Step 4: Get availability zones for the region
echo ""
echo "🌍 Getting availability zones..."
AZS=($(aws ec2 describe-availability-zones \
    --region "$REGION" \
    --query 'AvailabilityZones[?State==`available`].ZoneName' \
    --output text))

if [ ${#AZS[@]} -lt 3 ]; then
    echo "❌ Error: Region $REGION does not have at least 3 availability zones"
    exit 1
fi

AZ1="${AZS[0]}"
AZ2="${AZS[1]}"
AZ3="${AZS[2]}"

echo "Using AZs: $AZ1, $AZ2, $AZ3"

# Step 5: Deploy the main stack
echo ""
echo "🚀 Deploying CloudFormation stack..."

aws cloudformation deploy \
    --template-file lib/PaymentProcessingStack.json \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        EnvironmentName="${ENVIRONMENT_SUFFIX:-dev}" \
        AccountId="$ACCOUNT_ID" \
        DomainName="${ENVIRONMENT_SUFFIX:-dev}.payments.local" \
        SnsEmail="alerts@example.com" \
        VpcCidr="10.0.0.0/16" \
        AvailabilityZone1="$AZ1" \
        AvailabilityZone2="$AZ2" \
        AvailabilityZone3="$AZ3" \
        NetworkStackTemplateUrl="$NETWORK_URL" \
        ComputeStackTemplateUrl="$COMPUTE_URL" \
        StorageStackTemplateUrl="$STORAGE_URL" \
        MonitoringStackTemplateUrl="$MONITORING_URL" \
    --tags \
        Repository="${REPOSITORY:-synth-101912929}" \
        Author="${COMMIT_AUTHOR:-ArpitPatidar}" \
        Team="${TEAM:-synth}" \
        CreatedAt="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --no-fail-on-empty-changeset

# Check deployment status
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text)

if [[ "$STACK_STATUS" == *"COMPLETE"* ]]; then
    echo "✅ Stack deployment successful!"
    echo "Stack Status: $STACK_STATUS"

    # Step 6: Save stack outputs
    echo ""
    echo "📊 Retrieving stack outputs..."

    mkdir -p cfn-outputs

    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs' \
        --output json > cfn-outputs/raw-outputs.json

    # Flatten outputs to key-value pairs
    python3 << 'PYTHON_SCRIPT'
import json
import sys

with open('cfn-outputs/raw-outputs.json', 'r') as f:
    outputs = json.load(f)

flat_outputs = {}
if outputs:
    for output in outputs:
        key = output.get('OutputKey', '')
        value = output.get('OutputValue', '')
        if key:
            flat_outputs[key] = value

with open('cfn-outputs/flat-outputs.json', 'w') as f:
    json.dump(flat_outputs, f, indent=2)

print(json.dumps(flat_outputs, indent=2))
PYTHON_SCRIPT

    echo "✅ Outputs saved to cfn-outputs/flat-outputs.json"

else
    echo "❌ Stack deployment failed!"
    echo "Stack Status: $STACK_STATUS"

    # Get failure details
    echo ""
    echo "Stack events (most recent failures):"
    aws cloudformation describe-stack-events \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --max-items 20 \
        --query 'StackEvents[?contains(ResourceStatus, `FAILED`)].[LogicalResourceId,ResourceType,ResourceStatusReason]' \
        --output table

    exit 1
fi

echo ""
echo "🎉 Deployment complete!"
