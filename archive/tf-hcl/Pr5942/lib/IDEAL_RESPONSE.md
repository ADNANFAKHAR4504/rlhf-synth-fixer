# Overview

This solution implements a secure VPC with comprehensive CloudTrail audit logging for healthcare compliance in AWS Singapore region (ap-southeast-1). The infrastructure provides HIPAA-compliant audit trails for all API activity, automated compliance violation detection via Lambda, and encrypted log storage using customer-managed KMS keys.

## Architecture

- VPC with private subnets only (no internet/NAT gateways)
- CloudTrail logging all management events to S3 and CloudWatch Logs
- Lambda function monitors CloudTrail events for compliance violations
- SNS topic delivers compliance alerts
- KMS encryption for all log storage
- CloudWatch alarms monitor CloudTrail health and Lambda function metrics

---

## lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
  backend "s3" {
    
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Owner       = var.owner
      CostCenter  = var.cost_center
      Purpose     = "audit-logging"
      Compliance  = "HIPAA"
    }
  }
}

provider "random" {}

provider "archive" {}

# Variables

variable "aws_region" {
  description = "AWS region for VPC deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "ecommerce-dev"
}

variable "owner" {
  description = "Owner of infrastructure"
  type        = string
  default     = "security-team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "compliance"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_1_cidr" {
  description = "Private subnet 1 CIDR"
  type        = string
  default     = "10.0.10.0/24"
}

variable "private_subnet_2_cidr" {
  description = "Private subnet 2 CIDR"
  type        = string
  default     = "10.0.20.0/24"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 60
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}

variable "cloudwatch_logs_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 7
}

variable "cloudtrail_s3_key_prefix" {
  description = "S3 key prefix for CloudTrail logs"
  type        = string
  default     = "cloudtrail-logs"
}

variable "kms_deletion_window_days" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7
}

locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    CostCenter  = var.cost_center
  }
}
```

***

## lib/main.tf

```hcl
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# VPC

resource "aws_vpc" "healthcare" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "healthcare-${var.environment}"
    }
  )
}

# Private Subnets

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.healthcare.id
  cidr_block        = var.private_subnet_1_cidr
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = merge(
    local.common_tags,
    {
      Name = "private-${data.aws_availability_zones.available.names[0]}-${var.environment}"
    }
  )
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.healthcare.id
  cidr_block        = var.private_subnet_2_cidr
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(
    local.common_tags,
    {
      Name = "private-${data.aws_availability_zones.available.names[1]}-${var.environment}"
    }
  )
}

# Security Group (Corrected - no sg- prefix)

resource "aws_security_group" "application" {
  name        = "application-${var.environment}"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.healthcare.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.healthcare.cidr_block]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "application-${var.environment}"
    }
  )
}

# KMS Key for CloudTrail Encryption

resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail log encryption"
  deletion_window_in_days = var.kms_deletion_window_days
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM policies"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:DecryptDataKey"
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

  tags = merge(
    local.common_tags,
    {
      Name = "cloudtrail-${var.environment}"
    }
  )
}

resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/cloudtrail-logs-${var.environment}"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

# S3 Bucket for CloudTrail Logs

resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket              = "cloudtrail-logs-${data.aws_caller_identity.current.account_id}-${var.environment}"
  force_destroy       = true

  tags = merge(
    local.common_tags,
    {
      Name = "cloudtrail-logs-${var.environment}"
    }
  )
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

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
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/${var.cloudtrail_s3_key_prefix}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.cloudtrail_logs]
}

# CloudWatch Logs Group for CloudTrail

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/healthcare-audit-${var.environment}"
  retention_in_days = var.cloudwatch_logs_retention_days
  kms_key_id        = aws_kms_key.cloudtrail.arn

  tags = merge(
    local.common_tags,
    {
      Name = "cloudtrail-logs-${var.environment}"
    }
  )
}

# IAM Role for CloudTrail CloudWatch Logs

resource "aws_iam_role" "cloudtrail_cloudwatch_logs" {
  name = "cloudtrail-cloudwatch-logs-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "cloudtrail-cloudwatch-logs-${var.environment}"
    }
  )
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch_logs" {
  name   = "cloudtrail-cloudwatch-logs-${var.environment}"
  role   = aws_iam_role.cloudtrail_cloudwatch_logs.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

# CloudTrail

resource "aws_cloudtrail" "main" {
  name                          = "healthcare-audit-${var.environment}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail.arn
  cloud_watch_logs_group_name   = "${aws_cloudwatch_log_group.cloudtrail.name}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_cloudwatch_logs.arn

  depends_on = [
    aws_s3_bucket_policy.cloudtrail_logs,
    aws_iam_role_policy.cloudtrail_cloudwatch_logs
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "healthcare-audit-${var.environment}"
    }
  )
}

# SNS Topic for Compliance Alerts

resource "aws_sns_topic" "compliance_alerts" {
  name              = "compliance-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.cloudtrail.id

  tags = merge(
    local.common_tags,
    {
      Name = "compliance-alerts-${var.environment}"
    }
  )
}

