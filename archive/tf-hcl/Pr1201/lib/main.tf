# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local variables for consistent naming and tagging
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.id

  # Naming convention with account ID prefix and environment suffix
  name_prefix = "${local.account_id}-security-${var.environment_suffix}"

  # Common tags
  common_tags = {
    Environment       = var.environment
    Project           = var.project_name
    ManagedBy         = "terraform"
    AccountId         = local.account_id
    EnvironmentSuffix = var.environment_suffix
  }
}

########################
# KMS Key for Encryption
########################
resource "aws_kms_key" "security_key" {
  description             = "KMS key for encrypting sensitive data"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${local.region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${local.region}:${local.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "security_key_alias" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.security_key.key_id
}

########################
# IAM Roles and Policies
########################

# Security monitoring role
resource "aws_iam_role" "security_monitoring_role" {
  name = "${local.name_prefix}-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["lambda.amazonaws.com", "config.amazonaws.com"]
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "security_monitoring_policy" {
  name = "${local.name_prefix}-monitoring-policy"
  role = aws_iam_role.security_monitoring_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "sns:Publish",
          "cloudwatch:PutMetricData",
          "config:PutEvaluations",
          "iam:ListUsers",
          "iam:GetUser",
          "iam:ListAccessKeys",
          "securityhub:BatchImportFindings",
          "guardduty:GetFindings"
        ]
        Resource = "*"
      }
    ]
  })
}

