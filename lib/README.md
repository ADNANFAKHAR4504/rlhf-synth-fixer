# TAP Stack - Task Assignment Platform

This CloudFormation template deploys a DynamoDB table for the Task Assignment Platform (TAP Stack).

## Architecture Overview

The infrastructure includes:

- **DynamoDB Table**: Pay-per-request billing mode with single partition key
- **Environment Isolation**: Resources named with environment suffix for multi-environment support
- **Fully Destroyable**: No deletion protection, suitable for test environments

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured with valid credentials
3. Region: us-east-1 (default, configurable via AWS_REGION)

## Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| EnvironmentSuffix | Environment identifier | dev, staging, prod |

## Deployment Steps

### 1. Validate the Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.json
```

### 2. Deploy the Stack

```bash
npm run cfn:deploy-json
```

Or manually:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStackdev \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides EnvironmentSuffix=dev \
  --region us-east-1
```

### 3. Monitor Stack Creation

```bash
aws cloudformation wait stack-create-complete \
  --stack-name TapStackdev \
  --region us-east-1

aws cloudformation describe-stacks \
  --stack-name TapStackdev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### 4. Verify Deployment

```bash
# Check stack outputs
aws cloudformation describe-stacks \
  --stack-name TapStackdev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'

# Check DynamoDB table
aws dynamodb describe-table \
  --table-name TurnAroundPromptTabledev \
  --region us-east-1
```

## Resource Naming Convention

All resources follow the pattern: `{resource-name}${EnvironmentSuffix}`

Examples:
- DynamoDB Table: `TurnAroundPromptTabledev`
- Stack Name: `TapStackdev`

## Resource Configuration

### DynamoDB Table

- **Table Name**: `TurnAroundPromptTable${EnvironmentSuffix}`
- **Partition Key**: `id` (String)
- **Billing Mode**: `PAY_PER_REQUEST` (on-demand)
- **Deletion Protection**: Disabled (for test environments)
- **Deletion Policy**: Delete (removed on stack deletion)

## Stack Outputs

The stack provides the following outputs:

- **TurnAroundPromptTableName**: Name of the DynamoDB table
- **TurnAroundPromptTableArn**: ARN of the DynamoDB table
- **StackName**: Name of the CloudFormation stack
- **EnvironmentSuffix**: Environment suffix used for this deployment

All outputs are exported for cross-stack references.

## Cleanup

To delete all resources:

```bash
npm run cfn:destroy
```

Or manually:

```bash
aws cloudformation delete-stack \
  --stack-name TapStackdev \
  --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name TapStackdev \
  --region us-east-1
```

## Testing

### Unit Tests

```bash
npm run test:unit
```

Validates template structure, parameters, resources, and outputs.

### Integration Tests

```bash
npm run test:integration
```

Validates actual deployed resources by:
- Dynamically discovering the stack name
- Extracting outputs from the deployed stack
- Discovering all resources from the stack
- Validating DynamoDB table configuration via AWS SDK

## Security Features

1. **Least Privilege**: DynamoDB table has minimal configuration
2. **No Deletion Protection**: Suitable for test environments
3. **Environment Isolation**: Resources isolated by environment suffix

## Cost Optimization

- **Pay-per-Request Billing**: No reserved capacity, pay only for what you use
- **No Deletion Protection**: Easy cleanup in test environments
- **Minimal Resources**: Single DynamoDB table with no additional services

## Troubleshooting

### Stack Creation Fails

1. Check AWS credentials are configured: `aws sts get-caller-identity`
2. Verify region is correct: `aws configure get region`
3. Check CloudFormation events: `aws cloudformation describe-stack-events --stack-name TapStackdev`

### Table Not Found After Deployment

1. Verify stack outputs: `aws cloudformation describe-stacks --stack-name TapStackdev --query 'Stacks[0].Outputs'`
2. Check table exists: `aws dynamodb list-tables --region us-east-1`
3. Verify table name matches output: `aws dynamodb describe-table --table-name TurnAroundPromptTabledev`

### Integration Tests Fail

1. Ensure stack is deployed: `aws cloudformation describe-stacks --stack-name TapStackdev`
2. Verify stack status is `CREATE_COMPLETE` or `UPDATE_COMPLETE`
3. Check AWS credentials are available to test process
4. Verify region matches: `echo $AWS_REGION` (defaults to us-east-1)
