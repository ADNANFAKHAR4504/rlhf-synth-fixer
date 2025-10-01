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

## Summary
The original infrastructure code had multiple configuration and dependency issues that prevented successful deployment to AWS. All issues were resolved through iterative fixes during the deployment process, resulting in a fully functional serverless logistics tracking API.