# Cross-account access role
resource "aws_iam_role" "cross_account_role" {
  name = "${local.name_prefix}-cross-account-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${local.name_prefix}-external-id"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "cross_account_policy" {
  name = "${local.name_prefix}-cross-account-policy"
  role = aws_iam_role.cross_account_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.secure_bucket.arn}/*"
      }
    ]
  })
}

########################
# SNS Topic for Security Alerts
########################
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name_prefix}-security-alerts"
  kms_master_key_id = aws_kms_key.security_key.arn

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

########################
# CloudWatch Log Group
########################
resource "aws_cloudwatch_log_group" "security_logs" {
  name              = "/aws/security/${local.name_prefix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.security_key.arn

  tags = local.common_tags
}

########################
# CloudWatch Metric Filter and Alarm
########################
resource "aws_cloudwatch_log_metric_filter" "iam_actions" {
  name           = "${local.name_prefix}-iam-actions"
  log_group_name = aws_cloudwatch_log_group.security_logs.name
  pattern        = "{ ($.eventName = CreateUser) || ($.eventName = DeleteUser) || ($.eventName = CreateRole) || ($.eventName = DeleteRole) || ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) }"

  metric_transformation {
    name      = "IAMActions"
    namespace = "Security/IAM"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "iam_actions_alarm" {
  alarm_name          = "${local.name_prefix}-iam-actions-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMActions"
  namespace           = "Security/IAM"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors IAM actions"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = local.common_tags
}

########################
# S3 Bucket with Encryption
########################
resource "aws_s3_bucket" "secure_bucket" {
  bucket        = "${local.name_prefix}-secure-data"
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket_encryption" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.security_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "secure_bucket_pab" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "secure_bucket_versioning" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "secure_bucket_logging" {
  bucket = aws_s3_bucket.secure_bucket.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "access-logs/"
}

resource "aws_s3_bucket_policy" "secure_bucket_policy" {
  bucket = aws_s3_bucket.secure_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyUnSecureCommunications"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.secure_bucket.arn,
          "${aws_s3_bucket.secure_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Access logs bucket
resource "aws_s3_bucket" "access_logs" {
  bucket        = "${local.name_prefix}-access-logs"
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs_encryption" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.security_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "access_logs_pab" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Access logs bucket policy to allow S3 service to write logs
resource "aws_s3_bucket_policy" "access_logs_policy" {
  bucket = aws_s3_bucket.access_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ServerAccessLogsPolicy"
        Effect = "Allow"
        Principal = {
          Service = "logging.s3.amazonaws.com"
        }
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.access_logs.arn}/*"
      }
    ]
  })
}

########################
# Lambda Function for Security Response
########################
resource "aws_lambda_function" "security_response" {
  filename      = "security_response.zip"
  function_name = "${local.name_prefix}-security-response"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 300

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.security_alerts.arn
      KMS_KEY_ID    = aws_kms_key.security_key.key_id
    }
  }

  tags = local.common_tags

  depends_on = [data.archive_file.security_response_zip]
}

# Lambda execution role
resource "aws_iam_role" "lambda_execution_role" {
  name = "${local.name_prefix}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_execution_policy" {
  name = "${local.name_prefix}-lambda-execution-policy"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "sns:Publish",
          "iam:ListUsers",
          "iam:GetUser",
          "iam:PutUserPolicy",
          "iam:DeleteUserPolicy",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# Create Lambda deployment package
data "archive_file" "security_response_zip" {
  type        = "zip"
  output_path = "security_response.zip"
  source {
    content  = <<EOF
import json
import boto3
import os

def handler(event, context):
    sns = boto3.client('sns')
    
    # Process security event
    print(f"Processing security event: {json.dumps(event)}")
    
    # Send notification
    sns.publish(
        TopicArn=os.environ['SNS_TOPIC_ARN'],
        Subject='Security Alert: Unauthorized Access Attempt',
        Message=f'Security event detected: {json.dumps(event)}'
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps('Security response completed')
    }
EOF
    filename = "index.py"
  }
}

########################
# Step Function State Machine
########################
resource "aws_sfn_state_machine" "security_workflow" {
  name     = "${local.name_prefix}-security-workflow"
  role_arn = aws_iam_role.step_function_role.arn

  definition = jsonencode({
    Comment = "Security response workflow"
    StartAt = "ProcessSecurityEvent"
    States = {
      ProcessSecurityEvent = {
        Type     = "Task"
        Resource = aws_lambda_function.security_response.arn
        End      = true
      }
    }
  })

  tags = local.common_tags
}

resource "aws_iam_role" "step_function_role" {
  name = "${local.name_prefix}-step-function-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "step_function_policy" {
  name = "${local.name_prefix}-step-function-policy"
  role = aws_iam_role.step_function_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.security_response.arn
      }
    ]
  })
}

########################
# AWS Config Configuration
########################
resource "aws_config_configuration_recorder" "security_recorder" {
  name     = "${local.name_prefix}-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "security_delivery_channel" {
  name           = "${local.name_prefix}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config_bucket.bucket
  s3_key_prefix  = "config"

  depends_on = [aws_config_configuration_recorder.security_recorder]
}

resource "aws_config_configuration_recorder_status" "security_recorder_status" {
  name       = aws_config_configuration_recorder.security_recorder.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.security_delivery_channel]
}

# Config service role
resource "aws_iam_role" "config_role" {
  name = "${local.name_prefix}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name = "${local.name_prefix}-config-s3-policy"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
      }
    ]
  })
}

# Config bucket
resource "aws_s3_bucket" "config_bucket" {
  bucket        = "${local.name_prefix}-config-bucket"
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket_encryption" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.security_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "config_bucket_pab" {
  bucket = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Config bucket policy
resource "aws_s3_bucket_policy" "config_bucket_policy" {
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
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_bucket.arn
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
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

########################
# Security Hub
########################
resource "aws_securityhub_account" "main" {}

resource "aws_securityhub_standards_subscription" "aws_foundational" {
  standards_arn = "arn:aws:securityhub:us-west-2::standards/aws-foundational-security-best-practices/v/1.0.0"
  depends_on    = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "cis" {
  standards_arn = "arn:aws:securityhub:us-west-2::standards/cis-aws-foundations-benchmark/v/1.4.0"
  depends_on    = [aws_securityhub_account.main]
}

########################
# GuardDuty
########################
resource "aws_guardduty_detector" "main" {
  enable = true

  tags = local.common_tags
}

# GuardDuty S3 protection feature
resource "aws_guardduty_detector_feature" "s3_logs" {
  detector_id = aws_guardduty_detector.main.id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

# GuardDuty EKS protection feature
resource "aws_guardduty_detector_feature" "eks_audit_logs" {
  detector_id = aws_guardduty_detector.main.id
  name        = "EKS_AUDIT_LOGS"
  status      = "ENABLED"
}

# GuardDuty Malware protection feature
resource "aws_guardduty_detector_feature" "malware_protection" {
  detector_id = aws_guardduty_detector.main.id
  name        = "EBS_MALWARE_PROTECTION"
  status      = "ENABLED"
}

