# AWS Compliance Validation and Remediation Module - IDEAL RESPONSE

The following sections contain the complete Terraform module and Lambda source code that live under the `lib/` directory. Each file is presented with proper Markdown code fencing so it can be reviewed or copied as-is.

## provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

## variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to prevent conflicts"
  type        = string
}

variable "compliance_rules" {
  description = "List of AWS Config managed rules to enable"
  type        = list(string)
  default = [
    "s3-bucket-public-read-prohibited",
    "s3-bucket-public-write-prohibited",
    "s3-bucket-server-side-encryption-enabled",
    "encrypted-volumes",
    "rds-encryption-enabled",
    "ec2-instance-no-public-ip",
    "iam-password-policy",
    "root-account-mfa-enabled"
  ]
}

variable "enable_auto_remediation" {
  description = "Enable automatic remediation for non-compliant resources"
  type        = bool
  default     = true
}

variable "sns_email_endpoint" {
  description = "Email address for compliance notifications"
  type        = string
  default     = ""
}

variable "config_snapshot_frequency" {
  description = "Frequency of configuration snapshots"
  type        = string
  default     = "One_Hour"
  validation {
    condition     = contains(["One_Hour", "Three_Hours", "Six_Hours", "Twelve_Hours", "TwentyFour_Hours"], var.config_snapshot_frequency)
    error_message = "Snapshot frequency must be a valid AWS Config frequency value"
  }
}
```

## main.tf

```hcl
# Data source for account ID
data "aws_caller_identity" "current" {}

# S3 Bucket for AWS Config
resource "aws_s3_bucket" "config_bucket" {
  bucket = "compliance-config-${var.environment_suffix}"

  tags = {
    Name        = "compliance-config-${var.environment_suffix}"
    Purpose     = "AWS Config storage"
    Environment = var.environment_suffix
  }
}

resource "aws_s3_bucket_public_access_block" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.config_key.id
    }
  }
}

resource "aws_s3_bucket_versioning" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# KMS Key for encryption
resource "aws_kms_key" "config_key" {
  description             = "KMS key for compliance module encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

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
        Sid    = "Allow AWS Config to use the key"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda to use the key"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "compliance-kms-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_kms_alias" "config_key" {
  name          = "alias/compliance-${var.environment_suffix}"
  target_key_id = aws_kms_key.config_key.key_id
}

# IAM Role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "compliance-config-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "compliance-config-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy_attachment" "config_role" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name = "compliance-config-s3-policy"
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
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.config_key.arn
      }
    ]
  })
}

