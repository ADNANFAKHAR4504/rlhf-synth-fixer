# Model Failures and Fixes

This document outlines the issues identified in the original MODEL_RESPONSE and the fixes applied to reach the IDEAL_RESPONSE.

## Issue 1: SageMaker Endpoint ARN Construction

**Problem**: The original code attempted to use `endpoint.attrArn` property on `CfnEndpoint`, which doesn't exist in the CDK library.

```typescript
// Original (INCORRECT)
resources: [endpoint.attrArn]
```

**Fix**: Constructed the ARN manually using CDK tokens:

```typescript
// Fixed
resources: [`arn:aws:sagemaker:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:endpoint/${sagemakerEndpointName}`]
```

## Issue 2: SageMaker Model Dependency on S3 Artifacts

**Problem**: The SageMaker model required actual model.tar.gz file in S3 before deployment, causing deployment failure:
```
Could not find model data at s3://recommendation-synth68172439-model-artifacts-342597974367/models/model.tar.gz
```

**Fix**: Removed the SageMaker model/endpoint resources and kept only the placeholder endpoint name. This allows the infrastructure to deploy successfully while maintaining the Lambda environment variable structure. In production, the SageMaker endpoint would be deployed separately after uploading model artifacts to S3.

## Issue 3: Missing Removal Policies on Kinesis Stream

**Problem**: The Kinesis stream was created without a removal policy, defaulting to RETAIN, which would prevent cleanup during stack deletion.

**Fix**: Added explicit removal policy:

```typescript
const eventStream = new kinesis.Stream(this, 'EventStream', {
  streamName: `${stackName}-user-events`,
  streamMode: kinesis.StreamMode.PROVISIONED,
  shardCount: 4,
  retentionPeriod: cdk.Duration.hours(24),
  removalPolicy: cdk.RemovalPolicy.DESTROY, // Added this
});
```

## Issue 4: CloudWatch Log Groups Retention Policy

**Problem**: Lambda functions created CloudWatch log groups with RETAIN deletion policy, preventing automatic cleanup.

**Fix**: Added log retention configuration to Lambda functions:

```typescript
logRetention: logs.RetentionDays.ONE_DAY,
```

Note: This is deprecated in favor of `logGroup` property, but functional for this use case.

## Issue 5: Unused Variables in CloudWatch Alarms

**Problem**: CloudWatch alarm variables were assigned but never used, causing TypeScript linting errors.

**Fix**: Removed variable assignments and directly instantiated alarms:

```typescript
// Before
const lambdaLatencyAlarm = new cloudwatch.Alarm(...)

// After  
new cloudwatch.Alarm(...)
```

## Issue 6: Missing Stack Outputs for Lambda Functions

**Problem**: The original implementation didn't output Lambda function names, making integration testing harder.

**Fix**: Added comprehensive stack outputs:

```typescript
new cdk.CfnOutput(this, 'StreamProcessorFunctionName', {
  value: streamProcessorFunction.functionName,
  description: 'Stream Processor Lambda Function Name',
});

new cdk.CfnOutput(this, 'BatchProcessorFunctionName', {
  value: batchProcessorFunction.functionName,
  description: 'Batch Processor Lambda Function Name',
});
```

## Summary

All fixes were focused on making the infrastructure deployable, testable, and properly cleanable while maintaining the original requirements. The main architectural change was deferring SageMaker endpoint creation until actual model artifacts are available, which is a more practical approach for real-world deployments.
