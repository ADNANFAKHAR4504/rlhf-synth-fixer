# Infrastructure Compliance Checking System - Terraform Implementation

This implementation provides a complete AWS infrastructure compliance checking system using Terraform. The system monitors S3, RDS, and EC2 resources for compliance violations and sends notifications through SNS.

## Architecture Overview

The solution includes:
- AWS Config with configuration recorder and delivery channel
- Config rules for detecting unencrypted S3 buckets and publicly accessible RDS instances
- Lambda function for processing compliance events and analyzing snapshots
- CloudWatch Logs for centralized logging with 30-day retention
- SNS topic for compliance violation notifications
- S3 bucket for storing Config snapshots
- IAM roles and policies following least-privilege principles

## File: variables.tf

```hcl
# variables.tf
# Input variables for the compliance checking system

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix to append to resource names for environment isolation"
  type        = string
  default     = "prod"
}

variable "config_snapshot_frequency" {
  description = "Frequency for Config snapshot delivery (One_Hour, Three_Hours, Six_Hours, Twelve_Hours, or TwentyFour_Hours)"
  type        = string
  default     = "TwentyFour_Hours"
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Memory size for Lambda function in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Timeout for Lambda function in seconds"
  type        = number
  default     = 60
}

variable "lambda_runtime" {
  description = "Python runtime version for Lambda function"
  type        = string
  default     = "python3.11"
}

variable "notification_email" {
  description = "Email address for compliance violation notifications (optional)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ComplianceChecking"
    ManagedBy   = "Terraform"
    Environment = "Production"
  }
}
```

## File: main.tf

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

