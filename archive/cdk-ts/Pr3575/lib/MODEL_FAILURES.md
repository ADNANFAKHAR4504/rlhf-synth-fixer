# Infrastructure Changes Required

This document outlines the infrastructure changes needed to transform the MODEL_RESPONSE into the IDEAL_RESPONSE.

## Critical Infrastructure Issues

### 1. VPC Configuration Removed

**Problem**: MODEL_RESPONSE included VPC with private subnets and NAT Gateway configuration.

**Impact**:
- Adds unnecessary cost (NAT Gateway charges)
- Increases deployment complexity
- Complicates stack deletion
- No actual security benefit for this use case

**Fix**: Remove all VPC-related infrastructure:
- Remove `ec2.Vpc` resource
- Remove `vpcSubnets` configuration from Lambda functions
- Remove VPC-related IAM managed policies
- Use `AWSLambdaBasicExecutionRole` instead of `AWSLambdaVPCAccessExecutionRole`

### 2. Missing Deletion Policies

**Problem**: MODEL_RESPONSE resources lacked explicit removal policies.

**Impact**:
- Stack deletion fails or leaves orphaned resources
- KMS keys retained by default
- Cannot run ephemeral PR environments
- Blocks CI/CD automation

**Fix**: Add explicit removal policies to all resources:
```typescript
removalPolicy: cdk.RemovalPolicy.DESTROY
```

Resources requiring this:
- KMS Key
- S3 Buckets (with `autoDeleteObjects: true`)
- DynamoDB Table

### 3. S3 Bucket Retention Features

**Problem**: MODEL_RESPONSE included versioning and lifecycle rules.

**Impact**:
- Versioning prevents `autoDeleteObjects` from working
- Lifecycle rules complicate deletion
- Increases storage costs

**Fix**: Remove:
- `versioned: true` from S3 buckets
- `lifecycleRules` configuration
- Keep only encryption and `autoDeleteObjects: true`

### 4. DynamoDB Point-in-Time Recovery

**Problem**: MODEL_RESPONSE enabled PITR on DynamoDB table.

**Impact**:
- Prevents clean table deletion
- Adds unnecessary backup costs
- Not needed for ephemeral test environments

**Fix**: Remove `pointInTimeRecovery: true` from table configuration.

### 5. Missing MediaConvert Service Role

**Problem**: MODEL_RESPONSE only created Lambda execution role, not MediaConvert service role.

**Impact**:
- MediaConvert jobs fail with permission errors
- Lambda cannot pass its own role to MediaConvert service
- Job submission fails

**Fix**: Create separate IAM role:
```typescript
const mediaConvertRole = new iam.Role(this, 'MediaConvertRole', {
  assumedBy: new iam.ServicePrincipal('mediaconvert.amazonaws.com'),
});
uploadBucket.grantRead(mediaConvertRole);
outputBucket.grantReadWrite(mediaConvertRole);
```

Pass this role ARN to processor Lambda via environment variable.

### 6. IAM PassRole Permission Missing

**Problem**: Processor Lambda role lacks permission to pass MediaConvert role.

**Impact**:
- CreateJob API calls fail with access denied
- Cannot submit MediaConvert jobs

**Fix**: Add PassRole policy to processor role:
```typescript
processorRole.addToPolicy(new iam.PolicyStatement({
  actions: ['iam:PassRole'],
  resources: ['*'],
  conditions: {
    StringLike: {
      'iam:PassedToService': 'mediaconvert.amazonaws.com',
    },
  },
}));
```

### 7. Outdated Lambda Runtime

**Problem**: MODEL_RESPONSE used Node.js 18.x runtime.

**Impact**:
- Node.js 18 entering maintenance mode
- Missing newer AWS SDK features
- Not using latest security patches

**Fix**: Update all Lambda functions:
```typescript
runtime: lambda.Runtime.NODEJS_20_X
```

### 8. Lambda Code Implementation

**Problem**: MODEL_RESPONSE used `lambda.Code.fromInline()` with placeholder code.

**Impact**:
- No actual business logic
- Deployment would succeed but pipeline wouldn't function

**Fix**: Use `lambda.Code.fromInline()` with full implementation:
- Include complete working code for each Lambda function
- Handle S3 events, SQS messages, and DynamoDB updates
- Implement MediaConvert job submission logic

### 9. Incorrect S3 Notification Import

**Problem**: MODEL_RESPONSE used `s3.LambdaDestination` directly.

**Issue**:
- Import path not explicit
- May cause build issues

**Fix**: Use explicit import:
```typescript
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
new s3n.LambdaDestination(uploadHandlerFunction)
```

### 10. SQS Permission Grants

**Problem**: MODEL_RESPONSE used `grantConsumeMessages` for processor role.

**Issue**:
- Incomplete permission set
- May not cover all SQS operations needed

**Fix**: Grant full permissions via event source mapping:
```typescript
processorFunction.addEventSource(new lambdaEventSources.SqsEventSource(jobQueue))
```
This automatically grants required permissions.

### 11. Lambda Timeout Values

**Problem**: Inconsistent timeout values in MODEL_RESPONSE.

**Fix**: Standardize based on function type:
- Upload handler: 30 seconds
- Processor: 60 seconds (MediaConvert API calls)
- Status updater: 30 seconds

### 12. Environment Variable Completeness

**Problem**: MODEL_RESPONSE processor Lambda missing critical environment variables.

**Missing**:
- `MEDIACONVERT_ROLE_ARN`
- `AWS_REGION`

**Fix**: Add to processor environment:
```typescript
environment: {
  UPLOAD_BUCKET: uploadBucket.bucketName,
  OUTPUT_BUCKET: outputBucket.bucketName,
  PROCESSING_TABLE: processingTable.tableName,
  MEDIACONVERT_ROLE_ARN: mediaConvertRole.roleArn,
  AWS_REGION: cdk.Stack.of(this).region,
}
```

## Summary of Changes

The primary issues preventing deployment and deletion:

1. VPC overhead removed for simplicity
2. Explicit DESTROY removal policies added
3. MediaConvert service role created
4. PassRole permission granted to Lambda
5. Retention features removed (versioning, PITR)
6. Real Lambda code with proper dependencies
7. Updated to latest Node.js runtime

These changes transform a theoretical architecture into a production-ready, testable, and cleanly deletable stack.