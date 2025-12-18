# Infrastructure Issues Fixed in MODEL_RESPONSE

## 1. CDK API Incompatibilities

### Issue: S3 Express One Zone Storage Class
**Original Code:**
```typescript
storageClass: s3.StorageClass.EXPRESS_ONEZONE
```

**Problem:** The `EXPRESS_ONEZONE` storage class does not exist in the current version of AWS CDK. This caused TypeScript compilation errors.

**Solution:**
```typescript
storageClass: s3.StorageClass.INTELLIGENT_TIERING
```
Used `INTELLIGENT_TIERING` as an alternative for performance optimization, as S3 Express One Zone is not yet available in CDK.

## 2. API Gateway Resource Policy Attachment

### Issue: Incorrect Method for Attaching Resource Policy
**Original Code:**
```typescript
// Create API Gateway first
this.api = new apigateway.RestApi(this, 'CorpUserDataApi', {...});

// Create resource policy separately
const resourcePolicy = new iam.PolicyDocument({...});

// Try to attach policy using non-existent method
this.api.attachPolicy(resourcePolicy);
```

**Problem:** The `attachPolicy()` method does not exist on the RestApi class. This caused TypeScript compilation errors.

**Solution:**
```typescript
// Create resource policy first
const resourcePolicy = new iam.PolicyDocument({...});

// Pass policy directly in RestApi constructor
this.api = new apigateway.RestApi(this, 'CorpUserDataApi', {
  // ... other properties
  policy: resourcePolicy,
});
```
The resource policy must be provided during API Gateway creation through the `policy` property in the constructor.

## 3. S3 RenameObject API Unavailability

### Issue: Using Non-existent S3 API
**Original Lambda Code:**
```javascript
const { S3Client, PutObjectCommand, RenameObjectCommand } = require('@aws-sdk/client-s3');
// ... 
const renameCommand = new RenameObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    SourceKey: key,
    DestinationKey: processedKey,
});
```

**Problem:** The `RenameObjectCommand` does not exist in the AWS SDK. The S3 RenameObject API mentioned in the requirements is not yet widely available.

**Solution:**
```javascript
const { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
// ... 
// Copy the object to new location
const copyCommand = new CopyObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    CopySource: `${process.env.BUCKET_NAME}/${key}`,
    Key: processedKey,
});
await s3Client.send(copyCommand);

// Delete the original object
const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: key,
});
await s3Client.send(deleteCommand);
```
Implemented the standard copy/delete pattern to achieve the same file organization functionality.

## 4. Missing Stack Output Exports

### Issue: Outputs Not Available in Parent Stack
**Original Code:**
```typescript
// In TapStack
new ServerlessStack(this, 'ServerlessInfrastructure', {
  environmentSuffix: environmentSuffix,
  env: props?.env,
});
// No outputs exported from parent stack
```

**Problem:** The nested stack's outputs were not being exported from the parent stack, making them unavailable in the deployment outputs (cfn-outputs).

**Solution:**
```typescript
// In TapStack
const serverlessStack = new ServerlessStack(this, 'ServerlessInfrastructure', {
  environmentSuffix: environmentSuffix,
  env: props?.env,
});

// Export outputs from nested stack to parent stack
new cdk.CfnOutput(this, 'BucketName', {
  value: serverlessStack.bucket.bucketName,
  description: 'Name of the S3 bucket',
  exportName: `${this.stackName}-BucketName`,
});
// ... similar for other outputs
```
Added explicit CloudFormation outputs in the parent stack to ensure all resource identifiers are available for integration testing.

## 5. IAM Permission Issues

### Issue: Including Non-existent S3 Permission
**Original Code:**
```typescript
actions: [
  's3:GetObject',
  's3:PutObject',
  's3:DeleteObject',
  's3:GetObjectVersion',
  's3:PutObjectAcl',
  's3:GetObjectAcl',
  's3:RenameObject', // New S3 RenameObject API
]
```

**Problem:** The `s3:RenameObject` permission does not exist in AWS IAM, causing potential deployment issues.

**Solution:**
```typescript
actions: [
  's3:GetObject',
  's3:PutObject',
  's3:DeleteObject',
  's3:GetObjectVersion',
  's3:PutObjectAcl',
  's3:GetObjectAcl',
]
```
Removed the non-existent permission. The copy/delete pattern uses existing permissions that are already included.

## Summary

The main issues were related to using AWS features that are either not yet available in the current CDK version or don't exist in AWS yet. The fixes ensure the infrastructure:
- Compiles successfully with TypeScript
- Deploys without errors to AWS
- Provides all required functionality using available AWS services
- Properly exports outputs for integration testing
- Follows AWS best practices for resource management
