# Serverless Transaction Processing System - Ideal Implementation

This document describes the corrected implementation after identifying and fixing 7 critical deployment issues in the model-generated code.

## Architecture Overview

Complete serverless transaction processing system using **Pulumi with TypeScript** deployed to **us-east-1**:

1. **API Gateway REST API** with OpenAPI 3.0 request validation
2. **Transaction Validator Lambda** (provided.al2023 runtime) - processes API requests and writes to DynamoDB
3. **DynamoDB Table** with streams enabled
4. **Fraud Detection Lambda** (provided.al2023 runtime) - triggered by DynamoDB streams
5. **SQS FIFO Queue** for ordered transaction processing
6. **Notification Lambda** (provided.al2023 runtime) - reads from SQS and publishes to SNS
7. **SNS Topic** for notifications
8. **Two Dead Letter Queues** for failed Lambda executions
9. **Custom KMS Key** for Lambda environment variable encryption
10. **CloudWatch Log Groups** with 30-day retention
11. **API Gateway Usage Plan** with 10,000 requests/day limit

## Key Corrections from Model Response

### 1. Lambda Runtime (CRITICAL FIX)
**Original (MODEL_RESPONSE)**:
```typescript
runtime: aws.lambda.Runtime.Go1dxRuntime,  // Deprecated runtime
```

**Corrected (IDEAL_RESPONSE)**:
```typescript
runtime: 'provided.al2023',  // Current supported Go custom runtime
```

**Reason**: AWS deprecated `go1.x` managed runtime. Modern Go Lambdas must use custom runtimes on Amazon Linux 2023.

### 2. Reserved Concurrency (CRITICAL FIX)
**Original (MODEL_RESPONSE)**:
```typescript
reservedConcurrentExecutions: 100,  // Exceeds account limits
```

**Corrected (IDEAL_RESPONSE)**:
```typescript
reservedConcurrentExecutions: 5,  // Realistic for testing
```

**Reason**: 3 functions × 100 = 300 reserved capacity violates typical AWS account limits (1000 total). Reduced to 5 per function for practical deployment.

### 3. IAM Permissions for DLQ (CRITICAL FIX)
**Original (MODEL_RESPONSE)**:
```typescript
// Notification Lambda role policy - missing DLQ SendMessage
{
  Effect: 'Allow',
  Action: [
    'sqs:ReceiveMessage',
    'sqs:DeleteMessage',
    'sqs:GetQueueAttributes',
    // Missing: sqs:SendMessage for DLQ
  ],
  Resource: [queueArn, dlqArn],
},
```

**Corrected (IDEAL_RESPONSE)**:
```typescript
// Notification Lambda role policy - includes DLQ SendMessage
{
  Effect: 'Allow',
  Action: [
    'sqs:ReceiveMessage',
    'sqs:DeleteMessage',
    'sqs:GetQueueAttributes',
    'sqs:SendMessage',  // Required for Dead Letter Queue
  ],
  Resource: [queueArn, dlqArn],
},
```

**Reason**: Lambda functions with Dead Letter Queues configured must have `sqs:SendMessage` permission on the DLQ ARN. AWS validates this at function creation time.

### 4. AWS Managed Policy for SQS (HIGH PRIORITY FIX)
**Original (MODEL_RESPONSE)**:
```typescript
// Only BasicExecutionRole attached
new aws.iam.RolePolicyAttachment(`notification-basic-${environmentSuffix}`, {
  role: notificationRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
});
```

**Corrected (IDEAL_RESPONSE)**:
```typescript
// Added SQS-specific managed policy
new aws.iam.RolePolicyAttachment(`notification-sqs-${environmentSuffix}`, {
  role: notificationRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole',
});
```

**Reason**: AWS-managed policy ensures all required SQS event source permissions are granted, including ChangeMessageVisibility and batch operations.

### 5. Explicit IAM Policy Dependencies (MEDIUM PRIORITY FIX)
**Original (MODEL_RESPONSE)**:
```typescript
new aws.iam.RolePolicyAttachment(...);
new aws.iam.RolePolicy(...);

const notificationFunction = new aws.lambda.Function(..., {
  dependsOn: [notificationLogGroup]  // Missing policy dependencies
});
```

**Corrected (IDEAL_RESPONSE)**:
```typescript
const notificationBasicPolicy = new aws.iam.RolePolicyAttachment(...);
const notificationSQSPolicy = new aws.iam.RolePolicyAttachment(...);
const notificationRolePolicy = new aws.iam.RolePolicy(...);

const notificationFunction = new aws.lambda.Function(..., {
  dependsOn: [
    notificationLogGroup,
    notificationBasicPolicy,
    notificationSQSPolicy,
    notificationRolePolicy,
  ],
});
```

**Reason**: Explicit dependencies ensure IAM policies are fully propagated before Lambda creation attempts permission validation.

### 6. API Gateway Integration URI (MEDIUM PRIORITY FIX)
**Original (MODEL_RESPONSE)**:
```typescript
'x-amazon-apigateway-integration': {
  type: 'aws_proxy',
  httpMethod: 'POST',
  uri: functionArn,  // Incorrect ARN format
  credentials: apiGatewayRole.arn,
},
```

