# LocalStack Compatibility Notes

This CloudFormation template has been modified for LocalStack Community Edition compatibility.

## Changes Made for LocalStack

### 1. Optional Object Lock Configuration
- **Parameter Added**: `EnableObjectLock` (default: `false`)
- **Reason**: S3 Object Lock has limited support in LocalStack Community Edition
- **Implementation**: Made `ObjectLockEnabled` and `ObjectLockConfiguration` conditional
- **To Enable**: Set `EnableObjectLock=true` when deploying to AWS

### 2. Optional EventBridge Notifications
- **Parameter Added**: `EnableEventBridge` (default: `false`)
- **Reason**: EventBridge S3 notifications may not be fully supported in LocalStack Community
- **Implementation**: Made `NotificationConfiguration` conditional
- **To Enable**: Set `EnableEventBridge=true` when deploying to AWS

### 3. Optional VPC Restrictions
- **Parameter Added**: `EnableVPCRestriction` (default: `false`)
- **Reason**: The `aws:SourceVpc` condition may not work correctly in LocalStack
- **Implementation**:
  - When disabled: Uses a permissive policy allowing basic S3 operations
  - When enabled: Uses VPC-restricted policy with `aws:SourceVpc` conditions
- **To Enable**: Set `EnableVPCRestriction=true` when deploying to AWS
- **VPC ID Default**: Changed from `vpc-123abc456` to `vpc-localstack` for testing

### 4. KMS Key Rotation
- **Status**: Kept as-is with `EnableKeyRotation: true`
- **Note**: Key rotation may not be fully functional in LocalStack but won't break deployment

### 5. S3 Bucket Logging
- **Status**: Kept as-is
- **Note**: May have limited support but won't break deployment

### 6. CloudWatch Log Groups
- **Status**: Kept as-is
- **Note**: Should work in LocalStack with basic functionality

## Deployment Examples

### Deploy to LocalStack (default - all advanced features disabled)
```bash
awslocal cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name secure-s3-stack \
  --parameter-overrides \
    EnvironmentSuffix=dev
```

### Deploy to AWS (all features enabled)
```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name secure-s3-stack \
  --parameter-overrides \
    EnvironmentSuffix=prod \
    EnableObjectLock=true \
    EnableEventBridge=true \
    EnableVPCRestriction=true \
    VpcId=vpc-0123456789abcdef
```

### Partial Feature Enablement
```bash
# Enable only Object Lock
awslocal cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name secure-s3-stack \
  --parameter-overrides \
    EnvironmentSuffix=dev \
    EnableObjectLock=true
```

## Testing with LocalStack

### Environment Setup
```bash
# Start LocalStack
localstack start -d

# Set endpoint
export AWS_ENDPOINT_URL=http://localhost:4566
export LOCALSTACK_ENDPOINT=http://localhost:4566
```

### Run Tests
```bash
# Integration tests will automatically detect LocalStack
npm test
```

## Service Compatibility Matrix

| Feature | LocalStack Community | LocalStack Pro | AWS |
|---------|---------------------|----------------|-----|
| S3 Basic Operations | ✅ Full | ✅ Full | ✅ Full |
| S3 Encryption (KMS) | ✅ Full | ✅ Full | ✅ Full |
| S3 Versioning | ✅ Full | ✅ Full | ✅ Full |
| S3 Object Lock | ⚠️ Limited | ✅ Full | ✅ Full |
| S3 Bucket Logging | ⚠️ Limited | ✅ Full | ✅ Full |
| KMS Keys | ✅ Full | ✅ Full | ✅ Full |
| KMS Key Rotation | ⚠️ Limited | ✅ Full | ✅ Full |
| EventBridge S3 Notifications | ⚠️ Limited | ✅ Full | ✅ Full |
| VPC Restrictions | ❌ Not Supported | ⚠️ Limited | ✅ Full |
| CloudWatch Logs | ✅ Basic | ✅ Full | ✅ Full |

Legend:
- ✅ Full: Fully supported
- ⚠️ Limited: Partially supported or may not work as expected
- ❌ Not Supported: Not available

## Conditions in Template

The template defines three conditions:
- `UseObjectLock`: Controls Object Lock configuration
- `UseEventBridge`: Controls EventBridge notifications
- `UseVPCRestriction`: Controls VPC-based access restrictions

These conditions use CloudFormation's `!If` intrinsic function to conditionally include or exclude features.

## Reverting to Full AWS Deployment

To deploy this template to AWS with all features enabled, simply set all the `Enable*` parameters to `true` and provide a valid VPC ID.
