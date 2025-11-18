# AWS Infrastructure Compliance Monitoring System

This implementation provides a comprehensive automated compliance validation system using Terraform HCL. The solution monitors AWS resources for compliance violations, triggers validation checks, generates reports, and alerts teams of issues.

## Architecture Overview

The system uses AWS Config for continuous compliance monitoring, Lambda for custom checks, EventBridge for real-time events, SNS for notifications, and S3 for audit storage.

### Key Components:
- **AWS Config**: Monitors and records resource configurations
- **Lambda Function**: Processes compliance events and generates reports
- **EventBridge Rules**: Triggers checks on resource changes and periodically
- **SNS Topic**: Sends compliance alerts to stakeholders
- **S3 Bucket**: Stores Config snapshots with encryption and versioning
- **CloudWatch Logs**: Maintains audit trails for all compliance activities

## Implementation Files

### File: lib/main.tf

```hcl
# main.tf
# Main configuration for AWS infrastructure compliance checking system

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# Data source to get current AWS region
data "aws_region" "current" {}

#############################################
# S3 Bucket for AWS Config
#############################################

# S3 bucket for storing AWS Config snapshots and history
resource "aws_s3_bucket" "config_bucket" {
  bucket = "config-bucket-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    var.tags,
    {
      Name = "config-bucket-${var.environment_suffix}"
    }
  )
}

# Enable versioning for Config bucket
resource "aws_s3_bucket_versioning" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption for Config bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access to Config bucket
resource "aws_s3_bucket_public_access_block" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy to allow AWS Config to write to the bucket
resource "aws_s3_bucket_policy" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_bucket.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_bucket.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketWrite"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

#############################################
# IAM Role for AWS Config
#############################################

# IAM role for AWS Config service
resource "aws_iam_role" "config_role" {
  name = "config-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "config-role-${var.environment_suffix}"
    }
  )
}

# Attach AWS managed policy for Config
resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# Custom policy for Config to write to S3 bucket
resource "aws_iam_role_policy" "config_s3_policy" {
  name = "config-s3-policy-${var.environment_suffix}"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config_bucket.arn,
          "${aws_s3_bucket.config_bucket.arn}/*"
        ]
      }
    ]
  })
}

#############################################
# AWS Config Resources
#############################################

# AWS Config configuration recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "config-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = false
    resource_types = [
      "AWS::S3::Bucket",
      "AWS::RDS::DBInstance",
      "AWS::EC2::Instance",
      "AWS::EC2::SecurityGroup",
      "AWS::RDS::DBSecurityGroup",
      "AWS::RDS::DBSnapshot",
      "AWS::RDS::DBCluster",
      "AWS::RDS::DBClusterSnapshot"
    ]
  }
}

# AWS Config delivery channel
resource "aws_config_delivery_channel" "main" {
  name           = "config-delivery-channel-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config_bucket.id

  snapshot_delivery_properties {
    delivery_frequency = var.config_snapshot_frequency
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Start the configuration recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config rule for detecting unencrypted S3 buckets
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-server-side-encryption-enabled-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Config rule for detecting publicly accessible RDS instances
resource "aws_config_config_rule" "rds_public_access" {
  name = "rds-instance-public-access-check-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_INSTANCE_PUBLIC_ACCESS_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Config rule for RDS encryption at rest
resource "aws_config_config_rule" "rds_encryption" {
  name = "rds-storage-encrypted-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Config rule for EC2 instance detailed monitoring
resource "aws_config_config_rule" "ec2_detailed_monitoring" {
  name = "ec2-instance-detailed-monitoring-enabled-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "EC2_INSTANCE_DETAILED_MONITORING_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

#############################################
# SNS Topic for Compliance Notifications
#############################################

# SNS topic for compliance violation notifications
resource "aws_sns_topic" "compliance_notifications" {
  name = "compliance-notifications-${var.environment_suffix}"

  tags = merge(
    var.tags,
    {
      Name = "compliance-notifications-${var.environment_suffix}"
    }
  )
}

# SNS topic policy
resource "aws_sns_topic_policy" "compliance_notifications" {
  arn = aws_sns_topic.compliance_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowConfigPublish"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.compliance_notifications.arn
      },
      {
        Sid    = "AllowLambdaPublish"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.compliance_notifications.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# Optional: SNS topic subscription for email notifications
resource "aws_sns_topic_subscription" "compliance_email" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.compliance_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

#############################################
# CloudWatch Log Groups
#############################################

# CloudWatch Log Group for Config
resource "aws_cloudwatch_log_group" "config_logs" {
  name              = "/aws/config/compliance-checker-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "config-logs-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Group for Lambda function
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/compliance-checker-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "lambda-logs-${var.environment_suffix}"
    }
  )
}

#############################################
# IAM Role for Lambda Function
#############################################

# IAM role for Lambda compliance checker function
resource "aws_iam_role" "lambda_role" {
  name = "compliance-lambda-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "compliance-lambda-role-${var.environment_suffix}"
    }
  )
}

# IAM policy for Lambda to write CloudWatch Logs
resource "aws_iam_role_policy" "lambda_cloudwatch_policy" {
  name = "lambda-cloudwatch-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda_logs.arn}:*"
      }
    ]
  })
}

# IAM policy for Lambda to read Config data
resource "aws_iam_role_policy" "lambda_config_policy" {
  name = "lambda-config-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "config:GetComplianceDetailsByConfigRule",
          "config:GetComplianceDetailsByResource",
          "config:DescribeConfigRules",
          "config:DescribeConfigRuleEvaluationStatus",
          "config:DescribeComplianceByConfigRule",
          "config:DescribeComplianceByResource"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM policy for Lambda to publish to SNS
resource "aws_iam_role_policy" "lambda_sns_policy" {
  name = "lambda-sns-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.compliance_notifications.arn
      }
    ]
  })
}

# IAM policy for Lambda to read S3 Config snapshots
resource "aws_iam_role_policy" "lambda_s3_policy" {
  name = "lambda-s3-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.config_bucket.arn,
          "${aws_s3_bucket.config_bucket.arn}/*"
        ]
      }
    ]
  })
}

#############################################
# Lambda Function
#############################################

# Archive Lambda function code
data "archive_file" "lambda_code" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = file("${path.module}/lambda_function.py")
    filename = "lambda_function.py"
  }
}

# Lambda function for compliance checking
resource "aws_lambda_function" "compliance_checker" {
  filename         = data.archive_file.lambda_code.output_path
  function_name    = "compliance-checker-${var.environment_suffix}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_code.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  environment {
    variables = {
      SNS_TOPIC_ARN      = aws_sns_topic.compliance_notifications.arn
      CONFIG_BUCKET      = aws_s3_bucket.config_bucket.id
      ENVIRONMENT_SUFFIX = var.environment_suffix
      LOG_LEVEL          = "INFO"
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "compliance-checker-${var.environment_suffix}"
    }
  )

  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    aws_iam_role_policy.lambda_cloudwatch_policy,
    aws_iam_role_policy.lambda_config_policy,
    aws_iam_role_policy.lambda_sns_policy,
    aws_iam_role_policy.lambda_s3_policy
  ]
}

# Lambda permission for Config to invoke the function
resource "aws_lambda_permission" "allow_config" {
  statement_id  = "AllowExecutionFromConfig"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_checker.function_name
  principal     = "config.amazonaws.com"
  source_arn    = "arn:aws:config:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*"
}

# Lambda permission for EventBridge to invoke the function
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_checker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.config_compliance.arn
}

#############################################
# EventBridge Rules
#############################################

# EventBridge rule to capture Config compliance events
resource "aws_cloudwatch_event_rule" "config_compliance" {
  name        = "config-compliance-change-${var.environment_suffix}"
  description = "Capture Config compliance state changes"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
  })

  tags = merge(
    var.tags,
    {
      Name = "config-compliance-change-${var.environment_suffix}"
    }
  )
}

# EventBridge target to invoke Lambda function
resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.config_compliance.name
  target_id = "ComplianceCheckerLambda"
  arn       = aws_lambda_function.compliance_checker.arn
}

# EventBridge rule for periodic compliance checks
resource "aws_cloudwatch_event_rule" "periodic_check" {
  name                = "periodic-compliance-check-${var.environment_suffix}"
  description         = "Trigger periodic compliance checks"
  schedule_expression = "rate(6 hours)"

  tags = merge(
    var.tags,
    {
      Name = "periodic-compliance-check-${var.environment_suffix}"
    }
  )
}

# EventBridge target for periodic checks
resource "aws_cloudwatch_event_target" "periodic_lambda_target" {
  rule      = aws_cloudwatch_event_rule.periodic_check.name
  target_id = "PeriodicComplianceCheck"
  arn       = aws_lambda_function.compliance_checker.arn
}

# Lambda permission for periodic EventBridge rule
resource "aws_lambda_permission" "allow_periodic_eventbridge" {
  statement_id  = "AllowExecutionFromPeriodicEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_checker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.periodic_check.arn
}
```

