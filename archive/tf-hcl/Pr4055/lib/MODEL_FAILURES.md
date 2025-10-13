# Model Failures Analysis

## Critical Failures

### 1. Incorrect S3 Bucket Encryption for ALB Logs
**Issue**: The model used KMS encryption for S3 bucket that stores ALB access logs.
```hcl
# From the model (INCORRECT)
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}
```

**Problem**: ALB access logs ONLY support Amazon S3-managed keys (SSE-S3), not KMS encryption. This will cause the ALB to fail writing logs.

**Correct Implementation**:
```hcl
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"  # SSE-S3 required
    }
  }
}
```

**Reference**: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html

### 2. Hardcoded ELB Service Account for Single Region
**Issue**: The model hardcoded the ELB service account ID for us-west-2 only.
```hcl
# From the model (INCORRECT)
Principal = {
  AWS = "arn:aws:iam::797873946194:root"  # us-west-2 only
}
```

**Problem**: Configuration only works in us-west-2. Deploying to other regions will fail because each region has a different ELB service account.

**Correct Implementation**:
```hcl
# Add data source
data "aws_elb_service_account" "main" {}

# Use in policy
Principal = {
  AWS = "arn:aws:iam::${data.aws_elb_service_account.main.id}:root"
}
```

### 3. Missing KMS Key Policies for Auto Scaling
**Issue**: The model created custom KMS key for EBS encryption but didn't include proper policies for Auto Scaling service to use the key.

**Problem**: When Auto Scaling tries to launch EC2 instances with encrypted EBS volumes using custom KMS key, it will fail with "Client.InternalError: Client error on launch" due to insufficient KMS permissions.

**Correct Implementation**: Either:
- Use AWS default encryption (set `encrypted = true` without `kms_key_id`)
- OR add comprehensive KMS key policy granting Auto Scaling and EC2 services permission

### 4. Incorrect WAF Logging Destination
**Issue**: The model didn't include WAF logging configuration at all.

**Problem**: WAFv2 does not support direct S3 logging. Attempting to configure WAF logs to S3 will fail with "WAFInvalidParameterException: The ARN isn't valid."

**Correct Implementation**:
```hcl
# Create CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${var.project_name}"
  retention_in_days = 30
}

# Configure WAF logging to CloudWatch
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]  # Not S3
}
```

### 5. Missing Provider Configuration
**Issue**: The model included provider configuration in main.tf but the actual working implementation requires a separate provider.tf file with backend configuration.

**Problem**: Missing backend configuration and proper Terraform version constraints.

**Correct Implementation**: Separate provider.tf with:
- Terraform version >= 1.4.0
- AWS provider version >= 5.0
- S3 backend configuration

### 6. Incomplete S3 Bucket Policy for Multi-Service Logging
**Issue**: The model only included policy for ALB service account, missing support for newer log delivery service and WAF logs.

**Problem**: Didn't support AWS's newer recommended policy using service principals. Missing permissions for WAF and CloudWatch log delivery.

**Correct Implementation**:
```hcl
# Legacy support
{
  Sid = "AllowALBLoggingLegacy"
  Principal = { AWS = "arn:aws:iam::${elb_account}:root" }
}

# New recommended
{
  Sid = "AllowALBLoggingNew"
  Principal = { Service = "logdelivery.elasticloadbalancing.amazonaws.com" }
}

# WAF/CloudWatch logs
{
  Sid = "AWSLogDeliveryWrite"
  Principal = { Service = "delivery.logs.amazonaws.com" }
}
```

### 7. Missing IAM Permissions for EC2 Role
**Issue**: The model included basic KMS permissions but was missing critical actions required for Auto Scaling with encrypted volumes.

**Problem**: Missing permissions like `kms:CreateGrant`, `kms:DescribeKey`, `kms:GenerateDataKeyWithoutPlaintext`, and `kms:ReEncrypt*`.

**Correct Implementation**: EC2 instance role should have comprehensive KMS permissions when using encrypted resources, or use AWS default encryption.

## Moderate Issues

### 8. Missing Data Source for AWS Caller Identity
**Issue**: The model used `data.aws_caller_identity.current.account_id` in monitoring.tf but didn't declare it until later.

**Problem**: Potential race condition or undefined reference depending on evaluation order.

**Correct Implementation**: Declare `data "aws_caller_identity" "current" {}` in kms.tf (since it's used first there) or in a dedicated data.tf file.

### 9. Deletion Protection Set to True Without User Consideration
**Issue**: The model set `deletion_protection = true` on both RDS and ALB.

**Problem**: While this is good for production, it makes cleanup difficult during testing/development. Should be configurable.

**Recommendation**: Use a variable for deletion_protection:
```hcl
variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS and ALB"
  type        = bool
  default     = false  # true for production
}
```

### 10. No Multi-AZ Configuration for RDS
**Issue**: The model didn't specify `multi_az = true` for RDS instance.

**Problem**: Not explicitly configured for high availability across availability zones, though it was in database subnets across multiple AZs.

**Correct Implementation**:
```hcl
resource "aws_db_instance" "main" {
  multi_az = true  # Explicitly enable Multi-AZ
  # ... other configuration
}
```

### 11. Hardcoded Domain in ACM Certificate
**Issue**: The model included ACM certificate with hardcoded "example.com" domain.

**Problem**: Certificate will fail validation without a real domain. Should be commented out or use a variable.

**Correct Implementation**: Comment out HTTPS resources until domain is available, with clear instructions for enabling.

### 12. Missing ELB Service Account Data Source Declaration
**Issue**: The model didn't include the `aws_elb_service_account` data source.

**Problem**: Couldn't reference region-specific ELB service account dynamically.

**Correct Implementation**: Add `data "aws_elb_service_account" "main" {}` in monitoring.tf.

## Minor Issues

### 13. Inconsistent Resource Naming
**Issue**: The model used both `${var.project_name}-resource` and `${var.project_name}resource` patterns.

**Problem**: Inconsistent naming could lead to resources with double dashes if project_name already had a trailing dash.

**Recommendation**: Ensure project_name has trailing dash and use `${var.project_name}resource` consistently.

### 14. Missing Comments on AWS Service Limitations
**Issue**: The model didn't document why certain configurations were chosen (e.g., SSE-S3 for ALB logs).

**Problem**: Future maintainers might have tried to "improve" by adding KMS encryption, breaking ALB logging.

**Correct Implementation**: Include comments explaining AWS service requirements.

### 15. No Mention of IMDSv2 Enforcement
**Issue**: The model didn't include metadata options for EC2 instances.

**Problem**: Instances vulnerable to SSRF attacks via IMDSv1.

**Correct Implementation**:
```hcl
metadata_options {
  http_endpoint               = "enabled"
  http_tokens                 = "required"  # Enforce IMDSv2
  http_put_response_hop_limit = 1
}
```

### 16. Missing WAF Logging Configuration
**Issue**: The model created WAF Web ACL but didn't configure logging.

**Problem**: No visibility into WAF blocks and security events.

**Correct Implementation**: Add CloudWatch log group and logging configuration for WAF.

### 17. Incomplete User Data Script
**Issue**: The model's user data script used template variables but didn't properly escape them in the bash heredoc.

**Problem**: Variable interpolation conflicts between Terraform and bash.

**Recommendation**: Use `\${project_name}` in bash heredocs to prevent Terraform interpolation.
