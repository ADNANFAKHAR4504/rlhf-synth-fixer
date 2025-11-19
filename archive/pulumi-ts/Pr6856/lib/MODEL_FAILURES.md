# Model Response Failures Analysis

This document analyzes critical failures in the model-generated code that prevented successful deployment. The implementation attempted to satisfy an expert-level, multi-service serverless transaction processing system but contained several deployment-blocking issues.

## Critical Failures

### 1. Deprecated Lambda Runtime (Go 1.x)

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
The generated code used `aws.lambda.Runtime.Go1dx` (which maps to `go1.x` runtime):
```typescript
runtime: aws.lambda.Runtime.Go1dxRuntime,
```

**Deployment Error**:
```
InvalidParameterValueException: The runtime parameter of go1.x is no longer supported for creating or updating AWS Lambda functions.
```

**IDEAL_RESPONSE Fix**:
```typescript
runtime: 'provided.al2023',  // Current supported Go runtime
```

**Root Cause**: AWS deprecated the `go1.x` managed runtime in favor of custom runtimes using Amazon Linux 2023. The model generated code using outdated AWS Lambda runtime information.

**AWS Documentation Reference**: https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html

**Impact**: Complete deployment blocker on first attempt. Modern Go Lambda functions must use `provided.al2023` or `provided.al2` custom runtimes.

---

### 2. Reserved Concurrency Exceeds Account Limits

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
The PROMPT explicitly required "Lambda functions must have reserved concurrent executions of exactly 100", and the generated code faithfully implemented this:
```typescript
reservedConcurrentExecutions: 100,  // Applied to all 3 Lambda functions
```

**Deployment Error**:
```
InvalidParameterValueException: Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [100].
```

**IDEAL_RESPONSE Fix**:
```typescript
reservedConcurrentExecutions: 5,  // Realistic value for synthetic testing
```

**Root Cause**: AWS accounts have a default concurrent execution limit (typically 1000). Setting 3 Lambda functions × 100 = 300 reserved concurrency violates this limit. The PROMPT requirement was unrealistic for standard AWS accounts.

**Training Recommendation**: The model should recognize when prompt requirements are infeasible and suggest alternatives. Reserved concurrency of 100 per function is excessive for most use cases and particularly problematic when deploying multiple Lambda functions.

**Cost/Performance Impact**:
- Blocks 30% of account's concurrency capacity
- Prevents other Lambda functions in the account from running
- No cost benefit (reserved concurrency is free, but reduces available concurrency)

**Severity**: This is a PROMPT DESIGN FLAW, not a model failure. The requirement should be "reserved concurrent executions of 5" or omitted entirely.

---

###  3. Missing IAM Permissions for Lambda Dead Letter Queue

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
The notification Lambda was configured with a Dead Letter Queue but the execution role lacked permission to send messages to it:
```typescript
deadLetterConfig: {
  targetArn: notificationDLQ.arn,
},
// Role policy only includes sqs:ReceiveMessage, sqs:DeleteMessage, sqs:GetQueueAttributes
```

**Deployment Error** (Persistent across attempts 2-5):
```
InvalidParameterValueException: The provided execution role does not have permissions to call SendMessage on SQS
```

**IDEAL_RESPONSE Fix**:
```typescript
// In notificationRolePolicy, add DLQ SendMessage permission:
{
  Effect: 'Allow',
  Action: [
    'sqs:ReceiveMessage',
    'sqs:DeleteMessage',
    'sqs:GetQueueAttributes',
    'sqs:SendMessage',  // Required for DLQ
  ],
  Resource: [queueArn, dlqArn],
},
```

**Root Cause**: Lambda functions with Dead Letter Queues configured must have `sqs:SendMessage` permission on the DLQ ARN. The model generated comprehensive IAM policies but missed this specific requirement, likely because:
1. The notification Lambda reads from SQS (ReceiveMessage) for normal operation
2. The DLQ is a separate resource for error handling
3. AWS validates DLQ permissions at function creation time

**AWS Documentation Reference**: https://docs.aws.amazon.com/lambda/latest/dg/invocation-async.html#invocation-dlq

**Impact**: Complete deployment blocker. Lambda service validates IAM permissions during function creation and rejects the creation if DLQ permissions are missing.

**Training Value**: High - this demonstrates the nuanced difference between runtime permissions (reading from SQS) and error-handling permissions (writing to DLQ).

---

### 4. Missing AWS Managed Policy for SQS Event Source

**Impact Level**: High

**MODEL_RESPONSE Issue**:
The notification Lambda uses SQS as an event source but lacked the AWS-managed policy for Lambda SQS integration:
```typescript
new aws.iam.RolePolicyAttachment(`notification-basic-${environmentSuffix}`, {
  role: notificationRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
});
// Missing: AWSLambdaSQSQueueExecutionRole
```

**IDEAL_RESPONSE Fix**:
```typescript
new aws.iam.RolePolicyAttachment(`notification-sqs-${environmentSuffix}`, {
  role: notificationRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole',
});
```

**Root Cause**: While custom IAM policies were created, the AWS-managed policy `AWSLambdaSQSQueueExecutionRole` provides additional permissions needed for Lambda to poll SQS queues, including:
- `sqs:ChangeMessageVisibility`
- `sqs:ChangeMessageVisibilityBatch`
- `sqs:GetQueueAttributes`
- `sqs:ReceiveMessage`
- `sqs:DeleteMessage`

