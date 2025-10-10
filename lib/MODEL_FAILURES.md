# Model Failures and Required Fixes

## Infrastructure Code Issues that Prevented Deployment

### 1. Import Module Errors
**Issue**: The infrastructure code imported `logs` from `pulumi_aws` which doesn't exist as a direct import.
**Solution**: Changed to import `cloudwatch` and use it for LogGroup creation.

### 2. API Gateway Configuration Errors
**Issue**: Used incorrect parameter names throughout API Gateway resources:
- `rest_api_id` instead of `rest_api` for RequestValidator, Model, Resource, Method, Integration, and Deployment
- `stage_name` parameter in Deployment (should be separate Stage resource)

**Solution**:
- Replaced all `rest_api_id` with `rest_api`
- Created separate Stage resource for API deployment

### 3. Lambda Reserved Environment Variables
**Issue**: Attempted to set `AWS_REGION` environment variable which is reserved by AWS Lambda.
**Solution**: Changed environment variable name from `AWS_REGION` to `REGION`.

### 4. Invalid Lambda Permission ARN
**Issue**: Used wildcard "*" for account ID in source ARN which failed validation.
**Solution**: Used actual AWS account ID (342597974367) in the ARN construction.

### 5. Missing Resource Dependencies
**Issue**: IntegrationResponse resources were created before their dependent Integration resources existed.
**Solution**: Added explicit `depends_on` parameters to ensure proper creation order.

### 6. Python Module Path Resolution
**Issue**: Pulumi couldn't find the lib module during execution.
**Solution**: Added sys.path manipulation to include the project directory.

### 7. Missing Environment Suffix Configuration
**Issue**: Environment suffix wasn't properly retrieved from environment variables.
**Solution**: Updated to check ENVIRONMENT_SUFFIX environment variable first.

### 8. SSM Parameter Overwrite Issues
**Issue**: SSM Parameters failed during redeployment because they already existed without overwrite permission.
**Solution**: Added `overwrite=True` parameter to all SSM Parameter resources to allow updates during redeployment.

### 9. CloudWatch Log Group Conflicts
**Issue**: CloudWatch Log Group creation failed due to existing resources from previous deployments.
**Solution**: Removed `skip_destroy=True` option to allow proper cleanup and recreation of log groups.

### 10. Integration Test Stack Output Dependencies
**Issue**: Integration tests relied on Pulumi stack outputs that weren't properly exported or accessible due to passphrase issues.
**Solution**: Modified integration tests to use dynamic resource discovery through AWS APIs instead of relying on Pulumi stack outputs, making tests truly dynamic and robust.

### 11. Resource Naming with Random Suffixes
**Issue**: Pulumi automatically adds random suffixes to resource names, making them unpredictable for integration testing.
**Solution**: Updated integration tests to use pattern matching and AWS API calls to discover resources by name patterns rather than exact names.

### 12. Region Configuration Consistency Issues
**Issue**: Multiple files had inconsistent region configurations (us-west-2, us-east-2, us-east-1) causing integration tests to fail when infrastructure was deployed in different regions.
**Solution**: Standardized all region references to us-east-1 across infrastructure code, integration tests, unit tests, and configuration files.

### 13. Missing Dependencies for Lambda Runtime
**Issue**: Lambda functions were missing required dependencies (aws-xray-sdk) causing unit tests to be skipped and runtime errors.
**Solution**: Added aws-xray-sdk to Pipfile dependencies and ensured proper dependency management for Lambda runtime environment.

### 14. Lambda Deployment Package vs Source Directory
**Issue**: Initial attempts to create deployment packages for Lambda functions created complexity and path resolution issues.
**Solution**: Reverted to using source directory deployment with Pulumi AssetArchive, which handles dependency packaging automatically for simple Lambda functions.

### 15. Integration Test Environment Variable Dependencies
**Issue**: Integration tests failed due to reliance on environment variables and hardcoded region expectations.
**Solution**: Updated integration tests to use dynamic region detection and fallback to standard defaults consistently across all test files.

## Summary
The original infrastructure code had multiple configuration and dependency issues that prevented successful deployment to AWS. Additional issues were discovered during integration testing, redeployment scenarios, and region consistency requirements. All issues were resolved through iterative fixes during the deployment process, including dependency management, region standardization, and test environment configuration, resulting in a fully functional serverless logistics tracking API with comprehensive integration testing.
