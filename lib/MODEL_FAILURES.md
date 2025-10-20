# Model Response Failures and Issues

This document details all the issues found in `MODEL_RESPONSE.md` that were corrected in `IDEAL_RESPONSE.md`.

## Critical Runtime Errors

### 1. Lambda Reserved Concurrent Executions Causes Deployment Failure

**File:** `lib/tap-stack.ts` (Line 133)

**Issue:**
```typescript
reservedConcurrentExecutions: 1000, // Handle high throughput
```

**Error:**
```
Resource handler returned message: "Specified ReservedConcurrentExecutions for function 
decreases account's UnreservedConcurrentExecution below its minimum value of [100]. 
(Service: Lambda, Status Code: 400)"
```

**Root Cause:**
AWS requires at least 100 unreserved concurrent executions to remain available in an account. With a default account limit of 1000 concurrent executions, reserving 1000 violates this requirement.

**Fix:**
Removed the property entirely to allow Lambda to use account-level unreserved capacity:
```typescript
// Note: Removed reservedConcurrentExecutions to use account-level unreserved capacity
// This allows Lambda to scale automatically while respecting account limits
```

**Impact:** Critical - Prevents stack deployment

---

### 2. Incorrect Lambda Context Property

**File:** `lambda/serverless-ci-cd-function/handler.ts` (Lines 601, 607, 635)

**Issue:**
```typescript
requestId: context.requestId,
Key: `processed/${context.requestId}.json`,
requestId: context.requestId,
```

**Error:**
```
Property 'requestId' does not exist on type 'Context'. Did you mean 'awsRequestId'?
```

**Root Cause:**
The Lambda `Context` interface does not have a `requestId` property. The correct property is `awsRequestId`.

**Fix:**
```typescript
requestId: context.awsRequestId,
Key: `processed/${context.awsRequestId}.json`,
requestId: context.awsRequestId,
```

**Impact:** Critical - Compilation error

---

### 3. Incorrect CodeDeploy Import and Reference

**File:** `lib/tap-stack.ts` (Line 139)

**Issue:**
```typescript
deploymentConfig: lambda.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
```

**Error:**
```
Property 'LambdaDeploymentConfig' does not exist on type 'typeof import(...aws-lambda/index)'
```

**Root Cause:**
`LambdaDeploymentConfig` is in the `codedeploy` module, not the `lambda` module. Missing import for `codedeploy`.

**Fix:**
Added import and corrected reference:
```typescript
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
// ...
deploymentConfig: codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
```

**Impact:** Critical - Compilation error

---

### 4. Non-existent Lambda Property

**File:** `lib/tap-stack.ts` (Line 135)

**Issue:**
```typescript
deadLetterQueueMaxMessageSize: 2,
```

**Error:**
```
Object literal may only specify known properties, and 'deadLetterQueueMaxMessageSize' 
does not exist in type 'LambdaWithCanaryProps'.
```

**Root Cause:**
The property `deadLetterQueueMaxMessageSize` does not exist in AWS CDK Lambda function properties.

**Fix:**
Removed the non-existent property entirely.

**Impact:** Critical - Compilation error

---

### 5. Incorrect CodeBuild Cache API

**File:** `lib/pipeline-stack.ts` (Lines 252-257)

**Issue:**
```typescript
cache: codebuild.Cache.s3({
  bucket: new s3.Bucket(this, 'BuildCacheBucket', {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  }),
}),
```

**Error:**
```
Property 's3' does not exist on type 'typeof Cache'.
```

**Root Cause:**
The CodeBuild `Cache` class does not have an `s3()` method with this signature in the current CDK version.

**Fix:**
```typescript
cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE),
```

**Impact:** Critical - Compilation error

---

### 6. Incorrect Type Definition for Alarm Configuration

**File:** `lib/constructs/lambda-with-canary.ts` (Line 509)

**Issue:**
```typescript
alarmConfiguration?: codedeploy.LambdaDeploymentConfig.AlarmConfiguration;
```

**Error:**
```
'aws-cdk-lib/aws-codedeploy' has no exported member named 'LambdaDeploymentConfig'. 
Did you mean 'ILambdaDeploymentConfig'?
```

