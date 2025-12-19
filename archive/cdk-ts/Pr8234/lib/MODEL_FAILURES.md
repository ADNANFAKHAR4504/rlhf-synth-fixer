## Issues Encountered During Implementation

### 1. CDK Aspect Priority Conflicts

**Problem**: Initial implementation had conflicts between custom tagging aspects and CDK's built-in tagging mechanisms.

**Fix**: Set explicit priority on the TaggingAspect to ensure it runs before default CDK tags. Used `{ priority: 100 }` in the `Aspects.of().add()` call to give it higher priority.

### 2. CloudTrail S3 Bucket Permissions

**Problem**: CloudTrail failed to write logs to the S3 bucket due to missing permissions on both the bucket policy and KMS key policy.

**Fixes Applied**:
- Added S3 bucket policy statements to allow CloudTrail service principal to perform `s3:PutObject` and `s3:GetBucketAcl` actions with appropriate conditions (`aws:SourceAccount` and `s3:x-amz-acl`)
- Added KMS key policy statement to allow CloudTrail service principal to use `kms:Decrypt` and `kms:GenerateDataKey*` actions with `aws:SourceAccount` condition

### 3. CloudWatch Logs KMS Key Permissions

**Problem**: CloudWatch Logs service couldn't encrypt log groups using the KMS key due to missing key policy permissions.

**Fix**: Added explicit policy statement in `SecureKmsKey` construct to allow `logs.REGION.amazonaws.com` service principal with proper encryption context condition matching the log group ARN pattern.

### 4. KMS Alias Removal Policy

**Problem**: KMS aliases couldn't be deleted during stack rollback, causing deployment failures.

**Fix**: Added `removalPolicy: cdk.RemovalPolicy.DESTROY` to KMS alias resources within the `SecureKmsKey` construct.

### 5. Removal Policy Configuration

**Problem**: Original implementation used `RETAIN` removal policy for all resources, making cleanup difficult during testing.

**Fix**: Changed removal policies to `DESTROY` for S3 buckets, CloudWatch Log Groups, CloudTrail resources, and KMS aliases to allow easier stack cleanup in non-production environments.

### 6. AWS Config Service Limits

**Problem**: AWS Config recorder deployment failed due to hitting account-level limits (maximum 1 recorder per region).

**Fix**: Removed AWS Config related resources entirely from the implementation. The original requirement for Config was noted but not implemented due to account constraints.

### 7. CloudTrail Regional Limits

**Problem**: Initial deployments failed because AWS accounts have a limit of 5 CloudTrail trails per region, and the target regions were at capacity.

**Fix**: Required manual cleanup of existing CloudTrail trails in the target region before successful deployment. The implementation supports CloudTrail but deployment requires available trail capacity.

### 8. Service Control Policies (SCPs)

**Problem**: SCPs require AWS Organizations to be enabled and configured, which may not be available in all account configurations.

**Fix**: Commented out SCP implementation with clear comments explaining the requirement. Left the code structure in place for organizations that have AWS Organizations enabled.

### 9. Tagging Aspect Type Error

**Problem**: TypeScript compilation error when using `IConstruct` interface from CDK namespace.

**Fix**: Changed to use `Construct` class from 'constructs' package instead of `cdk.IConstruct` in the TaggingAspect visit method signature.

### 10. CloudTrail Event Selectors Method Signature

**Problem**: Incorrect method signature for `trail.addEventSelector()` caused compilation errors.

**Fix**: Updated to use correct signature with `DataResourceType`, data resource values array, and options object as separate parameters.

### 11. Stack Naming Convention

**Problem**: Stack initialization needed to respect existing `TapStack` naming convention with environment suffix.

**Fix**: Updated `bin/tap.ts` to construct stack name as `TapStack${environmentSuffix}` and pass both `stackName` and `environmentSuffix` props to the TapStack constructor.
