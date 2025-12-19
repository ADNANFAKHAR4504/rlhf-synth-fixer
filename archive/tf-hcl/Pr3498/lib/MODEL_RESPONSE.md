# Security Monitoring Platform Infrastructure

## Terraform Code for Security Monitoring Platform

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "SecurityTeam"
}

variable "security_email" {
  description = "Email address for security notifications"
  type        = string
}

variable "cloudtrail_bucket_prefix" {
  description = "Prefix for CloudTrail S3 bucket name"
  type        = string
  default     = "security-cloudtrail-logs"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 180
}

variable "glacier_transition_days" {
  description = "Days before transitioning logs to Glacier"
  type        = number
  default     = 90
}

variable "enable_mfa_delete" {
  description = "Enable MFA delete for S3 bucket"
  type        = bool
  default     = true
}

locals {
  common_tags = {
    Environment = var.environment
    Purpose     = "Security Monitoring"
    Owner       = var.owner
    ManagedBy   = "Terraform"
  }
}
```

```hcl
# kms.tf
resource "aws_kms_key" "security_key" {
  description             = "KMS key for security monitoring platform"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "security-monitoring-kms-key"
    }
  )
}

resource "aws_kms_alias" "security_key_alias" {
  name          = "alias/security-monitoring"
  target_key_id = aws_kms_key.security_key.key_id
}
```

```hcl
# s3.tf
data "aws_caller_identity" "current" {}

resource "random_id" "bucket_suffix" {
  byte_length = 8
}

resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "${var.cloudtrail_bucket_prefix}-${data.aws_caller_identity.current.account_id}-${random_id.bucket_suffix.hex}"

  tags = merge(
    local.common_tags,
    {
      Name = "CloudTrail Logs Bucket"
    }
  )
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status     = "Enabled"
    mfa_delete = var.enable_mfa_delete ? "Enabled" : "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.security_key.arn
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = var.glacier_transition_days
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # 7 years
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail_logs.arn]
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail_logs.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }

  statement {
    sid    = "SecurityTeamAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.security_team.arn]
    }
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.cloudtrail_logs.arn,
      "${aws_s3_bucket.cloudtrail_logs.arn}/*"
    ]
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}
```

```hcl
# cloudtrail.tf
resource "aws_cloudtrail" "main" {
  name                          = "security-monitoring-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*:*:function/*"]
    }
  }

  kms_key_id = aws_kms_key.security_key.arn

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]

  tags = merge(
    local.common_tags,
    {
      Name = "security-monitoring-trail"
    }
  )
}
```

```hcl
# cloudwatch.tf
resource "aws_cloudwatch_log_group" "security_events" {
  name              = "/aws/security/events"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.security_key.arn

  tags = merge(
    local.common_tags,
    {
      Name = "security-events-log-group"
    }
  )
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/security"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.security_key.arn

  tags = merge(
    local.common_tags,
    {
      Name = "cloudtrail-log-group"
    }
  )
}

resource "aws_cloudwatch_log_stream" "guardduty" {
  name           = "guardduty-findings"
  log_group_name = aws_cloudwatch_log_group.security_events.name
}

resource "aws_cloudwatch_log_stream" "security_hub" {
  name           = "security-hub-findings"
  log_group_name = aws_cloudwatch_log_group.security_events.name
}

resource "aws_cloudwatch_log_stream" "custom_rules" {
  name           = "custom-rules-processor"
  log_group_name = aws_cloudwatch_log_group.security_events.name
}
```

```hcl
# guardduty.tf
resource "aws_guardduty_detector" "main" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = merge(
    local.common_tags,
    {
      Name = "security-monitoring-detector"
    }
  )
}

# Enable GuardDuty in all regions
data "aws_regions" "all" {
  all_regions = true
}

resource "aws_guardduty_detector" "regional" {
  for_each = toset([for r in data.aws_regions.all.names : r if r != var.aws_region])

  provider = aws.alias[each.key]
  enable   = true

  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = merge(
    local.common_tags,
    {
      Name   = "security-monitoring-detector-${each.key}"
      Region = each.key
    }
  )
}
```

```hcl
# security_hub.tf
resource "aws_securityhub_account" "main" {}

resource "aws_securityhub_standards_subscription" "foundational" {
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/aws-foundational-security-best-practices/v/1.0.0"
}

resource "aws_securityhub_finding_aggregator" "main" {
  linking_mode = "ALL_REGIONS"

  depends_on = [aws_securityhub_account.main]
}

resource "aws_securityhub_product_subscription" "guardduty" {
  depends_on  = [aws_securityhub_account.main]
  product_arn = "arn:aws:securityhub:${var.aws_region}::product/aws/guardduty"
}
```

```hcl
# sns.tf
resource "aws_sns_topic" "security_alerts" {
  name              = "security-monitoring-alerts"
  kms_master_key_id = aws_kms_key.security_key.id

  tags = merge(
    local.common_tags,
    {
      Name = "security-alerts-topic"
    }
  )
}

resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_email

  filter_policy = jsonencode({
    severity = ["HIGH", "CRITICAL"]
  })
}

resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "security-alerts-policy"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}
```

```hcl
# eventbridge.tf
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "guardduty-high-severity-findings"
  description = "Capture high severity GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [
        { numeric = [">=", 7] }
      ]
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "guardduty-findings-rule"
    }
  )
}

resource "aws_cloudwatch_event_target" "guardduty_sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn

  input_transformer {
    input_paths = {
      severity    = "$.detail.severity"
      type        = "$.detail.type"
      region      = "$.region"
      accountId   = "$.account"
      time        = "$.time"
      description = "$.detail.description"
    }

    input_template = jsonencode({
      severity    = "<severity>"
      type        = "<type>"
      region      = "<region>"
      accountId   = "<accountId>"
      time        = "<time>"
      description = "<description>"
    })
  }
}

resource "aws_cloudwatch_event_rule" "security_hub_findings" {
  name        = "security-hub-critical-findings"
  description = "Capture critical Security Hub findings"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = {
          Label = ["CRITICAL", "HIGH"]
        }
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "security-hub-findings-rule"
    }
  )
}

resource "aws_cloudwatch_event_target" "security_hub_sns" {
  rule      = aws_cloudwatch_event_rule.security_hub_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

resource "aws_cloudwatch_event_target" "security_hub_lambda" {
  rule      = aws_cloudwatch_event_rule.security_hub_findings.name
  target_id = "ProcessWithLambda"
  arn       = aws_lambda_function.custom_rules_processor.arn
}

resource "aws_cloudwatch_event_rule" "cloudtrail_api_events" {
  name        = "cloudtrail-sensitive-api-calls"
  description = "Monitor sensitive API calls"

  event_pattern = jsonencode({
    source      = ["aws.cloudtrail"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "DeleteBucket",
        "DeleteTrail",
        "StopLogging",
        "UpdateTrail",
        "PutBucketPolicy",
        "DeleteBucketPolicy",
        "CreateAccessKey",
        "DeleteAccessKey"
      ]
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "cloudtrail-api-events-rule"
    }
  )
}

resource "aws_cloudwatch_event_target" "cloudtrail_sns" {
  rule      = aws_cloudwatch_event_rule.cloudtrail_api_events.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}
```

```hcl
# lambda.tf
resource "aws_lambda_function" "custom_rules_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "security-custom-rules-processor"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 60
  memory_size     = 256

  environment {
    variables = {
      LOG_GROUP = aws_cloudwatch_log_group.security_events.name
      SNS_TOPIC = aws_sns_topic.security_alerts.arn
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "custom-rules-processor"
    }
  )
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "/tmp/lambda_function.zip"

  source {
    content  = file("${path.module}/lambda_function.py")
    filename = "index.py"
  }
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.custom_rules_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.security_hub_findings.arn
}
```

```python
# lambda_function.py
import json
import boto3
import os
from datetime import datetime

sns = boto3.client('sns')
logs = boto3.client('logs')

def handler(event, context):
    """
    Process security findings and add custom tags based on patterns
    """
    print(f"Processing event: {json.dumps(event)}")

    try:
        # Parse the incoming security event
        if 'detail' in event:
            detail = event['detail']

            # Extract finding details
            findings = detail.get('findings', [detail])

            for finding in findings:
                # Add custom tags based on event patterns
                custom_tags = analyze_finding(finding)

                # Enrich the finding with custom tags
                enriched_finding = {
                    **finding,
                    'CustomTags': custom_tags,
                    'ProcessedAt': datetime.utcnow().isoformat()
                }

                # Log enriched finding
                log_finding(enriched_finding)

                # Send critical findings to SNS
                if is_critical(finding):
                    notify_security_team(enriched_finding)

        return {
            'statusCode': 200,
            'body': json.dumps('Successfully processed security finding')
        }

    except Exception as e:
        print(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }

def analyze_finding(finding):
    """
    Analyze finding and return custom tags
    """
    tags = []

    # Check for specific patterns
    title = finding.get('Title', '').lower()
    description = finding.get('Description', '').lower()

    if 'root' in title or 'root' in description:
        tags.append('ROOT_ACTIVITY')

    if 'public' in title or 'exposed' in description:
        tags.append('PUBLIC_EXPOSURE')

    if 'cryptocurrency' in description or 'mining' in description:
        tags.append('CRYPTO_MINING')

    if 'malware' in title or 'malware' in description:
        tags.append('MALWARE_DETECTED')

    if 'unauthorized' in title or 'suspicious' in description:
        tags.append('SUSPICIOUS_ACTIVITY')

    # Add severity-based tags
    severity = finding.get('Severity', {})
    if isinstance(severity, dict):
        label = severity.get('Label', '')
    else:
        label = str(severity)

    if label in ['CRITICAL', 'HIGH']:
        tags.append('IMMEDIATE_ACTION')

    return tags