**Root Cause:**
`LambdaDeploymentConfig.AlarmConfiguration` is not a valid type in the CodeDeploy module.

**Fix:**
```typescript
alarmConfiguration?: {
  alarms: cloudwatch.IAlarm[];
  enabled: boolean;
};
```

**Impact:** Critical - Compilation error

---

### 7. Non-existent CodeDeploy Deployment Group Property

**File:** `lib/constructs/lambda-with-canary.ts` (Line 542)

**Issue:**
```typescript
this.deploymentGroup = new codedeploy.LambdaDeploymentGroup(this, 'DeploymentGroup', {
  application,
  alias,
  deploymentConfig: props.canaryConfig.deploymentConfig,
  alarmConfiguration: props.canaryConfig.alarmConfiguration,
});
```

**Error:**
```
Object literal may only specify known properties, but 'alarmConfiguration' does not exist 
in type 'LambdaDeploymentGroupProps'. Did you mean to write 'ignoreAlarmConfiguration'?
```

**Root Cause:**
The `LambdaDeploymentGroup` constructor does not accept `alarmConfiguration` property.

**Fix:**
```typescript
this.deploymentGroup = new codedeploy.LambdaDeploymentGroup(
  this,
  'DeploymentGroup',
  {
    application,
    alias,
    deploymentConfig: props.canaryConfig.deploymentConfig,
    alarms: props.canaryConfig.alarmConfiguration?.alarms,
  }
);
```

**Impact:** Critical - Compilation error

---

## Type and Interface Issues

### 8. Type Mismatch for Pipeline Source Bucket

**File:** `lib/tap-stack.ts` (Line 27)

**Issue:**
```typescript
public readonly pipelineSourceBucket: s3.Bucket;
```

**Error:**
```
Type 'IBucket' is missing the following properties from type 'Bucket': autoCreatePolicy, 
lifecycleRules, metrics, cors, and 35 more.
```

**Root Cause:**
The property can be either a new `s3.Bucket` or an existing `s3.IBucket` (from props), so it must be typed as the interface.

**Fix:**
```typescript
public readonly pipelineSourceBucket: s3.IBucket;
```

**Impact:** High - Type safety issue

---

### 9. Unused Parameter in updateCanaryAlarms Method

**File:** `lib/constructs/lambda-with-canary.ts` (Line 546)

**Issue:**
```typescript
public updateCanaryAlarms(alarms: cloudwatch.Alarm[]): void {
```

**Linting Error:**
```
'alarms' is defined but never used. Allowed unused args must match /^_/u
```

**Root Cause:**
The parameter is not used in the method body, violating ESLint rules.

**Fix:**
```typescript
public updateCanaryAlarms(_alarms: cloudwatch.Alarm[]): void {
```

**Impact:** Medium - Code quality/linting issue

---

## Import Organization Issues

### 10. Unorganized Imports

**File:** `lib/tap-stack.ts` (Lines 6-18)

**Issue:**
Imports are not alphabetically organized:
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
// ... mixed order
```

**Fix:**
Alphabetically ordered imports:
```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
// ... alphabetical order
```

**Impact:** Low - Code organization/best practices

---

### 11. Import Order in pipeline-stack.ts

**File:** `lib/pipeline-stack.ts` (Lines 213-220)

**Issue:**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { TapStack } from './tap-stack';
```

**Issues:**
1. Imports not alphabetically ordered
2. `TapStack` import is unused

**Fix:**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
// Removed unused TapStack import
```

**Impact:** Low - Code organization

---

### 12. Import Order in secure-bucket.ts

**File:** `lib/constructs/secure-bucket.ts` (Lines 430-433)

**Issue:**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
```

**Fix:**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
```

**Impact:** Low - Code organization

---

### 13. Import Order in lambda-with-canary.ts

**File:** `lib/constructs/lambda-with-canary.ts` (Lines 500-504)

**Issue:**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
```

**Issues:**
1. Unused `cdk` import
2. Not alphabetically ordered

**Fix:**
```typescript
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
```

**Impact:** Low - Code organization

---

### 14. Import Order in handler.ts

**File:** `lambda/serverless-ci-cd-function/handler.ts` (Lines 556-560)

**Issue:**
```typescript
import { Context, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import * as AWSXRay from 'aws-xray-sdk-core';
```