**AWS Documentation Reference**: https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html

**Impact**: Contributed to IAM permission issues. While custom policies can work, AWS-managed policies are the recommended approach and ensure all required permissions are granted.

---

### 5. Missing Explicit Resource Dependencies

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
IAM policy attachments were not captured as dependencies for Lambda function creation:
```typescript
new aws.iam.RolePolicyAttachment(`notification-basic-${environmentSuffix}`, ...);
new aws.iam.RolePolicy(`notification-policy-${environmentSuffix}`, ...);

const notificationFunction = new aws.lambda.Function(..., {
  dependsOn: [notificationLogGroup]  // Missing policy dependencies
});
```

**IDEAL_RESPONSE Fix**:
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

**Root Cause**: Pulumi's dependency resolution is automatic in most cases, but IAM policies can have propagation delays. Explicit dependencies ensure IAM policies are fully attached before Lambda creation attempts permission validation.

**Impact**: Contributes to intermittent IAM permission failures. While Pulumi tracks dependencies through resource references (role.arn), explicit `dependsOn` provides stronger guarantees for IAM policy propagation.

---

### 6. API Gateway Integration URI Format

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
The API Gateway OpenAPI specification initially referenced Lambda incorrectly, later required using `invokeArn` instead of attempting to construct the integration URI:
```typescript
body: pulumi.all([validatorFunction.invokeArn]).apply(([functionArn]) =>
  JSON.stringify({
    // ...
    'x-amazon-apigateway-integration': {
      uri: functionArn,
      credentials: apiGatewayRole.arn,  // Unnecessary with Lambda proxy
    }
  })
)
```

**IDEAL_RESPONSE Fix**:
```typescript
body: pulumi.all([validatorFunction.arn, validatorFunction.invokeArn])
  .apply(([_functionArn, invokeArn]) =>
    JSON.stringify({
      // ...
      'x-amazon-apigateway-integration': {
        type: 'aws_proxy',
        httpMethod: 'POST',
        uri: invokeArn,  // Pulumi provides correct format
        // credentials removed - not needed for aws_proxy with Lambda permissions
      }
    })
  )
```

**Root Cause**: API Gateway integrations with Lambda require the invoke ARN in a specific format. Pulumi's `invokeArn` property provides the correctly formatted ARN, but the model initially attempted to use `executionArn` or construct the ARN manually.

**Impact**: Deployment failure with "Invalid ARN specified in the request" error.

---

### 7. API Gateway Stage Throttling Configuration

**Impact Level**: Low

**MODEL_RESPONSE Issue**:
The Stage resource used incorrect property name for throttling:
```typescript
const stage = new aws.apigateway.Stage(`api-stage-${environmentSuffix}`, {
  restApi: api.id,
  deployment: deployment.id,
  stageName: 'prod',
  throttleSettings: {  // Invalid property
    burstLimit: 100,
    rateLimit: 50,
  },
});
```

**Deployment Error**:
```
TS2353: Object literal may only specify known properties, and 'throttleSettings' does not exist in type 'StageArgs'.
```

**IDEAL_RESPONSE Fix**:
```typescript
const stage = new aws.apigateway.Stage(`api-stage-${environmentSuffix}`, {
  restApi: api.id,
  deployment: deployment.id,
  stageName: 'prod',
  // Throttling moved to UsagePlan, or use individual properties:
  // throttleBurstLimit: 100,
  // throttleRateLimit: 50,
});
```

**Root Cause**: API Gateway Stage in Pulumi doesn't have a `throttleSettings` object property. Throttling is configured either at the UsagePlan level (which was done correctly) or using individual Stage properties.

**Impact**: TypeScript compilation error, caught during build phase.

---

## Summary

- **Total failures**: 3 Critical, 4 High/Medium
- **Primary knowledge gaps**:
  1. AWS Lambda runtime deprecations and custom runtime migration
  2. IAM permission requirements for Lambda error handling (DLQ)
  3. Account-level AWS service limits (concurrent executions)

- **Training value**: **HIGH** - This task exposed fundamental issues with:
  - Keeping current with AWS service updates (runtime deprecations)
  - Understanding implicit IAM permission requirements (DLQ needs SendMessage)
  - Recognizing when prompt requirements are infeasible (reserved concurrency)
  - IAM policy completeness and managed policy usage

**Recommendation**: This task should be included in training data with corrections, as it demonstrates important real-world AWS deployment challenges that are not obvious from documentation alone.

## Deployment Outcome

**Status**: BLOCKED after 5 deployment attempts (maximum allowed)

**Root Cause of Blocking**: Persistent IAM permission issue with DLQ SendMessage permission. While other issues were resolved (runtime, concurrency, API Gateway), the missing DLQ permission persisted across multiple deployment attempts.

**Lessons for Future Generations**:
1. Always include `sqs:SendMessage` permission when configuring Lambda Dead Letter Queues
2. Use AWS-managed policies (`AWSLambdaSQSQueueExecutionRole`) for common Lambda event sources
3. Question prompt requirements that seem excessive (100 reserved concurrency per function)
4. Stay current with AWS runtime deprecations - `go1.x` is no longer supported
5. Add explicit `dependsOn` for IAM policies to ensure propagation before Lambda creation