# Lambda Execution Role

resource "aws_iam_role" "lambda_compliance" {
  name = "lambda-compliance-checker-${var.environment}"

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
    local.common_tags,
    {
      Name = "lambda-compliance-checker-${var.environment}"
    }
  )
}

resource "aws_iam_role_policy" "lambda_compliance" {
  name   = "lambda-compliance-checker-${var.environment}"
  role   = aws_iam_role.lambda_compliance.id
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
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeNetworkAcls",
          "s3:GetBucketPolicy",
          "iam:GetPolicy",
          "kms:DescribeKey",
          "sns:Publish"
        ]
        Resource = "*"
      }
    ]
  })

  depends_on = [aws_iam_role.lambda_compliance]
}

# Lambda Function

resource "aws_lambda_function" "compliance_checker" {
  filename         = "lambda_compliance.zip"
  function_name    = "compliance-checker-${var.environment}"
  role             = aws_iam_role.lambda_compliance.arn
  handler          = "lambda_compliance.lambda_handler"
  runtime          = "python3.11"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.compliance_alerts.arn
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "compliance-checker-${var.environment}"
    }
  )

  depends_on = [
    aws_iam_role_policy.lambda_compliance,
    aws_cloudwatch_log_group.lambda_logs
  ]
}

# CloudWatch Log Group for Lambda

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/compliance-checker-${var.environment}"
  retention_in_days = var.cloudwatch_logs_retention_days
  kms_key_id        = aws_kms_key.cloudtrail.arn

  tags = merge(
    local.common_tags,
    {
      Name = "lambda-logs-${var.environment}"
    }
  )
}

# CloudWatch Logs Subscription Filter

resource "aws_cloudwatch_log_subscription_filter" "cloudtrail_compliance" {
  name            = "compliance-check-${var.environment}"
  log_group_name  = aws_cloudwatch_log_group.cloudtrail.name
  filter_pattern  = "[event_type = \"ModifySecurityGroupRules\" || event_type = \"PutBucketPolicy\" || event_type = \"PutUserPolicy\" || event_type = \"PutGroupPolicy\" || event_type = \"PutRolePolicy\"]"
  destination_arn = aws_lambda_function.compliance_checker.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_checker.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
}

# CloudWatch Alarms

resource "aws_cloudwatch_metric_alarm" "cloudtrail_health" {
  alarm_name          = "cloudtrail-health-${var.environment}"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "NumberOfNotificationsDelivered"
  namespace           = "CloudTrailMetrics"
  period              = 3600
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "CloudTrail is not delivering logs to S3"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "cloudtrail-health-${var.environment}"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "lambda-compliance-errors-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Lambda compliance checker has errors"
  alarm_actions       = [aws_sns_topic.compliance_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.compliance_checker.function_name
  }

  tags = merge(
    local.common_tags,
    {
      Name = "lambda-errors-${var.environment}"
    }
  )
}

# Outputs

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.healthcare.id
}

output "private_subnet_1_id" {
  description = "Private subnet 1 ID"
  value       = aws_subnet.private_1.id
}

output "private_subnet_2_id" {
  description = "Private subnet 2 ID"
  value       = aws_subnet.private_2.id
}

output "security_group_id" {
  description = "Application security group ID"
  value       = aws_security_group.application.id
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_name" {
  description = "CloudTrail name"
  value       = aws_cloudtrail.main.name
}

output "s3_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.cloudtrail_logs.arn
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.cloudtrail.arn
}

output "kms_key_alias" {
  description = "KMS key alias"
  value       = aws_kms_alias.cloudtrail.name
}

output "cloudwatch_logs_group_name" {
  description = "CloudWatch Logs group name"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudwatch_logs_group_arn" {
  description = "CloudWatch Logs group ARN"
  value       = aws_cloudwatch_log_group.cloudtrail.arn
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.compliance_checker.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.compliance_checker.arn
}

output "lambda_role_arn" {
  description = "Lambda execution role ARN"
  value       = aws_iam_role.lambda_compliance.arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for compliance alerts"
  value       = aws_sns_topic.compliance_alerts.arn
}

output "sns_topic_name" {
  description = "SNS topic name"
  value       = aws_sns_topic.compliance_alerts.name
}

output "cloudtrail_health_alarm_name" {
  description = "CloudTrail health alarm name"
  value       = aws_cloudwatch_metric_alarm.cloudtrail_health.alarm_name
}

output "lambda_error_alarm_name" {
  description = "Lambda error alarm name"
  value       = aws_cloudwatch_metric_alarm.lambda_errors.alarm_name
}

output "account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS region"
  value       = data.aws_region.current.name
}
```

***

## lib/lambda_compliance.py

```python
import json
import boto3
import os
from datetime import datetime

sns_client = boto3.client('sns')
ec2_client = boto3.client('ec2')
s3_client = boto3.client('s3')
iam_client = boto3.client('iam')

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']


