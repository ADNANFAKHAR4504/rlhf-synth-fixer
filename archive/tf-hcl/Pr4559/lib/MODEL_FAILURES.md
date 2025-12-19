# Infrastructure Changes Required

This document outlines the infrastructure changes needed to fix the MODEL_RESPONSE and arrive at the IDEAL_RESPONSE solution.

## Critical Issues

### 1. Provider and Terraform Block Placement

Remove the provider and terraform blocks from tap_stack.tf. These belong in provider.tf which already exists in the project.

Remove:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}
```

### 2. Environment Suffix for Resource Isolation

Add environment_suffix variable to support multi-environment deployments and resource naming isolation as required by CI/CD pipeline.

Add:
```hcl
variable "environment_suffix" {
  type        = string
  description = "Environment suffix for resource naming"
  default     = "dev"
}
```

Update all resource names to include the suffix:
- KMS alias: `alias/media-logs-${var.environment_suffix}`
- S3 bucket names: append `-${var.environment_suffix}`
- CloudWatch alarms: append `-${var.environment_suffix}`
- CloudWatch dashboard: append `-${var.environment_suffix}`

### 3. Resource Deletion Configuration

Add force_destroy flags to enable clean teardown in CI/CD environments.

Add to S3 buckets:
```hcl
resource "aws_s3_bucket" "media_content" {
  force_destroy = true
}

resource "aws_s3_bucket" "access_logs" {
  force_destroy = true
}
```

Add to Route53 zone:
```hcl
resource "aws_route53_zone" "main" {
  force_destroy = true
}
```

Reduce KMS deletion window for faster cleanup:
```hcl
resource "aws_kms_key" "logs" {
  deletion_window_in_days = 7  # Changed from 30
}
```

### 4. Remove Unnecessary Resources

Remove IAM roles and policies that are not required. CloudFront Origin Access Identity handles S3 access without additional IAM roles.

Remove:
- `aws_iam_role.cloudfront_s3_access_role`
- `aws_iam_policy.cloudfront_s3_access_policy`
- `aws_iam_role_policy_attachment.cloudfront_s3_access_attachment`
- `aws_iam_role.log_analysis_role`
- `aws_iam_policy.log_analysis_policy`
- `aws_iam_role_policy_attachment.log_analysis_attachment`

Remove WAF resources as they were not in the requirements:
- `aws_wafv2_web_acl.media_waf`
- CloudFront distribution web_acl_id reference

### 5. Remove S3 Bucket Versioning

Remove versioning configuration which can prevent proper cleanup and is not required.

Remove:
- `aws_s3_bucket_versioning.media_content_versioning`
- `aws_s3_bucket_versioning.access_logs_versioning`

### 6. Remove Lifecycle Configuration on Logs Bucket

Remove the lifecycle rule that expires logs after 365 days. This is not a requirement and adds unnecessary complexity.

Remove:
- `aws_s3_bucket_lifecycle_configuration.access_logs_lifecycle`

### 7. Simplify KMS Key Policy

Remove the complex inline KMS key policy. The default policy is sufficient for CloudFront logging.

Change from:
```hcl
resource "aws_kms_key" "media_encryption_key" {
  policy = jsonencode({ ... complex policy ... })
}
```

To:
```hcl
resource "aws_kms_key" "logs" {
  description             = "KMS key for CloudFront access logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}
```

### 8. Fix Route53 Zone Configuration

Create the Route53 zone instead of attempting to look it up with complex string manipulation.

Replace:
```hcl
data "aws_route53_zone" "domain_zone" {
  name = join(".", slice(split(".", var.domain_name), 1, length(split(".", var.domain_name))))
}
```

With:
```hcl
resource "aws_route53_zone" "main" {
  name          = var.domain_name
  force_destroy = true
}
```

Update all references from `data.aws_route53_zone.domain_zone` to `aws_route53_zone.main`.

### 9. Add Required S3 Bucket ACL Configuration

Add bucket ownership controls and ACL for the logs bucket to support CloudFront logging.

Add:
```hcl
resource "aws_s3_bucket_ownership_controls" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "access_logs" {
  depends_on = [aws_s3_bucket_ownership_controls.access_logs]
  bucket     = aws_s3_bucket.access_logs.id
  acl        = "private"
}
```

### 10. Fix CloudFront Distribution Configuration

Remove custom error response configuration which references a non-existent file and is not required.

Remove:
```hcl
custom_error_response {
  error_code            = 403
  response_code         = 403
  response_page_path    = "/geo-restricted.html"
  error_caching_min_ttl = 10
}
```

Update price_class to a more cost-effective option for testing:
```hcl
price_class = "PriceClass_100"  # Changed from PriceClass_All
```

Remove tags from CloudFront distribution as they are not required.

### 11. Simplify Media Bucket Encryption

Change media bucket encryption from KMS to AES256 for simplicity and cost effectiveness.

Change from:
```hcl
apply_server_side_encryption_by_default {
  kms_master_key_id = aws_kms_key.media_encryption_key.arn
  sse_algorithm     = "aws:kms"
}
```

To:
```hcl
apply_server_side_encryption_by_default {
  sse_algorithm = "AES256"
}
```

Keep KMS encryption only for the logs bucket where it is more critical.

### 12. Add Missing Outputs

Add comprehensive outputs for all key resources to support testing and operations.

Add:
- `cloudfront_distribution_arn`
- `media_bucket_arn`
- `logs_bucket_arn`
- `kms_key_id`
- `route53_zone_name_servers`

### 13. Fix CloudFront Logging Configuration

Update logging configuration to not include cookies which is unnecessary overhead.

Change:
```hcl
logging_config {
  include_cookies = true
}
```

To:
```hcl
logging_config {
  include_cookies = false
}
```

### 14. Update CloudWatch Dashboard Dimensions

Fix CloudWatch dashboard to reference distribution ID properly in metrics.

The dashboard should use dimensions that reference the actual distribution ID instead of relying on implicit filters.

## Summary

The main changes transform an over-engineered solution with unnecessary IAM roles, WAF resources, and complex configurations into a clean, maintainable infrastructure that:

1. Follows project structure conventions (no provider blocks in stack files)
2. Supports CI/CD workflows (force_destroy, environment_suffix)
3. Implements only required features (no WAF, no lifecycle rules, no versioning)
4. Uses appropriate encryption (AES256 for content, KMS for logs)
5. Properly creates managed resources (Route53 zone) instead of referencing external ones
6. Provides complete outputs for testing and operations
7. Maintains security best practices (OAI, encryption, public access blocks, HTTPS enforcement, geo-restrictions)