def is_critical(finding):
    """
    Determine if finding requires immediate notification
    """
    severity = finding.get('Severity', {})
    if isinstance(severity, dict):
        label = severity.get('Label', '')
        normalized = severity.get('Normalized', 0)
    else:
        label = str(severity)
        normalized = 0

    return label in ['CRITICAL', 'HIGH'] or normalized >= 70

def log_finding(finding):
    """
    Log enriched finding to CloudWatch
    """
    log_group = os.environ.get('LOG_GROUP', '/aws/security/events')

    try:
        logs.put_log_events(
            logGroupName=log_group,
            logStreamName='custom-rules-processor',
            logEvents=[
                {
                    'timestamp': int(datetime.utcnow().timestamp() * 1000),
                    'message': json.dumps(finding)
                }
            ]
        )
    except Exception as e:
        print(f"Error logging to CloudWatch: {str(e)}")

def notify_security_team(finding):
    """
    Send notification to security team via SNS
    """
    sns_topic = os.environ.get('SNS_TOPIC')

    if not sns_topic:
        print("SNS topic not configured")
        return

    message = {
        'Title': finding.get('Title', 'Security Finding'),
        'Description': finding.get('Description', 'No description'),
        'Severity': finding.get('Severity', {}),
        'CustomTags': finding.get('CustomTags', []),
        'Resources': finding.get('Resources', []),
        'ProcessedAt': finding.get('ProcessedAt')
    }

    try:
        sns.publish(
            TopicArn=sns_topic,
            Subject=f"[CRITICAL] Security Alert: {finding.get('Title', 'Security Finding')}",
            Message=json.dumps(message, indent=2),
            MessageAttributes={
                'severity': {
                    'DataType': 'String',
                    'StringValue': finding.get('Severity', {}).get('Label', 'UNKNOWN')
                }
            }
        )
        print(f"Notification sent for finding: {finding.get('Id', 'unknown')}")
    except Exception as e:
        print(f"Error sending SNS notification: {str(e)}")
```

```hcl
# iam.tf
# Security Team Role
resource "aws_iam_role" "security_team" {
  name = "SecurityTeamRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "security-team-role"
    }
  )
}

resource "aws_iam_role_policy" "security_team_policy" {
  name = "SecurityTeamPolicy"
  role = aws_iam_role.security_team.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "securityhub:Get*",
          "securityhub:List*",
          "securityhub:Describe*",
          "guardduty:Get*",
          "guardduty:List*",
          "cloudtrail:Get*",
          "cloudtrail:Describe*",
          "cloudtrail:LookupEvents",
          "logs:Get*",
          "logs:Describe*",
          "logs:FilterLogEvents",
          "s3:GetObject",
          "s3:ListBucket",
          "sns:Get*",
          "sns:List*",
          "events:List*",
          "events:Describe*",
          "lambda:Get*",
          "lambda:List*",
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "CustomRulesLambdaExecutionRole"

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

  tags = merge(
    local.common_tags,
    {
      Name = "lambda-execution-role"
    }
  )
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_custom_policy" {
  name = "CustomRulesProcessorPolicy"
  role = aws_iam_role.lambda_execution.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.security_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.security_key.arn
      }
    ]
  })
}

# CloudTrail CloudWatch Role
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "CloudTrailCloudWatchRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "cloudtrail-cloudwatch-role"
    }
  )
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch_policy" {
  name = "CloudTrailCloudWatchPolicy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${aws_cloudwatch_log_group.cloudtrail.name}:*"
      }
    ]
  })
}
```

```hcl
# outputs.tf
output "security_hub_arn" {
  description = "ARN of Security Hub"
  value       = aws_securityhub_account.main.arn
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = aws_guardduty_detector.main.id
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_bucket" {
  description = "CloudTrail S3 bucket name"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "lambda_function_name" {
  description = "Custom rules processor Lambda function name"
  value       = aws_lambda_function.custom_rules_processor.function_name
}

output "security_team_role_arn" {
  description = "Security team IAM role ARN"
  value       = aws_iam_role.security_team.arn
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.security_key.id
}

output "log_group_name" {
  description = "CloudWatch log group for security events"
  value       = aws_cloudwatch_log_group.security_events.name
}
```

```hcl
# providers_regional.tf
# Dynamic provider configuration for multi-region GuardDuty
provider "aws" {
  for_each = toset([for r in data.aws_regions.all.names : r if r != var.aws_region])
  alias    = each.key
  region   = each.key
}
```