# AWS Config Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "compliance-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "compliance-channel-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config_bucket.id
  sns_topic_arn  = var.sns_email_endpoint != "" ? aws_sns_topic.compliance_notifications[0].arn : null

  snapshot_delivery_properties {
    delivery_frequency = var.config_snapshot_frequency
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}
```

## config_rules.tf

```hcl
# AWS Config Rules for Compliance Validation
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "s3-bucket-public-read-prohibited-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "s3_bucket_public_write_prohibited" {
  name = "s3-bucket-public-write-prohibited-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-server-side-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "ec2-ebs-encryption-by-default-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "rds_encryption" {
  name = "rds-storage-encrypted-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "ec2_no_public_ip" {
  name = "ec2-instance-no-public-ip-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "EC2_INSTANCE_NO_PUBLIC_IP"
  }

  scope {
    compliance_resource_types = ["AWS::EC2::Instance"]
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "iam_password_policy" {
  name = "iam-password-policy-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  input_parameters = jsonencode({
    RequireUppercaseCharacters = true
    RequireLowercaseCharacters = true
    RequireSymbols             = true
    RequireNumbers             = true
    MinimumPasswordLength      = 14
    PasswordReusePrevention    = 24
    MaxPasswordAge             = 90
  })

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "root_account_mfa" {
  name = "root-account-mfa-enabled-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

# Custom Config Rule for resource tagging
resource "aws_config_config_rule" "required_tags" {
  name = "required-tags-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key = "Environment"
    tag2Key = "Owner"
    tag3Key = "CostCenter"
  })

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::S3::Bucket",
      "AWS::RDS::DBInstance"
    ]
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}
```

## remediation.tf

```hcl
# Lambda function for automated remediation
resource "aws_lambda_function" "remediation" {
  filename         = "${path.module}/lambda/remediation.zip"
  function_name    = "compliance-remediation-${var.environment_suffix}"
  role             = aws_iam_role.lambda_remediation.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  timeout          = 300
  source_code_hash = filebase64sha256("${path.module}/lambda/remediation.zip")

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
      CONFIG_BUCKET      = aws_s3_bucket.config_bucket.id
      KMS_KEY_ID         = aws_kms_key.config_key.id
      SNS_TOPIC_ARN      = var.sns_email_endpoint != "" ? aws_sns_topic.compliance_notifications[0].arn : ""
    }
  }

  tags = {
    Name        = "compliance-remediation-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  depends_on = [aws_cloudwatch_log_group.lambda_remediation]
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_remediation" {
  name = "compliance-lambda-remediation-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "compliance-lambda-remediation-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy" "lambda_remediation_policy" {
  name = "compliance-lambda-remediation-policy"
  role = aws_iam_role.lambda_remediation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutBucketPublicAccessBlock",
          "s3:PutEncryptionConfiguration",
          "s3:PutBucketVersioning"
        ]
        Resource = "arn:aws:s3:::*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:ModifyInstanceAttribute",
          "ec2:ModifyVolume",
          "ec2:CreateTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:ModifyDBInstance",
          "rds:AddTagsToResource"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "config:PutEvaluations",
          "config:GetComplianceDetailsByResource"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_email_endpoint != "" ? aws_sns_topic.compliance_notifications[0].arn : "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.config_key.arn
      }
    ]
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_remediation" {
  name              = "/aws/lambda/compliance-remediation-${var.environment_suffix}"
  retention_in_days = 14

  tags = {
    Name        = "compliance-remediation-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# EventBridge Rule for Config Compliance Changes
resource "aws_cloudwatch_event_rule" "config_compliance_change" {
  name        = "compliance-config-change-${var.environment_suffix}"
  description = "Trigger remediation on Config compliance changes"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
    detail = {
      messageType = ["ComplianceChangeNotification"]
      newEvaluationResult = {
        complianceType = ["NON_COMPLIANT"]
      }
    }
  })

  tags = {
    Name        = "compliance-config-change-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "lambda_remediation" {
  count = var.enable_auto_remediation ? 1 : 0
  rule  = aws_cloudwatch_event_rule.config_compliance_change.name
  arn   = aws_lambda_function.remediation.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  count         = var.enable_auto_remediation ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.remediation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.config_compliance_change.arn
}
```

## notifications.tf

```hcl
# SNS Topic for compliance notifications
resource "aws_sns_topic" "compliance_notifications" {
  count             = var.sns_email_endpoint != "" ? 1 : 0
  name              = "compliance-notifications-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.config_key.id

  tags = {
    Name        = "compliance-notifications-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_sns_topic_subscription" "compliance_email" {
  count     = var.sns_email_endpoint != "" ? 1 : 0
  topic_arn = aws_sns_topic.compliance_notifications[0].arn
  protocol  = "email"
  endpoint  = var.sns_email_endpoint
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "compliance_notifications" {
  count = var.sns_email_endpoint != "" ? 1 : 0
  arn   = aws_sns_topic.compliance_notifications[0].arn
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
        Resource = aws_sns_topic.compliance_notifications[0].arn
      },
      {
        Sid    = "AllowLambdaPublish"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.compliance_notifications[0].arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# CloudWatch Dashboard for compliance monitoring
resource "aws_cloudwatch_dashboard" "compliance" {
  dashboard_name = "compliance-monitoring-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Config", "ComplianceScore", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Overall Compliance Score"
        }
      },
      {
        type = "log"
        properties = {
          query  = "SOURCE '/aws/lambda/compliance-remediation-${var.environment_suffix}' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          region = var.aws_region
          title  = "Recent Remediation Actions"
        }
      }
    ]
  })
}
```

## outputs.tf

```hcl
output "config_recorder_id" {
  description = "ID of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.id
}

output "config_bucket_name" {
  description = "Name of the S3 bucket storing Config data"
  value       = aws_s3_bucket.config_bucket.id
}

output "config_bucket_arn" {
  description = "ARN of the S3 bucket storing Config data"
  value       = aws_s3_bucket.config_bucket.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.config_key.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.config_key.arn
}

output "remediation_lambda_arn" {
  description = "ARN of the remediation Lambda function"
  value       = aws_lambda_function.remediation.arn
}

output "remediation_lambda_name" {
  description = "Name of the remediation Lambda function"
  value       = aws_lambda_function.remediation.function_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for compliance notifications"
  value       = var.sns_email_endpoint != "" ? aws_sns_topic.compliance_notifications[0].arn : null
}

output "compliance_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=compliance-monitoring-${var.environment_suffix}"
}

output "config_rules" {
  description = "List of enabled Config rule names"
  value = [
    aws_config_config_rule.s3_bucket_public_read_prohibited.name,
    aws_config_config_rule.s3_bucket_public_write_prohibited.name,
    aws_config_config_rule.s3_bucket_encryption.name,
    aws_config_config_rule.encrypted_volumes.name,
    aws_config_config_rule.rds_encryption.name,
    aws_config_config_rule.ec2_no_public_ip.name,
    aws_config_config_rule.iam_password_policy.name,
    aws_config_config_rule.root_account_mfa.name,
    aws_config_config_rule.required_tags.name
  ]
}
```

## lambda/index.py

```python
import json
import boto3
import os
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
s3_client = boto3.client('s3')
ec2_client = boto3.client('ec2')
rds_client = boto3.client('rds')
sns_client = boto3.client('sns')
config_client = boto3.client('config')

