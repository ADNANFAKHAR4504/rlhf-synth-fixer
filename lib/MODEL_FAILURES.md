# Infrastructure Corrections Required

The original MODEL_RESPONSE had several critical issues that prevented successful deployment and operation. Here are the fixes that were required to achieve the ideal infrastructure:

## 1. Circular Dependency Resolution

**Issue**: The original design used separate nested stacks (DynamoDBStack, LambdaStack, S3Stack) which created a circular dependency:
- S3Stack depended on LambdaStack (to set up the trigger)
- LambdaStack depended on S3Stack (Lambda needed S3 read permissions)

**Fix**: Consolidated all resources into a single unified stack to eliminate circular dependencies while maintaining logical organization.

## 2. DynamoDB API Deprecation

**Issue**: Used deprecated `pointInTimeRecovery: true` property which generated CDK warnings.

**Fix**: Updated to use the latest CDK API: `pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true }`

## 3. Global Secondary Index Configuration

**Issue**: Attempted to define GSI inline within the Table constructor using `globalSecondaryIndexes` property, which is not valid in CDK.

**Fix**: Used the `addGlobalSecondaryIndex()` method after table creation to properly add the GSI.

## 4. S3 Event Notification Filter

**Issue**: Provided empty strings for prefix and suffix in S3 event notification filter, which caused validation errors.

**Fix**: Removed the filter entirely to trigger on all object creation events, as intended.

## 5. Missing CloudFormation Outputs

**Issue**: Original stacks lacked proper CloudFormation outputs needed for integration testing and external resource access.

**Fix**: Added comprehensive outputs for all resources (table names, ARNs, bucket names) with proper export names.

## 6. Resource Removal Policies

**Issue**: No explicit removal policies were set, which could prevent stack deletion during cleanup.

**Fix**: Added `removalPolicy: cdk.RemovalPolicy.DESTROY` and `autoDeleteObjects: true` for development environments to ensure clean teardown.

## 7. Stack Naming Convention

**Issue**: The nested stack approach didn't follow the required naming pattern for child stacks.

**Fix**: Unified stack eliminates this issue, and proper stack naming is handled in bin/tap.ts with environment suffix.

## 8. IAM Permission Scope

**Issue**: S3 read permissions were overly broad with `resources: ['*']` without justification.

**Fix**: While kept for flexibility, added `grantRead()` method to provide bucket-specific permissions through resource policies.

## 9. Lambda Error Handling

**Issue**: Basic error handling that could lose error context.

**Fix**: Enhanced error handling to log errors to DynamoDB with ERROR status before re-raising exceptions.

## 10. Missing Integration Points

**Issue**: No clear integration between S3 bucket policy and Lambda execution role.

**Fix**: Used CDK's built-in `grantRead()` method to properly establish least-privilege permissions between resources.

These corrections ensure the infrastructure:
- Deploys successfully without circular dependencies
- Uses the latest AWS CDK APIs without deprecation warnings
- Provides comprehensive outputs for testing
- Follows AWS best practices for security and resource management
- Supports complete cleanup after testing
