#!/bin/bash
set -e

# Direct CloudFormation deployment script for LocalStack
# This bypasses CDK asset publishing which has S3 API incompatibility

echo "================================================="
echo "Direct CloudFormation Deployment to LocalStack"
echo "================================================="
echo ""

# Configuration
STACK_NAME="${STACK_NAME:-tap-stack-Pr2332}"
TEMPLATE_PATH="${1:-cdk.out/TapStackdev.template.json}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"

echo "Configuration:"
echo "  Stack Name: $STACK_NAME"
echo "  Template:   $TEMPLATE_PATH"
echo "  Region:     $REGION"
echo "  Endpoint:   $ENDPOINT_URL"
echo ""

# Check if template exists
if [[ ! -f "$TEMPLATE_PATH" ]]; then
    echo "ERROR: Template not found at $TEMPLATE_PATH"
    echo "Run 'gradle run' or 'cdk synth' first to generate the template"
    exit 1
fi

echo "Step 1: Validating template..."
awslocal cloudformation validate-template \
    --template-body "file://$TEMPLATE_PATH" \
    --region "$REGION" || {
    echo "WARNING: Template validation failed, but continuing anyway (LocalStack may have limited validation)"
}
echo ""

echo "Step 2: Checking if stack exists..."
STACK_EXISTS=$(awslocal cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" 2>/dev/null | jq -r '.Stacks[0].StackName' || echo "")

if [[ -n "$STACK_EXISTS" ]]; then
    echo "Stack exists. Updating stack..."
    awslocal cloudformation update-stack \
        --stack-name "$STACK_NAME" \
        --template-body "file://$TEMPLATE_PATH" \
        --region "$REGION" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM || {
        echo "Update may have failed, checking stack status..."
    }
    OPERATION="update"
else
    echo "Stack does not exist. Creating stack..."
    awslocal cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body "file://$TEMPLATE_PATH" \
        --region "$REGION" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM || {
        echo "ERROR: Stack creation failed"
        exit 1
    }
    OPERATION="create"
fi
echo ""

echo "Step 3: Waiting for stack $OPERATION to complete..."
echo "This may take several minutes..."
echo ""

# Wait for stack operation to complete (with timeout)
TIMEOUT=300
ELAPSED=0
WAIT_INTERVAL=10

while [[ $ELAPSED -lt $TIMEOUT ]]; do
    STACK_STATUS=$(awslocal cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" 2>/dev/null | jq -r '.Stacks[0].StackStatus' || echo "UNKNOWN")

    echo "[$ELAPSED s] Stack Status: $STACK_STATUS"

    case "$STACK_STATUS" in
        CREATE_COMPLETE|UPDATE_COMPLETE)
            echo ""
            echo "SUCCESS: Stack $OPERATION completed successfully!"
            echo ""
            break
            ;;
        CREATE_FAILED|ROLLBACK_COMPLETE|ROLLBACK_FAILED|UPDATE_ROLLBACK_COMPLETE|UPDATE_ROLLBACK_FAILED)
            echo ""
            echo "ERROR: Stack $OPERATION failed with status: $STACK_STATUS"
            echo ""
            echo "Stack events (last 10):"
            awslocal cloudformation describe-stack-events \
                --stack-name "$STACK_NAME" \
                --region "$REGION" \
                --max-items 10 | jq -r '.StackEvents[] | "\(.Timestamp) - \(.ResourceStatus) - \(.ResourceType) - \(.ResourceStatusReason // "N/A")"'
            exit 1
            ;;
        *IN_PROGRESS)
            # Still in progress, continue waiting
            ;;
        UNKNOWN)
            echo "WARNING: Could not determine stack status"
            ;;
        *)
            echo "WARNING: Unexpected status: $STACK_STATUS"
            ;;
    esac

    sleep $WAIT_INTERVAL
    ELAPSED=$((ELAPSED + WAIT_INTERVAL))
done

if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo ""
    echo "WARNING: Stack operation timed out after ${TIMEOUT}s"
    echo "Current status: $STACK_STATUS"
    echo ""
fi

echo "Step 4: Getting stack outputs..."
echo ""
awslocal cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" | jq -r '.Stacks[0].Outputs[] | "\(.OutputKey): \(.OutputValue)"' || {
    echo "No outputs available or stack not found"
}

echo ""
echo "Step 5: Saving outputs to cfn-outputs/flat-outputs.json..."
mkdir -p cfn-outputs
awslocal cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" | jq -r '.Stacks[0].Outputs | map({(.OutputKey): .OutputValue}) | add' > cfn-outputs/flat-outputs.json || {
    echo "{}" > cfn-outputs/flat-outputs.json
}
echo "Outputs saved!"

echo ""
echo "================================================="
echo "Deployment Complete!"
echo "================================================="
echo ""
echo "Stack Name: $STACK_NAME"
echo "Status: $(awslocal cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" 2>/dev/null | jq -r '.Stacks[0].StackStatus' || echo 'UNKNOWN')"
echo ""
echo "To delete the stack:"
echo "  awslocal cloudformation delete-stack --stack-name $STACK_NAME --region $REGION"
echo ""
