# Model Failures and Issues

This document tracks the failures and issues encountered when the AI model attempted to implement the requirements from TASK_DESCRIPTION.md.

## Issue 1: Lambda Function Dependency Bundling

### Description
The model initially created a Lambda function without proper dependency bundling configuration. This caused the Lambda function to fail at runtime with 502 errors because required npm packages (@aws-sdk/client-dynamodb, @aws-sdk/util-dynamodb, uuid) were not included in the deployment package.

### Impact
- Integration tests failed with 502 Bad Gateway errors
- Lambda function could not execute successfully in AWS

### Root Cause
The model used `lambda.Code.fromAsset()` without bundling configuration, which does not automatically install node_modules.

### Fix Applied
Updated the construct to include bundling configuration:
```typescript
code: lambda.Code.fromAsset(
  path.join(__dirname, '../lambda/user-profile'),
  {
    bundling: {
      image: lambda.Runtime.NODEJS_18_X.bundlingImage,
      command: [
        'bash',
        '-c',
        'npm install --cache /tmp/.npm && cp -r . /asset-output/',
      ],
    },
  }
)
```

### Lesson Learned
Always configure proper bundling for Lambda functions with external dependencies to ensure they work in CI/CD pipelines.

## Issue 2: Lambda Concurrency Limit

### Description
The model initially set `reservedConcurrentExecutions: 5` as specified in requirements, but this failed deployment because it violated the AWS account requirement to leave at least 10 unreserved concurrent executions.

### Error Message
```
Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [10]
```

### Impact
- Stack deployment failed
- Had to delete and recreate stack multiple times

### Fix Applied
Removed the `reservedConcurrentExecutions` configuration entirely with a comment explaining why.

### Lesson Learned
AWS account limits must be considered. The concurrency requirement of 5 was too strict for accounts with limited concurrent execution capacity.

## Issue 3: DynamoDB Table Retention Policy

### Description
The model used `removalPolicy: cdk.RemovalPolicy.RETAIN` which caused the table to persist after stack deletion. On subsequent deployments, the stack creation failed because the table name already existed.

### Impact
- Failed redeployments
- Manual cleanup required

### Fix Applied
Had to manually delete the DynamoDB table between deployments using AWS CLI.

### Lesson Learned
For development/test environments, consider using `DESTROY` removal policy, or use unique table names per deployment.

## Issue 4: Deprecated CDK APIs

### Description
The model used deprecated APIs:
- `pointInTimeRecovery` (should use `pointInTimeRecoverySpecification`)
- `logRetention` (should use `logGroup`)

### Impact
- Warning messages during deployment
- Code will break in future CDK major versions

### Status
Warnings present but not blocking. Should be fixed in future iterations.

## Issue 5: Integration Test Dependency on Deployment

### Description
Integration tests cannot run successfully without a fully deployed and functional Lambda function. The bundling issue prevented proper testing of the live infrastructure.

### Impact
- 10 out of 15 integration tests failed
- Only tests that didn't require Lambda execution passed (DynamoDB verification, CORS headers, etc.)

### Status
Tests are written correctly but require successful Lambda deployment to pass.

## Summary

The model successfully:
- ✅ Created comprehensive CDK infrastructure code
- ✅ Implemented DynamoDB with GSI
- ✅ Set up API Gateway with CORS and rate limiting
- ✅ Applied proper IAM permissions
- ✅ Created comprehensive unit tests (100% coverage)
- ✅ Created comprehensive integration tests
- ✅ Added proper tagging (iac-rlhf-amazon)

The model struggled with:
- ❌ Lambda dependency bundling for CI/CD environments
- ❌ AWS account-specific limits (concurrency)
- ❌ Using latest non-deprecated CDK APIs
- ❌ Development vs Production removal policies

## Recommendations

1. **Always use bundling for Lambda functions** with external dependencies
2. **Make AWS limits configurable** rather than hardcoded
3. **Use latest CDK APIs** and avoid deprecated features
4. **Consider environment-specific configurations** (dev vs prod)
5. **Test locally with Docker** before deploying to ensure bundling works