# Environment variables
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', '')
CONFIG_BUCKET = os.environ.get('CONFIG_BUCKET', '')
KMS_KEY_ID = os.environ.get('KMS_KEY_ID', '')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main handler for compliance remediation Lambda function.

    This function is triggered by EventBridge when AWS Config detects
    non-compliant resources and performs automated remediation.
    """
    logger.info(f"Received event: {json.dumps(event)}")

    try:
        # Extract compliance details from event
        detail = event.get('detail', {})
        resource_type = detail.get('resourceType', '')
        resource_id = detail.get('resourceId', '')
        config_rule_name = detail.get('configRuleName', '')
        compliance_type = detail.get('newEvaluationResult', {}).get('complianceType', '')

        logger.info(f"Processing {compliance_type} resource: {resource_type}/{resource_id} for rule {config_rule_name}")

        if compliance_type != 'NON_COMPLIANT':
            logger.info("Resource is compliant, no action needed")
            return {'statusCode': 200, 'body': 'Resource is compliant'}

        # Route to appropriate remediation function
        remediation_result = None

        if 's3' in config_rule_name.lower():
            remediation_result = remediate_s3_bucket(resource_id, config_rule_name)
        elif 'ec2' in config_rule_name.lower() or 'ebs' in config_rule_name.lower():
            remediation_result = remediate_ec2_resource(resource_id, resource_type, config_rule_name)
        elif 'rds' in config_rule_name.lower():
            remediation_result = remediate_rds_instance(resource_id, config_rule_name)
        elif 'tag' in config_rule_name.lower():
            remediation_result = remediate_missing_tags(resource_id, resource_type)
        else:
            logger.warning(f"No remediation handler for rule: {config_rule_name}")
            send_notification(
                subject="Manual Remediation Required",
                message=f"Resource {resource_id} is non-compliant with {config_rule_name}. Manual remediation required."
            )
            return {'statusCode': 200, 'body': 'Manual remediation required'}

        # Send success notification
        if remediation_result:
            send_notification(
                subject="Compliance Remediation Successful",
                message=f"Successfully remediated {resource_type}/{resource_id} for rule {config_rule_name}. Details: {remediation_result}"
            )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Remediation completed', 'result': remediation_result})
        }

    except Exception as e:
        logger.error(f"Error during remediation: {str(e)}", exc_info=True)
        send_notification(
            subject="Compliance Remediation Failed",
            message=f"Failed to remediate resource. Error: {str(e)}"
        )
        raise


def remediate_s3_bucket(bucket_name: str, rule_name: str) -> str:
    """Remediate S3 bucket compliance issues."""
    logger.info(f"Remediating S3 bucket: {bucket_name}")

    actions_taken = []

    try:
        # Block public access
        if 'public' in rule_name.lower():
            s3_client.put_public_access_block(
                Bucket=bucket_name,
                PublicAccessBlockConfiguration={
                    'BlockPublicAcls': True,
                    'IgnorePublicAcls': True,
                    'BlockPublicPolicy': True,
                    'RestrictPublicBuckets': True
                }
            )
            actions_taken.append("Enabled public access block")
            logger.info(f"Enabled public access block for {bucket_name}")

        # Enable encryption
        if 'encryption' in rule_name.lower():
            s3_client.put_bucket_encryption(
                Bucket=bucket_name,
                ServerSideEncryptionConfiguration={
                    'Rules': [{
                        'ApplyServerSideEncryptionByDefault': {
                            'SSEAlgorithm': 'aws:kms',
                            'KMSMasterKeyID': KMS_KEY_ID
                        },
                        'BucketKeyEnabled': True
                    }]
                }
            )
            actions_taken.append("Enabled KMS encryption")
            logger.info(f"Enabled encryption for {bucket_name}")

        # Enable versioning
        if 'versioning' in rule_name.lower():
            s3_client.put_bucket_versioning(
                Bucket=bucket_name,
                VersioningConfiguration={'Status': 'Enabled'}
            )
            actions_taken.append("Enabled versioning")
            logger.info(f"Enabled versioning for {bucket_name}")

        return f"S3 remediation completed: {', '.join(actions_taken)}"

    except Exception as e:
        logger.error(f"Error remediating S3 bucket {bucket_name}: {str(e)}")
        raise


def remediate_ec2_resource(resource_id: str, resource_type: str, rule_name: str) -> str:
    """Remediate EC2 instance or EBS volume compliance issues."""
    logger.info(f"Remediating EC2 resource: {resource_id}")

    actions_taken = []

    try:
        if resource_type == 'AWS::EC2::Instance':
            # Disable public IP on instance (requires stop/start)
            if 'public-ip' in rule_name.lower():
                # Tag for manual review instead of automatic modification
                ec2_client.create_tags(
                    Resources=[resource_id],
                    Tags=[
                        {'Key': 'ComplianceStatus', 'Value': 'RequiresReview'},
                        {'Key': 'ComplianceIssue', 'Value': 'PublicIP'}
                    ]
                )
                actions_taken.append("Tagged instance for manual review (public IP)")
                logger.info(f"Tagged instance {resource_id} for manual review")

        elif resource_type == 'AWS::EC2::Volume':
            # Note: Cannot encrypt existing volumes, must create snapshot and new encrypted volume
            ec2_client.create_tags(
                Resources=[resource_id],
                Tags=[
                    {'Key': 'ComplianceStatus', 'Value': 'RequiresReview'},
                    {'Key': 'ComplianceIssue', 'Value': 'UnencryptedVolume'}
                ]
            )
            actions_taken.append("Tagged volume for manual encryption")
            logger.info(f"Tagged volume {resource_id} for manual encryption")

        # Add required tags if missing
        if 'tag' in rule_name.lower():
            remediate_missing_tags(resource_id, resource_type)
            actions_taken.append("Added required tags")

        return f"EC2 remediation completed: {', '.join(actions_taken)}"

    except Exception as e:
        logger.error(f"Error remediating EC2 resource {resource_id}: {str(e)}")
        raise


def remediate_rds_instance(instance_id: str, rule_name: str) -> str:
    """Remediate RDS instance compliance issues."""
    logger.info(f"Remediating RDS instance: {instance_id}")

    actions_taken = []

    try:
        # Note: Cannot enable encryption on existing RDS instances
        # Tag for manual review
        if 'encryption' in rule_name.lower():
            rds_client.add_tags_to_resource(
                ResourceName=f"arn:aws:rds:{boto3.session.Session().region_name}:{boto3.client('sts').get_caller_identity()['Account']}:db:{instance_id}",
                Tags=[
                    {'Key': 'ComplianceStatus', 'Value': 'RequiresReview'},
                    {'Key': 'ComplianceIssue', 'Value': 'UnencryptedStorage'}
                ]
            )
            actions_taken.append("Tagged RDS instance for manual encryption")
            logger.info(f"Tagged RDS instance {instance_id} for manual review")

        return f"RDS remediation completed: {', '.join(actions_taken)}"

    except Exception as e:
        logger.error(f"Error remediating RDS instance {instance_id}: {str(e)}")
        raise


def remediate_missing_tags(resource_id: str, resource_type: str) -> str:
    """Add required tags to resources."""
    logger.info(f"Adding required tags to {resource_type}/{resource_id}")

    required_tags = [
        {'Key': 'Environment', 'Value': ENVIRONMENT_SUFFIX},
        {'Key': 'Owner', 'Value': 'ComplianceTeam'},
        {'Key': 'CostCenter', 'Value': 'Infrastructure'}
    ]

    try:
        if resource_type in ['AWS::EC2::Instance', 'AWS::EC2::Volume']:
            ec2_client.create_tags(Resources=[resource_id], Tags=required_tags)
        elif resource_type == 'AWS::RDS::DBInstance':
            session = boto3.session.Session()
            account_id = boto3.client('sts').get_caller_identity()['Account']
            resource_arn = f"arn:aws:rds:{session.region_name}:{account_id}:db:{resource_id}"
            rds_client.add_tags_to_resource(ResourceName=resource_arn, Tags=required_tags)
        elif resource_type == 'AWS::S3::Bucket':
            # S3 bucket tagging
            s3_client.put_bucket_tagging(
                Bucket=resource_id,
                Tagging={'TagSet': required_tags}
            )

        logger.info(f"Added required tags to {resource_id}")
        return "Added required tags successfully"

    except Exception as e:
        logger.error(f"Error adding tags to {resource_id}: {str(e)}")
        raise


def send_notification(subject: str, message: str) -> None:
    """Send SNS notification about remediation actions."""
    try:
        # Only send if SNS topic exists
        topic_arn = os.environ.get('SNS_TOPIC_ARN', '')
        if topic_arn:
            sns_client.publish(
                TopicArn=topic_arn,
                Subject=subject,
                Message=message
            )
            logger.info(f"Sent notification: {subject}")
    except Exception as e:
        logger.warning(f"Failed to send notification: {str(e)}")
```

> Note: `lambda/remediation.zip` is the packaged artifact for deployment and is therefore not included inline.
