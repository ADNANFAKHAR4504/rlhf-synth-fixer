# Simplified Terraform Fixes - No Complexity, Just Working Code

You're absolutely right - let's keep this simple and reliable. Here are straightforward fixes that will work with a single `terraform apply`.

## 1. Simple Hardcoded Solution Stack

Skip the dynamic lookup. Here are current valid Node.js solution stacks you can hardcode:

```hcl
# Just use a known-good solution stack name
resource "aws_elastic_beanstalk_environment" "production" {
  name                = "beanstalk-env-${var.application_name}-prod"
  application         = aws_elastic_beanstalk_application.app.name
  solution_stack_name = "64bit Amazon Linux 2 v5.8.6 running Node.js 18"  # Current as of Dec 2024

  # ... rest of your existing configuration
}
```

**Alternative options** (pick one):

- `"64bit Amazon Linux 2 v5.8.6 running Node.js 18"`
- `"64bit Amazon Linux 2 v5.8.6 running Node.js 16"`
- `"64bit Amazon Linux 2 v5.8.6 running Node.js 20"`

Just pick the Node.js version you want and stick with it. When you need to update, you change the string manually.

## 2. Simple KMS Policy - No Complex Conditions

Replace your entire KMS key resource with this minimal version:

```hcl
resource "aws_kms_key" "pipeline" {
  description             = "KMS key for ${var.project_prefix} pipeline encryption"
  deletion_window_in_days = 7

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow AWS Services"
        Effect = "Allow"
        Principal = {
          Service = [
            "codepipeline.amazonaws.com",
            "codebuild.amazonaws.com",
            "logs.amazonaws.com",
            "cloudtrail.amazonaws.com",
            "s3.amazonaws.com",
            "secretsmanager.amazonaws.com",
            "sns.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}
```

That's it. No complex conditions, no specific ARN patterns. Just give all the AWS services the basic permissions they need.

## 3. Fix Secrets Manager - Remove Replica

```hcl
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.project_prefix}/app-secrets"
  description             = "Application secrets for ${var.project_name}"
  kms_key_id              = aws_kms_key.pipeline.arn
  recovery_window_in_days = 7

  # No replica block - just removed it entirely
}
```

## 4. CloudWatch Logs - Make KMS Optional

```hcl
resource "aws_cloudwatch_log_group" "codebuild_logs" {
  name              = "/aws/codebuild/${var.project_prefix}-build"
  retention_in_days = 30
  # Remove KMS for now - CloudWatch Logs can be tricky with KMS
  # kms_key_id        = aws_kms_key.pipeline.arn
}
```

You can add KMS encryption back later once everything else is working.

## 5. Simple CloudTrail S3 Bucket Policy

Replace your entire CloudTrail S3 bucket policy with this:

```hcl
resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}
```

## 6. Add Missing S3 Bucket Configuration

Add these blocks right after your CloudTrail S3 bucket resource:

```hcl
# Add this after aws_s3_bucket.cloudtrail_logs
resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Optional: Add encryption if you want it
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"  # Use AES256 instead of KMS for simplicity
    }
  }
}
```

## 7. Fix SNS Permissions

Add this after your SNS topic:

```hcl
resource "aws_sns_topic_policy" "pipeline_notifications" {
  arn = aws_sns_topic.pipeline_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "events.amazonaws.com",
            "codepipeline.amazonaws.com"
          ]
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      }
    ]
  })
}
```

## 8. Remove KMS from CloudTrail for Now

Update your CloudTrail resource to remove KMS:

```hcl
resource "aws_cloudtrail" "pipeline_trail" {
  name                          = "${var.project_prefix}-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail_logs.bucket
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true
  # Remove KMS for now
  # kms_key_id                   = aws_kms_key.pipeline.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.pipeline_artifacts.arn}/*"]
    }
  }
}
```

## Summary of Changes

Here's what you need to do:

1. **Replace** the Elastic Beanstalk solution stack with the hardcoded string
2. **Replace** the entire KMS key policy with the simple version
3. **Remove** the replica block from Secrets Manager
4. **Remove** KMS from CloudWatch Logs (for now)
5. **Add** the missing S3 bucket configurations
6. **Add** the SNS topic policy
7. **Remove** KMS from CloudTrail (for now)

## Single Command Deployment

After making these changes, this should work:

```bash
terraform apply
```

No targeting, no multi-stage deployment. Just one command.

## When You Want to Add KMS Back

Once everything is working, you can gradually add KMS encryption back to CloudWatch Logs and CloudTrail by uncommenting those lines and running `terraform apply` again.

This approach gets you a working pipeline first, then you can enhance security incrementally.
