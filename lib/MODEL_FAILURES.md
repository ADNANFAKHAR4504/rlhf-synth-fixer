# Model Failures and Corrections

This document tracks issues encountered during implementation and their resolutions for training improvement.

## Issue 1: DynamoDB State Lock Table Missing

### What Went Wrong

Initial deployment failed with error about missing DynamoDB table for Terraform state locking.

**Evidence**:
- Error message: `ResourceNotFoundException: Requested resource not found. Unable to retrieve item from DynamoDB table "terraform-state-lock"`
- Deployment failure in CI/CD pipeline

### Root Cause

The CDKTF S3Backend was configured with `dynamodb_table="terraform-state-lock"` parameter, but:
1. This parameter is deprecated in newer Terraform versions
2. The DynamoDB table doesn't exist in the AWS account
3. S3 now has native state locking capabilities

### Correct Implementation

```python
# Configure S3 Backend conditionally
# Only configure backend if state bucket is provided (for CI/CD environments)
if state_bucket and state_bucket.strip():
    S3Backend(
        self,
        bucket=state_bucket,
        key=f"{environment_suffix}/{construct_id}.tfstate",
        region=state_bucket_region,
        encrypt=True
    )
    # Use S3's native state locking instead of deprecated dynamodb_table
    self.add_override("terraform.backend.s3.use_lockfile", True)
```

### Key Learnings

- Always check for deprecated Terraform parameters
- Use conditional backend configuration for local vs CI/CD environments
- S3 native locking is preferred over DynamoDB for state management
- Test deployment in both local and CI/CD environments

---

## Issue 2: Lambda Container Images Without ECR

### What Went Wrong

Lambda functions were configured to use container images but ECR repositories weren't being created or images weren't being pushed.

**Evidence**:
- Lambda functions configured with `package_type="Image"`
- References to ECR repository URLs that don't exist
- No Docker build or push steps in the deployment process

### Root Cause

The initial implementation assumed ECR repositories would be pre-populated with container images, but no build/push process was implemented.

### Correct Implementation

Switched from container images to ZIP-based deployment with dynamic packaging:

```python
# Package Lambda functions as ZIP files
def package_lambda(lambda_dir: str, function_name: str) -> TerraformAsset:
    """Package Lambda function as a ZIP file using TerraformAsset."""
    lambda_path = Path(__file__).parent / "lambda" / lambda_dir
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Copy Lambda code and install dependencies
        # ... packaging logic ...
        
        # Create TerraformAsset from the ZIP file
        return TerraformAsset(
            self,
            f"{function_name}_asset",
            path=str(zip_path),
            type=AssetType.FILE
        )

# Lambda function using ZIP deployment
validator_lambda = LambdaFunction(
    self,
    "validator_lambda",
    function_name=f"csv-validator-{environment_suffix}",
    role=validator_role.arn,
    runtime="python3.11",
    handler="app.handler",
    filename=validator_asset.path,
    source_code_hash=validator_asset.asset_hash,
    # ... other config
)
```

### Key Learnings

- ZIP deployment is simpler for Lambda functions without complex dependencies
- TerraformAsset handles file packaging automatically
- Container images add complexity without clear benefits for simple functions
- Dynamic packaging during synthesis avoids storing large ZIP files in git

---

## Issue 3: Missing Author Field in metadata.json

### What Went Wrong

The metadata.json file was missing the required `author` field.

**Evidence**:
- Validation scripts expecting author field
- Training quality scoring requires author attribution

### Root Cause

Initial project setup didn't include all required metadata fields.

### Correct Implementation

```json
{
  "platform": "cdktf",
  "language": "py",
  "author": "raaj1021",
  "team": "synth-2",
  // ... other fields
}
```

### Key Learnings

- Always validate metadata.json against requirements
- Author field should always be "raaj1021"
- Team field should be string "synth-2" (not a number)

---

## Issue 4: Unit Tests Expecting ECR Instead of ZIP Deployment

### What Went Wrong

Unit tests were checking for ECR repositories and container-based Lambda configuration after switching to ZIP deployment.

**Evidence**:
- Test failure: `assert "aws_ecr_repository" in resources`
- Test checking for `package_type="Image"` instead of `runtime` and `handler`

### Root Cause

Tests weren't updated after changing the deployment method from containers to ZIP files.

### Correct Implementation