def lambda_handler(event, context):
    """
    Compliance checker for CloudTrail events.
    Detects security violations and publishes alerts to SNS.
    """
    
    try:
        # Parse CloudWatch Logs event
        log_data = json.loads(
            json.dumps(event)
        )
        
        # Extract CloudTrail records from subscription filter
        cloudtrail_records = extract_records(log_data)
        
        violations = []
        
        for record in cloudtrail_records:
            print(f"Processing event: {record.get('eventName')}")
            
            # Check for security group violations
            if record.get('eventName') == 'AuthorizeSecurityGroupIngress':
                if is_public_ingress(record):
                    violations.append({
                        'eventName': 'AuthorizeSecurityGroupIngress',
                        'violation': 'Security group rule allows public access (0.0.0.0/0)',
                        'resource': record.get('requestParameters', {}).get('groupId'),
                        'timestamp': record.get('eventTime')
                    })
            
            # Check for S3 bucket policy violations
            elif record.get('eventName') == 'PutBucketPolicy':
                if is_public_bucket_policy(record):
                    violations.append({
                        'eventName': 'PutBucketPolicy',
                        'violation': 'S3 bucket policy allows public access',
                        'resource': record.get('requestParameters', {}).get('bucketName'),
                        'timestamp': record.get('eventTime')
                    })
            
            # Check for overly permissive IAM policies
            elif record.get('eventName') in ['PutUserPolicy', 'PutGroupPolicy', 'PutRolePolicy']:
                if is_overly_permissive_policy(record):
                    violations.append({
                        'eventName': record.get('eventName'),
                        'violation': 'IAM policy contains overly permissive actions',
                        'resource': record.get('requestParameters', {}).get('userName') or 
                                  record.get('requestParameters', {}).get('groupName') or
                                  record.get('requestParameters', {}).get('roleName'),
                        'timestamp': record.get('eventTime')
                    })
        
        # Publish violations to SNS
        if violations:
            publish_alert(violations)
            print(f"Published {len(violations)} violations")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'violations_found': len(violations),
                'violations': violations
            })
        }
    
    except Exception as e:
        print(f"Error processing event: {str(e)}")
        error_alert = {
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }
        publish_alert([error_alert])
        raise


def extract_records(event):
    """Extract CloudTrail records from CloudWatch Logs subscription filter."""
    try:
        log_events = event.get('logEvents', [])
        records = []
        
        for log_event in log_events:
            message = json.loads(log_event['message'])
            if 'Records' in message:
                records.extend(message['Records'])
        
        return records
    except Exception as e:
        print(f"Error extracting records: {str(e)}")
        return []


def is_public_ingress(record):
    """Check if security group rule allows public access."""
    try:
        request_params = record.get('requestParameters', {})
        ip_permissions = request_params.get('ipPermissions', [])
        
        for perm in ip_permissions:
            ip_ranges = perm.get('ipv4Ranges', [])
            for ip_range in ip_ranges:
                if ip_range.get('cidrIp') == '0.0.0.0/0':
                    return True
        
        return False
    except Exception as e:
        print(f"Error checking ingress: {str(e)}")
        return False


def is_public_bucket_policy(record):
    """Check if S3 bucket policy allows public access."""
    try:
        request_params = record.get('requestParameters', {})
        policy_str = request_params.get('bucketPolicy', '')
        
        if not policy_str:
            return False
        
        policy = json.loads(policy_str)
        
        for statement in policy.get('Statement', []):
            if statement.get('Effect') == 'Allow':
                principal = statement.get('Principal', {})
                if principal == '*' or principal.get('AWS') == '*':
                    return True
        
        return False
    except Exception as e:
        print(f"Error checking bucket policy: {str(e)}")
        return False


def is_overly_permissive_policy(record):
    """Check if IAM policy contains overly permissive actions."""
    try:
        request_params = record.get('requestParameters', {})
        policy_document = request_params.get('policyDocument', '')
        
        if not policy_document:
            return False
        
        policy = json.loads(policy_document)
        
        for statement in policy.get('Statement', []):
            if statement.get('Effect') == 'Allow':
                actions = statement.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]
                
                for action in actions:
                    if action == '*':
                        return True
        
        return False
    except Exception as e:
        print(f"Error checking IAM policy: {str(e)}")
        return False


def publish_alert(violations):
    """Publish compliance violations to SNS topic."""
    try:
        message = {
            'violations': violations,
            'timestamp': datetime.utcnow().isoformat(),
            'region': os.environ.get('AWS_REGION', 'ap-southeast-1')
        }
        
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject='Healthcare Compliance Violation Detected',
            Message=json.dumps(message, indent=2)
        )
    except Exception as e:
        print(f"Error publishing alert: {str(e)}")
        raise
```

***

## Deployment

```bash
cd lib/

# Initialize Terraform
terraform init

# Validate configuration
terraform plan

# Deploy infrastructure
terraform apply

# Verify deployment
terraform output
```