## Implementation Summary

### AWS Services Implemented

1. **AWS Config** - Configuration recorder with delivery channel and 4 compliance rules
2. **Lambda** - Compliance processor with Python 3.11 runtime
3. **S3** - Encrypted bucket with versioning for Config snapshots
4. **SNS** - Topic for compliance violation notifications
5. **EventBridge** - Rules for real-time and periodic compliance checks
6. **CloudWatch Logs** - Audit trails with 30-day retention
7. **IAM** - Least-privilege roles for all services

### Compliance Rules Configured

1. **S3 Bucket Encryption** - Validates all S3 buckets have server-side encryption
2. **RDS Public Access** - Detects publicly accessible RDS instances
3. **RDS Storage Encryption** - Ensures RDS instances use encrypted storage
4. **EC2 Detailed Monitoring** - Verifies EC2 instances have detailed monitoring enabled

### Security Features

- **Encryption**: S3 bucket encryption with AES256
- **Versioning**: S3 bucket versioning for audit trails
- **Access Control**: Complete public access blocking on S3
- **IAM Policies**: Source account conditions to prevent confused deputy
- **Least Privilege**: Minimal permissions for each service
- **Audit Logging**: CloudWatch Logs for all activities

### Deployment Instructions

```bash
# Initialize Terraform with backend configuration
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=compliance/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="encrypt=true"

# Plan the deployment
terraform plan -var="environment_suffix=prod" \
  -var="notification_email=compliance@example.com"

# Apply the infrastructure
terraform apply -var="environment_suffix=prod" \
  -var="notification_email=compliance@example.com"

# Verify deployment
aws configservice describe-configuration-recorder-status
aws lambda invoke --function-name compliance-checker-prod response.json
```

### Cost Estimation

- **AWS Config**: ~$2/month per rule + $0.003 per configuration item
- **Lambda**: ~$0.20/month (assuming 100 invocations/day)
- **S3**: ~$0.50/month for Config snapshots
- **CloudWatch Logs**: ~$0.50/month with 30-day retention
- **SNS**: ~$0.50/month for email notifications

**Total estimated monthly cost**: $15-25 depending on resource count and activity

### Future Enhancements

1. Add more Config rules for comprehensive coverage
2. Implement S3 lifecycle policies for cost optimization
3. Use KMS customer-managed keys for enhanced encryption
4. Add CloudWatch alarms for Lambda errors
5. Consider multi-region deployment for global compliance