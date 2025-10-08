# Infrastructure Fixes Applied

## Issues Identified and Resolved

### 1. Backend Configuration Issue
**Problem**: The initial configuration used an S3 backend with partial configuration, requiring interactive input during `terraform init`.

**Error**:
```
Error: Error asking for input to configure backend "s3": bucket: EOF
"bucket": required field is not set
"key": required field is not set
"region": required field is not set
```

**Fix**: Changed backend from S3 to local for QA/testing purposes:
```hcl
backend "local" {
  path = "terraform.tfstate"
}
```

### 2. Kinesis Firehose Buffer Size Constraint
**Problem**: Dynamic partitioning requires a minimum buffer size of 64 MB, but the configuration specified 1 MB.

**Error**:
```
Error: creating Kinesis Firehose Delivery Stream: InvalidArgumentException:
BufferingHints.SizeInMBs must be at least 64 when Dynamic Partitioning is enabled.
```

**Fix**: Updated the `firehose_buffer_size` variable default value:
```hcl
variable "firehose_buffer_size" {
  description = "Firehose buffer size in MB (minimum 64 for dynamic partitioning)"
  type        = number
  default     = 64  # Changed from 1
}
```

### 3. KMS Key Policy Timing Issue
**Problem**: CloudWatch Log Groups were being created before the KMS key policy was fully applied, causing access denied errors.

**Error**:
```
Error: creating CloudWatch Logs Log Group: AccessDeniedException:
The specified KMS key does not exist or is not allowed to be used with Arn
'arn:aws:logs:us-east-2:342597974367:log-group:/aws/application/...'
```

**Fix**: Added explicit dependency to ensure KMS key policy is applied first:
```hcl
resource "aws_cloudwatch_log_group" "applications" {
  # ... other configuration ...
  depends_on = [aws_kms_key_policy.logging_key]
}

resource "aws_cloudwatch_log_group" "lambda" {
  # ... other configuration ...
  depends_on = [aws_kms_key_policy.logging_key]
}
```

### 4. Missing Environment Suffix Support
**Problem**: Resources were named without environment suffix support, making it impossible to run multiple deployments in the same AWS account without conflicts.

**Fix**: Added environment suffix variable and local name_prefix:
```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

locals {
  name_prefix = var.environment_suffix != "" ? "${var.project_name}-${var.environment_suffix}" : var.project_name
}
```

Updated all resource names to use `local.name_prefix` instead of `var.project_name`:
- KMS key alias
- S3 bucket name
- IAM role names
- Lambda function name
- Firehose delivery stream name
- CloudWatch Log Group names
- CloudWatch Insights query names

### 5. KMS Key Deletion Window
**Problem**: KMS key had a 10-day deletion window which is appropriate for production but slower for QA/testing purposes.

**Fix**: Reduced deletion window to minimum (7 days) for faster cleanup:
```hcl
resource "aws_kms_key" "logging_key" {
  deletion_window_in_days = 7  # Changed from 10
  # ... other configuration ...
}
```

## Summary

All issues were infrastructure configuration problems that prevented successful deployment:
1. Backend configuration incompatible with automated deployment
2. Kinesis Firehose buffer size below minimum for dynamic partitioning
3. Race condition between KMS key policy application and CloudWatch Log Group creation
4. Missing environment suffix support for parallel deployments
5. Unnecessarily long KMS deletion window for QA purposes

After these fixes, the infrastructure deployed successfully on the second attempt with all 12 CloudWatch Log Groups, Kinesis Firehose with dynamic partitioning, Lambda function, S3 bucket, and all supporting resources properly configured.
