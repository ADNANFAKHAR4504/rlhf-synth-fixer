# Common Model Failures - Serverless Image Processing Infrastructure

This document catalogs typical failure patterns and implementation errors encountered when building serverless image processing pipelines with AWS CDK, along with their solutions and prevention strategies.

---

## Failure: Lambda Missing SNS Publish Permissions

**Issue**: The model created an SNS topic and a Lambda function that is expected to publish messages upon task completion. However, it failed to attach the required `sns:Publish` permission to the Lambda's IAM role.

**Expected Fix**:

Grant the Lambda function publish access to the SNS topic:

```ts
notificationTopic.grantPublish(imageProcessorLambda);
```

**Failure Point**: Integration tests fail when Lambda attempts to publish to SNS — results in `AccessDenied` error during execution.

---

## Failure: Incorrect S3 Bucket Handling

**Issue**: The model created a new S3 bucket, even though the requirement specifies using an existing bucket with versioning enabled.

**Expected Fix**:

Replace the incorrect S3 resource creation:

```ts
const imageBucket = new s3.S3Bucket(this, 'ImageBucket', {
  bucketPrefix: 'image-bucket',
});
```

With a proper reference to an existing bucket:

```ts
const imageBucket = s3.S3Bucket.fromBucketName(this, 'ImageBucket', 'existing-bucket-name');
```

**Failure Point**: Deployment fails due to naming conflicts or unauthorized attempts to create infrastructure not permitted in the QA environment.

---

## Failure: Missing Lambda Environment Variables

**Issue**: The Lambda function depends on environment variables (e.g., SNS topic ARN, bucket name), but the model did not include them.

**Expected Fix**:

Add `environment` block to the Lambda function definition:

```ts
environment: {
  SNS_TOPIC_ARN: notificationTopic.arn,
  BUCKET_NAME: imageBucket.bucket,
},
```

**Failure Point**: Lambda runtime errors due to missing environment configuration.

---

## Failure: Lambda Runtime Not Specified Correctly

**Issue**: Lambda was created without explicitly setting the runtime or used an unsupported runtime.

**Expected Fix**:

Specify supported Node.js runtime explicitly:

```ts
runtime: lambda.Runtime.NODEJS_18_X,
```

**Failure Point**: CDK build or synth fails with runtime validation errors.

---

## Failure: No REST API Defined

**Issue**: The model missed defining the API Gateway REST endpoint, even though the requirement clearly stated that an API Gateway POST endpoint should trigger the Lambda.

**Expected Fix**:

Add an API Gateway REST API and integration:

```ts
const api = new apigateway.RestApi(this, 'ImageApi');
const process = api.root.addResource('process');
process.addMethod('POST', new apigateway.LambdaIntegration(imageProcessorLambda));
```

**Failure Point**: Integration tests fail to connect to the API endpoint — `404 Not Found` returned.

---

## Failure: IAM Role Too Permissive

**Issue**: The IAM role for Lambda used `*` for actions or resources instead of adhering to the least privilege principle.

**Expected Fix**:

Instead of:

```ts
lambdaRole.addToPolicy(new iam.PolicyStatement({
  actions: ['s3:*', 'sns:*'],
  resources: ['*'],
}));
```

Use:

```ts
imageBucket.grantReadWrite(imageProcessorLambda);
notificationTopic.grantPublish(imageProcessorLambda);
```

**Failure Point**: Lint or QA policy check rejects overly permissive IAM roles.

---

## Failure: No Resource Tags

**Issue**: None of the resources include environment tags required for tracking and cleanup in QA pipelines.

**Expected Fix**:

Apply consistent tagging:

```ts
Tags.of(this).add('Environment', 'Test');
```

**Failure Point**: QA deploy fails due to missing mandatory metadata.

---

## Summary

The common failure patterns identified above highlight critical areas where models frequently struggle when implementing serverless image processing infrastructure:

### Key Failure Categories

1. **Security & Permissions** - Overly broad IAM policies or missing permissions
2. **Configuration Issues** - Missing environment variables and runtime settings
3. **Infrastructure Misunderstanding** - Creating new resources instead of referencing existing ones
4. **Integration Gaps** - Missing API Gateway endpoints or SNS integrations
5. **Compliance Violations** - Missing required tags and metadata

### Prevention Strategies

- Always use CDK's built-in `grant*` methods for least-privilege access
- Reference existing resources using `fromBucketName` or similar patterns
- Include comprehensive environment variable configuration
- Explicitly specify runtime versions and handler paths
- Apply consistent resource tagging for QA compliance

### Testing Requirements

All implementations must pass:
- Unit tests validating stack resource creation
- Integration tests confirming end-to-end functionality  
- Linting and security policy checks
- QA pipeline compliance validation

These failure examples serve as a reference for avoiding common pitfalls and ensuring robust, secure infrastructure implementations.
