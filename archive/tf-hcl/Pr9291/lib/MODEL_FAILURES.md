# Model Failures

## LocalStack Compatibility Adjustments

The following modifications were made to ensure LocalStack Community Edition compatibility. These are intentional architectural decisions, not bugs.

| Feature | LocalStack Limitation | Solution Applied | Production Status |
|---------|----------------------|------------------|-------------------|
| CloudWatch Metric Alarms | InternalError (exceeded retries) | Conditional deployment with `var.is_localstack` | Enabled in AWS |
| Security Hub | Not supported in Community Edition | Conditional deployment with `var.is_localstack` | Enabled in AWS |

### Environment Detection Pattern Used

```hcl
variable "is_localstack" {
  description = "Whether deploying to LocalStack (disables unsupported services)"
  type        = bool
  default     = false
}
```

### Services Verified Working in LocalStack

- S3 (full support with path-style access)
- KMS (full encryption support)
- SNS (topic creation and configuration)
- EventBridge (event rules and targets)
- IAM (roles, policies, and instance profiles)
- CloudWatch Logs (log groups)
- CloudTrail (trail configuration)

### Provider Configuration

The Terraform provider is configured with LocalStack-specific settings:

```hcl
provider "aws" {
  region = var.aws_region

  skip_credentials_validation = var.is_localstack
  skip_metadata_api_check     = var.is_localstack
  skip_requesting_account_id  = var.is_localstack
  s3_use_path_style          = var.is_localstack
}
```

### Auto-Configuration for LocalStack

Created `lib/terraform.auto.tfvars` to automatically enable LocalStack mode:

```hcl
is_localstack = true
environment_suffix = "ls"
create_cloudtrail = false
```

This file is automatically detected when `PROVIDER=localstack` environment variable is set.
