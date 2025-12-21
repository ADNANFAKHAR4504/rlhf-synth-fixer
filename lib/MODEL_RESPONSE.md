# CDK Infrastructure Stack Implementation

## Implementation Overview
Created a CDK TypeScript stack (`TapStack`) that provisions S3, Lambda, and IAM resources with full LocalStack compatibility.

## Architecture Components

### 1. S3 Bucket (`TapBucket`)
- **Encryption**: S3-managed encryption enabled
- **Access Control**: Block all public access
- **Versioning**: Enabled for AWS, disabled for LocalStack
- **Cleanup**: Auto-delete objects in LocalStack environments
- **Naming**: Dynamic naming for AWS, auto-generated for LocalStack

### 2. Lambda Function (`ProcessingFunction`) 
- **Runtime**: Node.js 18.x
- **Handler**: Inline code for event processing
- **Environment Variables**: 
  - `BUCKET_NAME`: S3 bucket reference
  - `IS_LOCALSTACK`: Environment detection flag
- **Permissions**: Read/write access to S3 bucket

### 3. IAM Role (`TapRole`)
- **Service Principal**: Lambda service
- **Managed Policies**: AWS Lambda basic execution role
- **Custom Permissions**: S3 access granted via bucket policy

## LocalStack Compatibility Features

### Environment Detection
```typescript
const isLocalStack =
  propsIsLocalStack ??
  (process.env.CDK_LOCAL === 'true' ||
    process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
    process.env.LOCALSTACK_HOSTNAME !== undefined);
```

### Resource Configuration
- **Removal Policy**: `DESTROY` for LocalStack, `RETAIN` for AWS
- **Bucket Naming**: Undefined for LocalStack (auto-generated)
- **Versioning**: Disabled for LocalStack to avoid issues

## Stack Outputs
1. **BucketName**: S3 bucket identifier
2. **FunctionArn**: Lambda function ARN for invocation
3. **RoleArn**: IAM role ARN for reference

## Design Decisions
- Used inline Lambda code for simplicity and LocalStack compatibility
- Implemented environment-aware resource configuration
- Followed AWS CDK best practices for resource naming and policies
- Ensured clean resource cleanup in LocalStack environments