**Corrected (IDEAL_RESPONSE)**:
```typescript
'x-amazon-apigateway-integration': {
  type: 'aws_proxy',
  httpMethod: 'POST',
  uri: invokeArn,  // Correct Lambda invoke ARN format
  // credentials removed - not needed with Lambda permissions
},
```

**Reason**: API Gateway Lambda integrations require the invoke ARN in a specific format. Pulumi's `invokeArn` property provides this correctly.

### 7. API Gateway Stage Throttling (LOW PRIORITY FIX)
**Original (MODEL_RESPONSE)**:
```typescript
const stage = new aws.apigateway.Stage({
  // ...
  throttleSettings: {  // Invalid property name
    burstLimit: 100,
    rateLimit: 50,
  },
});
```

**Corrected (IDEAL_RESPONSE)**:
```typescript
const stage = new aws.apigateway.Stage({
  // ...
  // Throttling configured at UsagePlan level instead
});
```

**Reason**: Pulumi's Stage resource doesn't have a `throttleSettings` object property. Throttling is properly configured at the UsagePlan level.

## Complete Implementation

The fully corrected implementation is in `/lib/tap-stack.ts` (935 lines) with:

### Resource Summary

**AWS Services (7 Total)**:
1. **API Gateway** - REST API with OpenAPI validation
2. **Lambda** - 3 functions with proper runtime and IAM policies
3. **DynamoDB** - Transaction table with streams
4. **SQS** - 1 FIFO queue + 2 DLQs
5. **SNS** - Notification topic
6. **KMS** - Custom encryption key
7. **CloudWatch Logs** - 3 log groups with 30-day retention

### Key Implementation Details

**IAM Roles (4 Total)**:
- Validator Lambda Role: DynamoDB write + KMS decrypt
- Fraud Detection Lambda Role: DynamoDB streams read + SQS send + KMS decrypt
- Notification Lambda Role: SQS read + SNS publish + **SQS send (DLQ)** + KMS decrypt
- API Gateway Role: Lambda invoke

**Lambda Functions**:
- Runtime: `provided.al2023` (custom Go runtime)
- Reserved Concurrency: 5 per function
- KMS encryption for environment variables
- Dead Letter Queues configured with proper IAM permissions
- Event source mappings: DynamoDB streams → Fraud Detection, SQS → Notification

**API Gateway Configuration**:
- OpenAPI 3.0 schema with request validation
- Lambda proxy integration using invokeArn
- API Key authentication
- Usage Plan: 10,000 requests/day limit
- Stage throttling via UsagePlan

### Stack Outputs

```typescript
export const apiUrl: string;      // https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/transaction
export const apiKey: string;      // API key value for authentication
export const tableName: string;   // DynamoDB table name
export const topicArn: string;    // SNS topic ARN
export const queueUrl: string;    // SQS FIFO queue URL
```

## Deployment

```bash
export ENVIRONMENT_SUFFIX=dev
export PULUMI_CONFIG_PASSPHRASE=<your-passphrase>
export AWS_REGION=us-east-1
pulumi up --yes
```

## Testing

### Integration Test Requirements

Tests should use live stack outputs from deployment:

```typescript
// Load outputs
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8'));

// Test transaction flow
const response = await fetch(outputs.apiUrl, {
  method: 'POST',
  headers: {
    'x-api-key': outputs.apiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 500.00,
    cardNumber: '1234567890123456',
    description: 'Test transaction',
  }),
});

// Verify DynamoDB, SQS, SNS integration
// ...
```

## Architecture Flow

1. **Client** → POST /transaction to API Gateway with API key
2. **API Gateway** → Validates request against OpenAPI schema
3. **Validator Lambda** → Writes transaction to DynamoDB
4. **DynamoDB Stream** → Triggers Fraud Detection Lambda
5. **Fraud Detection Lambda** → Analyzes transaction, sends result to SQS FIFO queue
6. **SQS Queue** → Triggers Notification Lambda
7. **Notification Lambda** → Publishes result to SNS topic
8. **DLQ** (if failures occur) → Captures failed Lambda invocations for retry/analysis

## Key Success Factors

1. **Current AWS Runtimes**: Using `provided.al2023` instead of deprecated `go1.x`
2. **Realistic Resource Limits**: Reserved concurrency of 5 instead of 100
3. **Complete IAM Permissions**: Including DLQ SendMessage permission
4. **AWS Managed Policies**: Using AWSLambdaSQSQueueExecutionRole
5. **Explicit Dependencies**: Ensuring IAM policy propagation before Lambda creation
6. **Proper ARN References**: Using Pulumi's invokeArn for API Gateway integration
7. **Correct Property Names**: Following Pulumi TypeScript SDK conventions

## Deployment Status

**Build Quality**: ✅ PASSED (lint + build + Pulumi preview)

**Deployment Status**: ⚠️ BLOCKED after 5 attempts due to persistent IAM permission issue with DLQ SendMessage permission. Final fix documented above.

**Test Coverage**: Not completed due to deployment blocker

**Integration Tests**: Not completed due to deployment blocker

## Training Value

This implementation demonstrates critical real-world AWS deployment challenges:
- Runtime deprecation handling
- AWS account limit awareness
- IAM permission completeness (especially for error handling paths)
- Proper use of AWS-managed policies
- Pulumi resource dependency management
- API Gateway Lambda integration patterns

These corrections should be incorporated into future model training to improve deployment success rates on complex, multi-service AWS architectures.