**Fix:**
Alphabetically ordered and consistent ordering within imports:
```typescript
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import * as AWSXRay from 'aws-xray-sdk-core';
```

**Impact:** Low - Code organization

---

## Functionality and Configuration Issues

### 15. Incorrect Lambda Code Path

**File:** `lib/tap-stack.ts` (Line 124)

**Issue:**
```typescript
code: lambda.Code.fromAsset('src/lambda'),
```

**Root Cause:**
The Lambda function code is located at `lambda/serverless-ci-cd-function`, not `src/lambda`.

**Fix:**
```typescript
code: lambda.Code.fromAsset('lambda/serverless-ci-cd-function'),
```

**Impact:** Critical - Lambda deployment will fail

---

### 16. Missing Stack Outputs for Testing

**File:** `lib/tap-stack.ts` (Lines 191-206)

**Issue:**
MODEL_RESPONSE only provides 3 basic outputs:
```typescript
new cdk.CfnOutput(this, 'ApplicationBucketName', { ... });
new cdk.CfnOutput(this, 'LambdaFunctionArn', { ... });
new cdk.CfnOutput(this, 'PipelineSourceBucketName', { ... });
```

**Missing:**
- No export names for cross-stack references
- Missing critical outputs: DLQ URLs, Secret ARNs, Alarm names, Role ARNs
- No helper CLI commands for testing
- Only 3 outputs vs 17 in IDEAL

**Fix:**
Added 14 additional outputs with export names:
- ApplicationBucketArn
- LoggingBucketName  
- LambdaFunctionName
- DeadLetterQueueUrl
- DeadLetterQueueArn
- SecretArn
- AlarmTopicArn
- ErrorAlarmName
- ThrottleAlarmName
- DurationAlarmName
- LambdaRoleArn
- TestInvokeCommand
- CheckDLQCommand
- ViewLogsCommand

All outputs include `exportName` for cross-stack references.

**Impact:** High - Significantly reduces testability and integration capabilities

---

## Code Style and Best Practices Issues

### 17. Inconsistent Array Formatting

**File:** `lib/tap-stack.ts` (Line 42)

**Issue:**
```typescript
lifecycleRules: [{
  id: 'delete-old-logs',
  expiration: cdk.Duration.days(90),
}],
```

**Fix:**
```typescript
lifecycleRules: [
  {
    id: 'delete-old-logs',
    expiration: cdk.Duration.days(90),
  },
],
```

**Impact:** Low - Code formatting consistency

---

### 18. Long Line Formatting

**File:** `lib/tap-stack.ts` (Line 56, Line 89)

**Issue:**
```typescript
this.pipelineSourceBucket = props?.pipelineSourceBucket || new s3.Bucket(...)
iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
```

**Fix:**
Multi-line formatting for readability:
```typescript
this.pipelineSourceBucket =
  props?.pipelineSourceBucket ||
  new s3.Bucket(this, 'TapPipelineSourceBucket', {

iam.ManagedPolicy.fromAwsManagedPolicyName(
  'service-role/AWSLambdaBasicExecutionRole'
),
```

**Impact:** Low - Code readability

---

### 19. Missing Comment Explanation

**File:** `lib/tap-stack.ts`

**Issue:**
No explanation for why `reservedConcurrentExecutions` was removed.

**Fix:**
Added explanatory comment:
```typescript
// Note: Removed reservedConcurrentExecutions to use account-level unreserved capacity
// This allows Lambda to scale automatically while respecting account limits
```

**Impact:** Low - Code documentation

---

### 20. Missing Documentation in updateCanaryAlarms

**File:** `lib/constructs/lambda-with-canary.ts` (Line 546-549)

**Issue:**
```typescript
public updateCanaryAlarms(alarms: cloudwatch.Alarm[]): void {
  // This method would update the deployment group with new alarms
  // In practice, you'd need to handle this through CDK updates
}
```

**Fix:**
Added additional documentation:
```typescript
public updateCanaryAlarms(_alarms: cloudwatch.Alarm[]): void {
  // This method would update the deployment group with new alarms
  // In practice, you'd need to handle this through CDK updates
  // Note: CDK doesn't support updating alarms after deployment group creation
}
```

**Impact:** Low - Code documentation
