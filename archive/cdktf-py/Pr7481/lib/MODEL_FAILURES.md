# Model Failures

## 1. Lambda Container Images Instead of ZIP Packages

**Issue**: Initial code attempted to use Lambda container images which require ECR repositories that don't exist.

**Fix Applied**:
- Converted all Lambda functions to use ZIP deployment packages
- Created separate Python files for each Lambda handler
- Packaged handlers into ZIP files (lambda_upload.zip, lambda_process.zip, lambda_status.zip)
- Updated handler references to point to correct module.function format

## 2. S3 Bucket Name Conflicts

**Issue**: Hardcoded bucket name "transaction-files" caused conflicts because bucket already exists in us-west-2.

**Fix Applied**:
- Added environmentSuffix variable to ensure unique bucket names
- Pattern: `transaction-files-${var.environmentSuffix}`
- Default value uses AWS account ID: `dev-${current.account_id}`

## 3. Missing API Gateway Integrations

**Issue**: API Gateway methods were defined but integration resources were missing or not properly linked.

**Fix Applied**:
- Added explicit ApiGatewayIntegration resources for each endpoint
- Used depends_on to ensure proper resource creation order
- Linked integrations to Lambda functions with AWS_PROXY type

## 4. Circular Resource Dependencies

**Issue**: Resources had circular or undefined dependencies causing Terraform errors.

**Fix Applied**:
- Added explicit depends_on clauses for API Gateway deployment
- Ensured Lambda permissions reference correct function names
- Used lifecycle create_before_destroy for deployment resource

## 5. Incorrect Lambda Handler References

**Issue**: Lambda handlers used incorrect path references (index.handler vs actual filename).

**Fix Applied**:
- Updated handlers to match actual Python file names (lambda_upload.handler, etc.)
- Ensured ZIP file paths are correct relative to CDKTF working directory
