# Infrastructure Issues and Fixes

## Critical Issues Fixed

### 1. Environment Suffix Configuration
**Issue**: Resources used hardcoded bucket names causing conflicts in multi-environment deployments.
**Fix**: Added environment suffix configuration to all resource names using `os.Getenv("ENVIRONMENT_SUFFIX")` with a default fallback value.

### 2. AWS Config Package Import
**Issue**: Incorrect import path `github.com/pulumi/pulumi-aws/sdk/v6/go/aws/config` doesn't exist.
**Fix**: Changed to correct package `github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cfg` for AWS Config resources.

### 3. AWS Config Resource Types
**Issue**: Used non-existent types like `config.NewConfigurationRecorder` and `config.ConfigurationRecorderArgs`.
**Fix**: Updated to correct types: `cfg.NewRecorder`, `cfg.RecorderArgs`, and related configuration types.

### 4. Config Recorder Status
**Issue**: AWS Config recorder wasn't being started after creation.
**Fix**: Added `cfg.NewRecorderStatus` resource to start the recorder after delivery channel creation.

### 5. S3 Object Lock Configuration
**Issue**: Attempted to configure Object Lock on existing bucket which isn't supported.
**Fix**: Removed Object Lock configuration as it must be enabled at bucket creation time, updated export to reflect this limitation.

### 6. AWS Config Bucket Policy
**Issue**: Config service couldn't write to S3 bucket due to missing permissions.
**Fix**: Added comprehensive bucket policy for AWS Config with GetBucketAcl, ListBucket, and PutObject permissions.

### 7. CloudTrail Resource Reference
**Issue**: CloudTrail ARN was hardcoded instead of using actual resource reference.
**Fix**: Changed to use `cloudTrailResource.Arn` for dynamic ARN retrieval.

### 8. Missing OS Package Import
**Issue**: Code used `os.Getenv()` without importing the os package.
**Fix**: Added `"os"` to the import statements.

### 9. Resource Naming Conflicts
**Issue**: All IAM roles, policies, and instance profiles had static names causing conflicts.
**Fix**: Added environment suffix to all IAM resource names for unique identification.

### 10. Config Recorder Dependencies
**Issue**: Config recorder status was created without proper dependency management.
**Fix**: Added `pulumi.DependsOn([]pulumi.Resource{deliveryChannel})` to ensure proper resource creation order.

## Security Enhancements

1. **Bucket Naming**: Changed from static to dynamic names with environment suffix
2. **Policy Scope**: Ensured all IAM policies are scoped to specific resources
3. **Compliance Exports**: Added boolean exports for all security features
4. **Resource Tagging**: Maintained consistent tagging across all resources

## Testing Improvements

1. **Unit Tests**: Added comprehensive unit tests covering all resource configurations
2. **Integration Tests**: Created integration tests that validate actual AWS deployments
3. **Coverage**: Achieved proper test coverage for all infrastructure code
4. **Environment Testing**: Tests validate environment suffix configuration