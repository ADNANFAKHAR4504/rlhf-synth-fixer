# Fix Terraform Deployment Errors for AWS CI/CD Pipeline

I'll help you fix these deployment errors. Each issue requires specific configuration changes. Here are the solutions:

## 1. Fix Elastic Beanstalk Solution Stack Error

The solution stack name is outdated. Let's get the current valid stack name and make it dynamic:

```hcl
# Add this data source to get the latest Node.js platform
data "aws_elastic_beanstalk_solution_stack" "nodejs" {
  most_recent = true
  name_regex  = "^64bit Amazon Linux 2 (.*) running Node.js (.*)$"
}

# Update the Elastic Beanstalk environment resource
resource "aws_elastic_beanstalk_environment" "production" {
  name                = "beanstalk-env-${var.application_name}-prod"
  application         = aws_elastic_beanstalk_application.app.name
  solution_stack_name = data.aws_elastic_beanstalk_solution_stack.nodejs.name # Use dynamic stack name

  # ... rest of your configuration remains the same
}
```

**Alternative approach** - If you want to specify a particular Node.js version, use this data source:

```hcl
# For specific Node.js version (e.g., Node.js 18)
data "aws_elastic_beanstalk_solution_stack" "nodejs" {
  most_recent = true
  name_regex  = "^64bit Amazon Linux 2 (.*) running Node.js 18(.*)$"
}
```

## 2. Fix Secrets Manager Replica Region Error

The replica configuration is causing issues. Remove the replica block since you're deploying to a single region:

```hcl
# Fix the Secrets Manager secret configuration
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.project_prefix}/app-secrets"
  description             = "Application secrets for ${var.project_name}"
  kms_key_id              = aws_kms_key.pipeline.arn
  recovery_window_in_days = 7

  # Remove the replica block - not needed for single region deployment
  # replica {
  #   region = var.aws_region
  # }
}
```

## 3. Fix CloudWatch Logs KMS Key Permissions

The KMS key policy needs to include CloudWatch Logs service permissions:

```hcl
# Update the KMS key policy to include CloudWatch Logs permissions
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
        Sid    = "Allow CodePipeline and CodeBuild to use the key"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.codepipeline_role.arn,
            aws_iam_role.codebuild_role.arn
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.project_prefix}-*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/${var.project_prefix}-*"
          }
        }
      }
    ]
  })
}

# Update CloudWatch Log Group - remove KMS key initially, add it after key is created
resource "aws_cloudwatch_log_group" "codebuild_logs" {
  name              = "/aws/codebuild/${var.project_prefix}-build"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.pipeline.arn

  depends_on = [aws_kms_key.pipeline]
}
```

## 4. Fix CloudTrail S3/KMS Permissions

The S3 bucket policy and CloudTrail configuration need updates for proper permissions:

```hcl
# Fix S3 bucket policy for CloudTrail
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
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_prefix}-trail"
          }
        }
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
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_prefix}-trail"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket.cloudtrail_logs]
}

# Add server-side encryption for CloudTrail S3 bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.pipeline.arn
      sse_algorithm     = "aws:kms"
    }
  }

  depends_on = [aws_kms_key.pipeline]
}

# Add public access block for CloudTrail S3 bucket
resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Update CloudTrail configuration
resource "aws_cloudtrail" "pipeline_trail" {
  name                          = "${var.project_prefix}-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail_logs.bucket
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true
  kms_key_id                   = aws_kms_key.pipeline.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.pipeline_artifacts.arn}/*"]
    }
  }

  depends_on = [
    aws_s3_bucket_policy.cloudtrail_logs,
    aws_kms_key.pipeline
  ]
}
```

## 5. Additional Fixes and Resource Dependencies

Add proper resource dependencies to ensure resources are created in the correct order:

```hcl
# Update SNS topic permissions for CloudWatch Events
resource "aws_sns_topic_policy" "pipeline_notifications" {
  arn = aws_sns_topic.pipeline_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      }
    ]
  })
}

# Update CloudWatch Event targets with proper dependencies
resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.pipeline_state_change.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn

  depends_on = [aws_sns_topic_policy.pipeline_notifications]
}

resource "aws_cloudwatch_event_target" "build_sns" {
  rule      = aws_cloudwatch_event_rule.build_state_change.name
  target_id = "SendBuildFailureToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn

  depends_on = [aws_sns_topic_policy.pipeline_notifications]
}
```

## 6. Complete Updated Variables File

Update your `terraform.tfvars` with a valid application name:

```hcl
# terraform.tfvars
aws_region        = "us-east-1"
project_name      = "IaC-AWS-Nova-Model-Breaking"
project_prefix    = "ci-pipeline"
environment       = "production"

# GitHub Configuration
github_owner  = "your-github-username"
github_repo   = "your-repo-name"
github_branch = "main"

# Application Configuration - make sure this is a valid name
application_name      = "my-web-app"  # Changed from "your-app-name"
instance_type         = "t3.small"

# Notifications
notification_email = "your-team@company.com"

# Security
enable_manual_approval = true
```

## 7. Deployment Order

To avoid dependency issues, deploy in this order:

```bash
# 1. First, create just the KMS key and S3 buckets
terraform apply -target=aws_kms_key.pipeline -target=aws_s3_bucket.pipeline_artifacts -target=aws_s3_bucket.cloudtrail_logs

# 2. Then apply the rest
terraform apply
```

## 8. Verification Commands

After successful deployment, verify with these commands:

```bash
# Check Elastic Beanstalk solution stack
aws elasticbeanstalk list-available-solution-stacks --query 'SolutionStacks[?contains(@, `Node.js`)]'

# Check KMS key permissions
aws kms describe-key --key-id alias/ci-pipeline-pipeline

# Check CloudWatch log group
aws logs describe-log-groups --log-group-name-prefix "/aws/codebuild/ci-pipeline"

# Check CloudTrail status
aws cloudtrail get-trail-status --name ci-pipeline-trail
```

These fixes should resolve all the deployment errors you're encountering. The key changes are:

1. **Dynamic solution stack lookup** for Elastic Beanstalk
2. **Removed replica configuration** from Secrets Manager
3. **Enhanced KMS key policy** with service permissions
4. **Proper S3 bucket policies** and dependencies for CloudTrail
5. **Resource dependencies** to ensure correct creation order

Apply these changes and your Terraform deployment should succeed!