```python
def test_lambda_functions_with_zip_deployment(self):
    """Test Lambda functions are created with ZIP deployment."""
    # ... setup ...
    
    # Check Lambda functions exist
    assert "aws_lambda_function" in resources
    lambda_functions = resources["aws_lambda_function"]
    
    # Verify validator Lambda with ZIP deployment
    assert "validator_lambda" in lambda_functions
    validator = lambda_functions["validator_lambda"]
    assert validator["runtime"] == "python3.11"
    assert validator["handler"] == "app.handler"
    assert "filename" in validator  # ZIP file path
```

### Key Learnings

- Keep tests synchronized with implementation changes
- Test both the presence and configuration of resources
- Use descriptive test names that match the implementation approach

---

## Issue 5: Incomplete IDEAL_RESPONSE.md

### What Went Wrong

The IDEAL_RESPONSE.md file didn't contain the complete source code from all files in the lib/ directory.

**Evidence**:
- Missing Lambda function source code
- Incomplete infrastructure code documentation
- File size much smaller than expected for comprehensive documentation

### Root Cause

Initial documentation only included high-level descriptions without complete source code.

### Correct Implementation

IDEAL_RESPONSE.md now includes:
- Complete tap.py entry point
- Full lib/tap_stack.py infrastructure code
- All Lambda function source code from lib/lambda/*/app.py
- Comprehensive implementation details
- Testing documentation
- Deployment instructions

### Key Learnings

- IDEAL_RESPONSE.md must contain ALL source code
- Include every file from lib/ directory
- Document architecture decisions and patterns
- No placeholder text or references to "see lib/ directory"

---

## Issue 6: Hardcoded AWS Region in Lambda IAM Policies

### What Went Wrong

IAM policies for Lambda functions had hardcoded AWS regions in resource ARNs.

**Evidence**:
- Resource ARNs like `arn:aws:logs:us-east-1:*:...`
- Deployment failures when using different regions

### Root Cause

Not using the `aws_region` variable consistently throughout the stack.

### Correct Implementation

```python
# Use aws_region variable in IAM policies
{
    "Effect": "Allow",
    "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
    ],
    "Resource": (
        f"arn:aws:logs:{aws_region}:*:"
        f"log-group:/aws/lambda/csv-validator-{environment_suffix}:*"
    )
}
```

### Key Learnings

- Always use variables for region-specific resources
- Test deployment in multiple regions
- Avoid hardcoding any AWS-specific values

---

## Issue 7: S3 Bucket Notification Configuration Error

### What Went Wrong

S3 bucket notification failed with "The ARN cannot be null or empty" error during deployment.

**Evidence**:
- Error: `creating S3 Bucket (transaction-csv-files-pr6875) Notification: operation error S3: PutBucketNotificationConfiguration, https response error StatusCode: 400, api error InvalidArgument: The ARN cannot be null or empty`
- Deployment failure when configuring S3 event notifications

### Root Cause

The S3 bucket notification was configured with a plain dictionary instead of using the proper CDKTF type `S3BucketNotificationLambdaFunction`.

### Correct Implementation

```python
from cdktf_cdktf_provider_aws.s3_bucket_notification import S3BucketNotification, S3BucketNotificationLambdaFunction

# S3 bucket notification - triggers Step Functions via Lambda
bucket_notification = S3BucketNotification(
    self,
    "bucket_notification",
    bucket=csv_bucket.id,
    lambda_function=[
        S3BucketNotificationLambdaFunction(
            lambda_function_arn=transformer_lambda.arn,
            events=["s3:ObjectCreated:*"],
            filter_prefix="validated/"
        )
    ],
    depends_on=[s3_lambda_permission]
)
```

### Key Learnings

- CDKTF requires using specific configuration classes for nested structures
- Import all necessary types from the provider modules
- Dictionary syntax that works in Terraform HCL may not work directly in CDKTF
- Always check the CDKTF provider documentation for proper type usage

---

## Summary of Key Improvements

1. **State Management**: Switched from deprecated DynamoDB locking to S3 native locking
2. **Lambda Deployment**: Changed from container images to ZIP deployment for simplicity
3. **Metadata Compliance**: Added all required fields to metadata.json
4. **Test Synchronization**: Updated tests to match implementation changes
5. **Documentation Completeness**: Included all source code in IDEAL_RESPONSE.md
6. **Regional Flexibility**: Used variables for all region-specific configurations
7. **S3 Notification Configuration**: Fixed type usage for bucket notification Lambda function

These corrections ensure the infrastructure is deployable, maintainable, and follows best practices for CDKTF Python implementations.