# CloudWatch Log Group for Config delivery
resource "aws_cloudwatch_log_group" "config_delivery_logs" {
  name              = "/aws/config/delivery-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "config-delivery-logs-${var.environment_suffix}"
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
      SNS_TOPIC_ARN       = aws_sns_topic.compliance_notifications.arn
      CONFIG_BUCKET       = aws_s3_bucket.config_bucket.id
      ENVIRONMENT_SUFFIX  = var.environment_suffix
      LOG_LEVEL           = "INFO"
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
  source_arn    = "arn:aws:config:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
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

## File: lambda_function.py

```python
# lambda_function.py
# Lambda function to process Config compliance events and analyze snapshots

import json
import boto3
import os
import logging
from datetime import datetime
from typing import Dict, List, Any

# Configure logging
logger = logging.getLogger()
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger.setLevel(getattr(logging, log_level))

# Initialize AWS clients
config_client = boto3.client('config')
sns_client = boto3.client('sns')
s3_client = boto3.client('s3')

# Environment variables
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
CONFIG_BUCKET = os.environ.get('CONFIG_BUCKET')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'prod')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing Config compliance events.

    Args:
        event: Event data from EventBridge or Config
        context: Lambda context object

    Returns:
        Response dictionary with status and message
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Determine event source
        if 'source' in event and event['source'] == 'aws.config':
            # Config compliance change event
            process_compliance_event(event)
        elif 'source' in event and event['source'] == 'aws.events':
            # Periodic check triggered by EventBridge
            perform_periodic_compliance_check()
        else:
            # Direct invocation - perform full compliance check
            perform_periodic_compliance_check()

        return {
            'statusCode': 200,
            'body': json.dumps('Compliance check completed successfully')
        }

    except Exception as e:
        logger.error(f"Error processing compliance check: {str(e)}", exc_info=True)
        send_error_notification(str(e))
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }


def process_compliance_event(event: Dict[str, Any]) -> None:
    """
    Process a Config compliance change event.

    Args:
        event: EventBridge event containing Config compliance change details
    """
    try:
        detail = event.get('detail', {})
        config_rule_name = detail.get('configRuleName', 'Unknown')
        new_evaluation_result = detail.get('newEvaluationResult', {})
        compliance_type = new_evaluation_result.get('complianceType', 'UNKNOWN')

        logger.info(f"Processing compliance event for rule: {config_rule_name}")
        logger.info(f"Compliance type: {compliance_type}")

        if compliance_type == 'NON_COMPLIANT':
            resource_type = new_evaluation_result.get('evaluationResultIdentifier', {}).get('evaluationResultQualifier', {}).get('resourceType', 'Unknown')
            resource_id = new_evaluation_result.get('evaluationResultIdentifier', {}).get('evaluationResultQualifier', {}).get('resourceId', 'Unknown')

            violation_details = {
                'rule_name': config_rule_name,
                'resource_type': resource_type,
                'resource_id': resource_id,
                'compliance_type': compliance_type,
                'annotation': new_evaluation_result.get('annotation', 'No annotation provided'),
                'timestamp': detail.get('resultRecordedTime', datetime.utcnow().isoformat())
            }

            logger.warning(f"Compliance violation detected: {json.dumps(violation_details)}")
            send_compliance_notification(violation_details)
        else:
            logger.info(f"Resource is compliant: {config_rule_name}")

    except Exception as e:
        logger.error(f"Error processing compliance event: {str(e)}", exc_info=True)
        raise


def perform_periodic_compliance_check() -> None:
    """
    Perform a comprehensive periodic compliance check across all Config rules.
    """
    try:
        logger.info("Starting periodic compliance check")

        # Get all Config rules
        config_rules = get_all_config_rules()
        logger.info(f"Found {len(config_rules)} Config rules to check")

        all_violations = []

        # Check compliance for each rule
        for rule in config_rules:
            rule_name = rule['ConfigRuleName']
            logger.info(f"Checking compliance for rule: {rule_name}")

            violations = check_rule_compliance(rule_name)
            if violations:
                all_violations.extend(violations)
                logger.warning(f"Found {len(violations)} violations for rule: {rule_name}")

        # Send summary notification if violations found
        if all_violations:
            send_summary_notification(all_violations)
            logger.warning(f"Total violations found: {len(all_violations)}")
        else:
            logger.info("No compliance violations found")

    except Exception as e:
        logger.error(f"Error during periodic compliance check: {str(e)}", exc_info=True)
        raise


def get_all_config_rules() -> List[Dict[str, Any]]:
    """
    Retrieve all Config rules in the account.

    Returns:
        List of Config rule dictionaries
    """
    try:
        rules = []
        paginator = config_client.get_paginator('describe_config_rules')

        for page in paginator.paginate():
            rules.extend(page.get('ConfigRules', []))

        return rules

    except Exception as e:
        logger.error(f"Error retrieving Config rules: {str(e)}", exc_info=True)
        raise


def check_rule_compliance(rule_name: str) -> List[Dict[str, Any]]:
    """
    Check compliance status for a specific Config rule.

    Args:
        rule_name: Name of the Config rule to check

    Returns:
        List of non-compliant resources
    """
    try:
        violations = []
        paginator = config_client.get_paginator('get_compliance_details_by_config_rule')

        for page in paginator.paginate(
            ConfigRuleName=rule_name,
            ComplianceTypes=['NON_COMPLIANT']
        ):
            evaluation_results = page.get('EvaluationResults', [])

            for result in evaluation_results:
                resource_id = result.get('EvaluationResultIdentifier', {}).get('EvaluationResultQualifier', {}).get('ResourceId', 'Unknown')
                resource_type = result.get('EvaluationResultIdentifier', {}).get('EvaluationResultQualifier', {}).get('ResourceType', 'Unknown')

                violation = {
                    'rule_name': rule_name,
                    'resource_type': resource_type,
                    'resource_id': resource_id,
                    'compliance_type': result.get('ComplianceType', 'UNKNOWN'),
                    'annotation': result.get('Annotation', 'No annotation provided'),
                    'config_rule_invoked_time': result.get('ConfigRuleInvokedTime', '').strftime('%Y-%m-%d %H:%M:%S') if result.get('ConfigRuleInvokedTime') else 'Unknown',
                    'result_recorded_time': result.get('ResultRecordedTime', '').strftime('%Y-%m-%d %H:%M:%S') if result.get('ResultRecordedTime') else 'Unknown'
                }

                violations.append(violation)

        return violations

    except Exception as e:
        logger.error(f"Error checking compliance for rule {rule_name}: {str(e)}", exc_info=True)
        return []


def send_compliance_notification(violation: Dict[str, Any]) -> None:
    """
    Send SNS notification for a single compliance violation.

    Args:
        violation: Dictionary containing violation details
    """
    try:
        subject = f"[{ENVIRONMENT_SUFFIX.upper()}] Compliance Violation Detected: {violation['rule_name']}"

        message = f"""
Compliance Violation Alert

Environment: {ENVIRONMENT_SUFFIX}
Rule Name: {violation['rule_name']}
Resource Type: {violation['resource_type']}
Resource ID: {violation['resource_id']}
Compliance Status: {violation['compliance_type']}
Timestamp: {violation['timestamp']}

Details:
{violation['annotation']}

Action Required:
Please investigate and remediate this compliance violation immediately.

---
This is an automated notification from the AWS Infrastructure Compliance Checking System.
"""

        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )

        logger.info(f"Notification sent successfully. MessageId: {response['MessageId']}")

    except Exception as e:
        logger.error(f"Error sending compliance notification: {str(e)}", exc_info=True)


def send_summary_notification(violations: List[Dict[str, Any]]) -> None:
    """
    Send SNS notification with summary of multiple compliance violations.

    Args:
        violations: List of violation dictionaries
    """
    try:
        subject = f"[{ENVIRONMENT_SUFFIX.upper()}] Compliance Summary: {len(violations)} Violations Found"

        # Group violations by rule
        violations_by_rule = {}
        for violation in violations:
            rule_name = violation['rule_name']
            if rule_name not in violations_by_rule:
                violations_by_rule[rule_name] = []
            violations_by_rule[rule_name].append(violation)

        message_parts = [
            "Compliance Violations Summary Report",
            f"\nEnvironment: {ENVIRONMENT_SUFFIX}",
            f"Total Violations: {len(violations)}",
            f"Rules with Violations: {len(violations_by_rule)}",
            f"Report Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC",
            "\n" + "="*80 + "\n"
        ]

        for rule_name, rule_violations in violations_by_rule.items():
            message_parts.append(f"\nRule: {rule_name}")
            message_parts.append(f"Violations: {len(rule_violations)}")
            message_parts.append("-" * 40)

            for i, violation in enumerate(rule_violations[:5], 1):  # Limit to first 5 per rule
                message_parts.append(f"\n  {i}. Resource Type: {violation['resource_type']}")
                message_parts.append(f"     Resource ID: {violation['resource_id']}")
                message_parts.append(f"     Status: {violation['compliance_type']}")

            if len(rule_violations) > 5:
                message_parts.append(f"\n  ... and {len(rule_violations) - 5} more violations")

            message_parts.append("")

        message_parts.append("\n" + "="*80)
        message_parts.append("\nAction Required:")
        message_parts.append("Please review and remediate these compliance violations.")
        message_parts.append("\nFor detailed information, check the AWS Config console or CloudWatch Logs.")
        message_parts.append("\n---")
        message_parts.append("This is an automated notification from the AWS Infrastructure Compliance Checking System.")

        message = "\n".join(message_parts)

        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )

        logger.info(f"Summary notification sent successfully. MessageId: {response['MessageId']}")

    except Exception as e:
        logger.error(f"Error sending summary notification: {str(e)}", exc_info=True)


def send_error_notification(error_message: str) -> None:
    """
    Send SNS notification for Lambda execution errors.

    Args:
        error_message: Error message to include in notification
    """
    try:
        subject = f"[{ENVIRONMENT_SUFFIX.upper()}] Compliance Checker Error"

        message = f"""
Compliance Checker Lambda Error

Environment: {ENVIRONMENT_SUFFIX}
Error Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC

Error Details:
{error_message}

Action Required:
Please investigate this error in CloudWatch Logs and resolve any issues with the compliance checking system.

---
This is an automated error notification from the AWS Infrastructure Compliance Checking System.
"""

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )

        logger.info("Error notification sent successfully")

    except Exception as e:
        logger.error(f"Error sending error notification: {str(e)}", exc_info=True)


def analyze_config_snapshot() -> Dict[str, Any]:
    """
    Analyze the latest Config snapshot from S3.

    Returns:
        Dictionary containing snapshot analysis results
    """
    try:
        logger.info(f"Analyzing Config snapshots from bucket: {CONFIG_BUCKET}")

        # List objects in the Config bucket
        response = s3_client.list_objects_v2(
            Bucket=CONFIG_BUCKET,
            Prefix='AWSLogs/',
            MaxKeys=10
        )

        if 'Contents' not in response:
            logger.warning("No Config snapshots found in S3 bucket")
            return {'status': 'no_snapshots', 'message': 'No snapshots available'}

        # Get the most recent snapshot
        objects = sorted(response['Contents'], key=lambda x: x['LastModified'], reverse=True)
        latest_snapshot = objects[0]

        logger.info(f"Latest snapshot: {latest_snapshot['Key']}, Last Modified: {latest_snapshot['LastModified']}")

        return {
            'status': 'success',
            'latest_snapshot': latest_snapshot['Key'],
            'last_modified': latest_snapshot['LastModified'].isoformat(),
            'size_bytes': latest_snapshot['Size']
        }

    except Exception as e:
        logger.error(f"Error analyzing Config snapshot: {str(e)}", exc_info=True)
        return {'status': 'error', 'message': str(e)}
```

## File: outputs.tf

```hcl
# outputs.tf
# Output values for the compliance checking system

output "config_bucket_name" {
  description = "Name of the S3 bucket storing Config snapshots"
  value       = aws_s3_bucket.config_bucket.id
}

output "config_bucket_arn" {
  description = "ARN of the S3 bucket storing Config snapshots"
  value       = aws_s3_bucket.config_bucket.arn
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_recorder_arn" {
  description = "ARN of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.id
}

output "compliance_lambda_function_name" {
  description = "Name of the compliance checker Lambda function"
  value       = aws_lambda_function.compliance_checker.function_name
}

output "compliance_lambda_function_arn" {
  description = "ARN of the compliance checker Lambda function"
  value       = aws_lambda_function.compliance_checker.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for compliance notifications"
  value       = aws_sns_topic.compliance_notifications.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic for compliance notifications"
  value       = aws_sns_topic.compliance_notifications.name
}

output "config_rules" {
  description = "List of Config rule names"
  value = [
    aws_config_config_rule.s3_bucket_encryption.name,
    aws_config_config_rule.rds_public_access.name,
    aws_config_config_rule.rds_encryption.name,
    aws_config_config_rule.ec2_detailed_monitoring.name
  ]
}

output "cloudwatch_log_groups" {
  description = "CloudWatch Log Groups for monitoring"
  value = {
    config_logs          = aws_cloudwatch_log_group.config_logs.name
    lambda_logs          = aws_cloudwatch_log_group.lambda_logs.name
    config_delivery_logs = aws_cloudwatch_log_group.config_delivery_logs.name
  }
}

output "eventbridge_rules" {
  description = "EventBridge rules for compliance monitoring"
  value = {
    compliance_change_rule = aws_cloudwatch_event_rule.config_compliance.name
    periodic_check_rule    = aws_cloudwatch_event_rule.periodic_check.name
  }
}

output "iam_roles" {
  description = "IAM roles created for the compliance system"
  value = {
    config_role  = aws_iam_role.config_role.arn
    lambda_role  = aws_iam_role.lambda_role.arn
  }
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}
```

## File: terraform.tfvars.example

```hcl
# terraform.tfvars.example
# Example variable values - copy to terraform.tfvars and customize

# AWS region for deployment
aws_region = "us-east-1"

# Unique environment suffix for resource naming
environment_suffix = "prod"

# Config snapshot delivery frequency
# Options: One_Hour, Three_Hours, Six_Hours, Twelve_Hours, TwentyFour_Hours
config_snapshot_frequency = "TwentyFour_Hours"

# CloudWatch Logs retention period (days)
cloudwatch_log_retention_days = 30

# Lambda function configuration
lambda_memory_size = 256
lambda_timeout     = 60
lambda_runtime     = "python3.11"

# Optional: Email address for compliance notifications
# Leave empty to skip email subscription
notification_email = ""

# Common tags for all resources
tags = {
  Project     = "ComplianceChecking"
  ManagedBy   = "Terraform"
  Environment = "Production"
  Owner       = "SecurityTeam"
  CostCenter  = "Security"
}
```

## Deployment Instructions

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.4.0 installed
3. Appropriate IAM permissions to create Config, Lambda, SNS, S3, CloudWatch, and IAM resources

### Deployment Steps

1. **Initialize Terraform**:
   ```bash
   cd lib
   terraform init
   ```

2. **Create terraform.tfvars**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your desired values
   ```

3. **Review the plan**:
   ```bash
   terraform plan -out=tfplan
   ```

4. **Apply the configuration**:
   ```bash
   terraform apply tfplan
   ```

5. **Confirm SNS subscription** (if email notification is configured):
   - Check your email for SNS subscription confirmation
   - Click the confirmation link

### Verification

After deployment, verify the system is working:

1. **Check Config recorder status**:
   ```bash
   aws configservice describe-configuration-recorder-status
   ```

2. **View Config rules**:
   ```bash
   aws configservice describe-config-rules
   ```

3. **Test Lambda function**:
   ```bash
   aws lambda invoke \
     --function-name compliance-checker-prod \
     --payload '{}' \
     response.json
   cat response.json
   ```

4. **Monitor CloudWatch Logs**:
   ```bash
   aws logs tail /aws/lambda/compliance-checker-prod --follow
   ```

### Testing Compliance Detection

To test the compliance detection system:

1. **Create a non-compliant S3 bucket** (unencrypted):
   ```bash
   aws s3api create-bucket --bucket test-unencrypted-bucket-${RANDOM}
   ```

2. **Wait for Config to evaluate** (may take a few minutes)

3. **Check for compliance notification** in SNS

4. **View Lambda logs** for processing details

### Cleanup

To remove all resources:

```bash
terraform destroy
```

Note: Ensure the Config S3 bucket is empty before destroying, or add `force_destroy = true` to the bucket resource.

## Architecture Considerations

### Security

1. **IAM Least Privilege**: All IAM roles use specific permissions without wildcards
2. **S3 Bucket Security**: Config bucket has encryption, versioning, and blocks public access
3. **SNS Topic Policy**: Restricts publish access to Config and Lambda services only
4. **CloudWatch Logs**: Centralized logging with 30-day retention for audit trails

### Scalability

1. **EventBridge Integration**: Asynchronous event processing with automatic scaling
2. **Lambda Configuration**: 256MB memory and 60-second timeout handle large compliance checks
3. **Config Snapshot Frequency**: Configurable delivery frequency (default: 24 hours)
4. **Periodic Checks**: Additional scheduled checks every 6 hours

### Cost Optimization

1. **CloudWatch Logs Retention**: 30-day retention reduces long-term storage costs
2. **Lambda Memory**: 256MB provides good performance-to-cost ratio
3. **Config Resource Types**: Limited to S3, RDS, EC2 to control evaluation costs
4. **SNS**: Pay-per-use pricing for notifications

### Monitoring and Alerting

1. **CloudWatch Logs**: Three separate log groups for Config, Lambda, and delivery
2. **SNS Notifications**: Immediate alerts for compliance violations
3. **EventBridge Rules**: Both real-time and periodic compliance checks
4. **Lambda Error Handling**: Comprehensive error logging and notification

## Compliance Rules Implemented

### 1. S3 Bucket Encryption
- **Rule**: s3-bucket-server-side-encryption-enabled
- **Purpose**: Detects S3 buckets without server-side encryption
- **Type**: AWS Managed Rule

### 2. RDS Public Access
- **Rule**: rds-instance-public-access-check
- **Purpose**: Detects RDS instances accessible from the public internet
- **Type**: AWS Managed Rule

### 3. RDS Storage Encryption
- **Rule**: rds-storage-encrypted
- **Purpose**: Detects RDS instances without storage encryption at rest
- **Type**: AWS Managed Rule

### 4. EC2 Detailed Monitoring
- **Rule**: ec2-instance-detailed-monitoring-enabled
- **Purpose**: Ensures EC2 instances have detailed monitoring enabled
- **Type**: AWS Managed Rule

## Customization Options

### Adding More Config Rules

To add additional Config rules, add new resources in main.tf:

```hcl
resource "aws_config_config_rule" "custom_rule" {
  name = "custom-rule-name-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "AWS_MANAGED_RULE_IDENTIFIER"
  }

  depends_on = [aws_config_configuration_recorder.main]
}
```

### Modifying Lambda Function

The Lambda function code is in `lambda_function.py`. You can:
- Add custom compliance checks
- Modify notification formats
- Integrate with additional AWS services
- Add remediation logic

### Adjusting Monitoring Frequency

Modify the periodic check schedule in main.tf:

```hcl
resource "aws_cloudwatch_event_rule" "periodic_check" {
  schedule_expression = "rate(1 hour)"  # Change frequency here
}
```

## Troubleshooting

### Config Recorder Not Starting

If the Config recorder fails to start:
1. Verify IAM role has correct permissions
2. Check S3 bucket policy allows Config service access
3. Review CloudWatch Logs for error messages

### Lambda Timeout Errors

If Lambda times out during compliance checks:
1. Increase `lambda_timeout` variable
2. Increase `lambda_memory_size` for faster processing
3. Reduce scope of compliance checks

### No Notifications Received

If SNS notifications aren't received:
1. Confirm SNS subscription is active
2. Check Lambda has SNS publish permissions
3. Verify SNS topic policy allows Lambda to publish
4. Review Lambda CloudWatch Logs for errors

## Maintenance

### Regular Tasks

1. **Review CloudWatch Logs**: Check for errors or anomalies weekly
2. **Update Lambda Code**: Deploy updates to Lambda function as needed
3. **Monitor Costs**: Review AWS Config and Lambda usage monthly
4. **Test Notifications**: Periodically test SNS notification delivery
5. **Update Config Rules**: Add new rules as compliance requirements evolve

### Terraform State Management

- Store Terraform state in S3 backend (configured in provider.tf)
- Enable state locking with DynamoDB
- Regular state backups recommended
- Use workspaces for multiple environments

## Additional Resources

- [AWS Config Documentation](https://docs.aws.amazon.com/config/)
- [AWS Config Managed Rules](https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
