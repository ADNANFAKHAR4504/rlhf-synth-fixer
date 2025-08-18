# Infrastructure Code Issues and Fixes

## Critical Issues Fixed

### 1. Missing Environment Suffix Support
**Issue**: The original code did not include environment suffix in resource names, causing conflicts when deploying multiple environments.

**Fix**: Added `environmentSuffix` variable from environment or Pulumi config, and appended it to all resource names:
```typescript
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix') || 'dev';
const bucket = new aws.s3.Bucket(`myproject-prod-s3-${purpose}-${environmentSuffix}`, ...)
```

### 2. Resources Not Destroyable
**Issue**: Resources lacked deletion policies, preventing clean teardown in testing environments.

**Fixes**:
- Added `forceDestroy: true` to S3 buckets to allow deletion with objects
- Added `deletionWindowInDays: 7` to KMS key for scheduled deletion
- Set `recoveryWindowInDays: 0` for Secrets Manager for immediate deletion

### 3. Using Deprecated AWS APIs
**Issue**: Code used deprecated Pulumi AWS provider APIs that generate warnings.

**Fixes**:
- Changed `BucketVersioningV2` to `BucketVersioning`
- Changed `BucketServerSideEncryptionConfigurationV2` to `BucketServerSideEncryptionConfiguration`

### 4. IAM Policy Malformation
**Issue**: Lambda custom IAM policy had incorrect Resource specification causing deployment failures.

**Fix**: Corrected the policy to properly reference the KMS key ARN as an array:
```typescript
Resource: [s3KmsKey.arn] // Changed to array format
```

### 5. Lambda Function Security Gaps
**Issue**: Lambda function's secure logging was incomplete and could potentially leak sensitive data.

**Fix**: Enhanced the secure logging function to filter more sensitive patterns:
```typescript
const sensitiveKeys = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY', 
    'AWS_SESSION_TOKEN',
    'password',
    'secret',
    'apiKey',
    'token',
    'credential'
];
```

### 6. Missing GuardDuty Configuration
**Issue**: GuardDuty detector lacked proper configuration for Lambda protection and finding frequency.

**Fix**: Added `findingPublishingFrequency` parameter to GuardDuty detector:
```typescript
findingPublishingFrequency: 'FIFTEEN_MINUTES'
```

### 7. Incomplete Resource Exports
**Issue**: Missing important resource exports needed for integration testing.

**Fixes Added**:
- `lambdaFunctionArn` - For invoking Lambda in tests
- `kmsKeyArn` - For KMS operations in tests
- `lambdaRoleArn` - For IAM verification in tests

### 8. Certificate Configuration
**Issue**: ACM certificate configuration was basic and didn't utilize modern security features.

**Note**: While post-quantum cryptography (ML-KEM) support is automatic in newer ACM certificates, the configuration could be enhanced with elliptic curve algorithms for better current security.

## Summary

The main issues centered around:
1. **Multi-environment support** - Critical for CI/CD pipelines
2. **Resource cleanup** - Essential for testing environments
3. **API modernization** - Using current best practices
4. **Security enhancements** - Proper credential handling and logging
5. **Testing support** - Comprehensive exports for validation

These fixes ensure the infrastructure is production-ready, testable, and follows AWS and Pulumi best practices.