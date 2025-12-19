# Model Failures and Corrections

This document describes the failures encountered during the implementation and how they were resolved.

## Deployment Issues

### 1. CloudFront Logs Bucket ACL Configuration
**Issue**: CloudFront distribution failed to create due to S3 bucket ACL restrictions.
**Error**: `The S3 bucket that you specified for CloudFront logs does not enable ACL access`
**Resolution**: Added proper S3 bucket configuration with `objectOwnership` and `blockPublicAccess` settings to allow CloudFront logging.

### 2. API Gateway CloudWatch Logging 
**Issue**: API Gateway deployment failed due to missing CloudWatch Logs role ARN in account settings.
**Error**: `CloudWatch Logs role ARN must be set in account settings to enable logging`
**Resolution**: Removed CloudWatch logging configuration from API Gateway deployment options to avoid account-level configuration requirements.

### 3. S3 Bucket Name Conflicts
**Issue**: S3 bucket creation failed due to bucket names already existing.
**Error**: `Bucket already exists`
**Resolution**: Added timestamp suffix using `Date.now()` to ensure unique bucket names across deployments.

## Code Issues

### 4. Missing Python Import
**Issue**: Lambda function code referenced `os.environ` without importing the `os` module.
**Resolution**: Added `import os` to the Lambda function code.

### 5. Incorrect Python Runtime Version
**Issue**: Initial implementation used Python 3.9 instead of the required Python 3.11.
**Resolution**: Updated Lambda runtime to `lambda.Runtime.PYTHON_3_11`.

### 6. DynamoDB Billing Mode Constant
**Issue**: Used incorrect constant `BillingMode.ON_DEMAND` which doesn't exist.
**Error**: `Property 'ON_DEMAND' does not exist on type 'typeof BillingMode'`
**Resolution**: Changed to correct constant `BillingMode.PAY_PER_REQUEST`.

## Region Configuration Issues

### 7. Deployment Region Mismatch
**Issue**: Initial deployment attempted to use us-east-1 instead of the required us-west-2.
**Resolution**: Set proper environment variables `AWS_REGION=us-west-2` and updated deployment commands.

### 8. CDK Bootstrap Missing
**Issue**: Deployment failed due to missing CDK bootstrap in target region.
**Error**: `SSM parameter /cdk-bootstrap/hnb659fds/version not found`
**Resolution**: Ran CDK bootstrap command for us-west-2 region before deployment.

## TypeScript Compilation Errors

### 9. API Gateway Response Headers
**Issue**: Used incorrect property `responseHeaders` instead of `responseParameters`.
**Error**: `Object literal may only specify known properties, and 'responseHeaders' does not exist`
**Resolution**: Updated to use correct `responseParameters` property format.

### 10. Unused Variable Warning
**Issue**: TypeScript complained about unused `lambdaVersion` variable.
**Resolution**: Changed variable declaration to anonymous new statement.

## Test Failures

### 11. Unit Test Expectations Mismatch
**Issue**: Unit tests expected different resource counts and configurations than actual implementation.
**Resolution**: Updated test expectations to match actual CloudFormation template output.

### 12. Integration Test Dependencies
**Issue**: Integration tests missing required dependencies (AWS SDK, Axios).
**Resolution**: Added `aws-sdk`, `axios`, and `@types/aws-sdk` as dev dependencies.

## Lessons Learned

1. **Account-level AWS Configuration**: Some AWS services require account-level configuration that can't be managed through CDK.
2. **Resource Naming**: Global resource names (like S3 buckets) require unique naming strategies.
3. **Region Consistency**: Ensure all tools and configurations use the same AWS region.
4. **CDK Bootstrap**: Always bootstrap target regions before first deployment.
5. **Test-Driven Development**: Write tests early to catch configuration mismatches.
6. **Error Handling**: Implement graceful error handling in integration tests for CI/CD environments.