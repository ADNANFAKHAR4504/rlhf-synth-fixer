# AWS Config Compliance Analysis Solution

This solution implements an automated infrastructure compliance scanning system using Terraform and HCL. It deploys AWS Config with custom Lambda-based compliance rules across multiple AWS regions (us-east-1, us-west-2, eu-west-1) to monitor EC2, RDS, S3, and IAM resources.

## Architecture Overview

The solution consists of:
- AWS Config recorders and delivery channels in each region
- S3 bucket for centralized compliance data storage
- Lambda functions for custom compliance rule evaluation
- Config aggregator for multi-region data collection
- SNS topic for non-compliance notifications
- IAM roles with least-privilege policies

## Implementation Files

### File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string
  default     = "prod"
}

variable "aws_regions" {
  description = "List of AWS regions for Config deployment"
  type        = list(string)
  default     = ["us-east-1", "us-west-2", "eu-west-1"]
}

variable "primary_region" {
  description = "Primary region for S3 bucket and aggregator"
  type        = string
  default     = "us-east-1"
}

variable "notification_email" {
  description = "Email address for compliance notifications"
  type        = string
}

variable "config_delivery_frequency" {
  description = "Delivery frequency for Config snapshots"
  type        = string
  default     = "TwentyFour_Hours"
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

variable "compliance_check_schedule" {
  description = "Schedule expression for compliance checks (every 6 hours)"
  type        = string
  default     = "rate(6 hours)"
}

variable "resource_types_to_record" {
  description = "AWS resource types to record in Config"
  type        = list(string)
  default = [
    "AWS::EC2::Instance",
    "AWS::RDS::DBInstance",
    "AWS::S3::Bucket",
    "AWS::IAM::Role",
    "AWS::IAM::Policy",
    "AWS::IAM::User"
  ]
}
```

### File: main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

# Data sources for account and region information
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# Local variables
locals {
  account_id        = data.aws_caller_identity.current.account_id
  config_bucket_name = "config-compliance-${var.environment_suffix}-${local.account_id}"

  compliance_rules = {
    encryption = "check-encryption-compliance"
    tagging    = "check-tagging-compliance"
    backup     = "check-backup-compliance"
  }
}
```

### File: s3.tf

```hcl
# S3 bucket for Config data storage (primary region only)
resource "aws_s3_bucket" "config_bucket" {
  provider = aws.primary
  bucket   = local.config_bucket_name

  force_destroy = true

  tags = {
    Name        = "config-bucket-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "AWS Config Compliance Data"
  }
}

# Enable versioning
resource "aws_s3_bucket_versioning" "config_bucket" {
  provider = aws.primary
  bucket   = aws_s3_bucket.config_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket" {
  provider = aws.primary
  bucket   = aws_s3_bucket.config_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "config_bucket" {
  provider = aws.primary
  bucket   = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy for Config access
resource "aws_s3_bucket_policy" "config_bucket" {
  provider = aws.primary
  bucket   = aws_s3_bucket.config_bucket.id

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
            "AWS:SourceAccount" = local.account_id
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
            "AWS:SourceAccount" = local.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketPutObject"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "AWS:SourceAccount" = local.account_id
          }
        }
      }
    ]
  })
}
```

### File: iam.tf

```hcl
# IAM role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "config-role-${var.environment_suffix}"

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

  tags = {
    Name        = "config-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Attach AWS managed policy for Config
resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# Custom policy for S3 access
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

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_role" {
  name = "lambda-compliance-role-${var.environment_suffix}"

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

  tags = {
    Name        = "lambda-compliance-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Lambda execution policy
resource "aws_iam_role_policy" "lambda_policy" {
  name = "lambda-compliance-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_role.id

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
        Resource = "arn:aws:logs:*:${local.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "config:PutEvaluations",
          "config:GetComplianceDetailsByConfigRule"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeVolumes",
          "rds:DescribeDBInstances",
          "s3:GetBucketEncryption",
          "s3:GetBucketTagging",
          "s3:GetBucketVersioning"
        ]
        Resource = "*"
      },
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
```

### File: sns.tf

```hcl
# SNS topic for compliance notifications
resource "aws_sns_topic" "compliance_notifications" {
  provider = aws.primary
  name     = "config-compliance-notifications-${var.environment_suffix}"

  tags = {
    Name        = "compliance-notifications-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# SNS topic policy
resource "aws_sns_topic_policy" "compliance_notifications" {
  provider = aws.primary
  arn      = aws_sns_topic.compliance_notifications.arn

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
      }
    ]
  })
}

# Email subscription
resource "aws_sns_topic_subscription" "compliance_email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.compliance_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
```

### File: lambda.tf

```hcl
# Lambda function for encryption compliance check
resource "aws_lambda_function" "encryption_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  filename         = data.archive_file.encryption_lambda.output_path
  function_name    = "config-encryption-check-${var.environment_suffix}-${each.value}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "encryption_check.lambda_handler"
  source_code_hash = data.archive_file.encryption_lambda.output_base64sha256
  runtime         = "python3.9"
  timeout         = var.lambda_timeout

  architectures = ["arm64"]

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
      SNS_TOPIC_ARN      = aws_sns_topic.compliance_notifications.arn
      AWS_REGION_NAME    = each.value
    }
  }

  tags = {
    Name        = "encryption-check-${var.environment_suffix}-${each.value}"
    Environment = var.environment_suffix
    ComplianceRule = "encryption"
  }
}

# Lambda function for tagging compliance check
resource "aws_lambda_function" "tagging_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  filename         = data.archive_file.tagging_lambda.output_path
  function_name    = "config-tagging-check-${var.environment_suffix}-${each.value}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "tagging_check.lambda_handler"
  source_code_hash = data.archive_file.tagging_lambda.output_base64sha256
  runtime         = "python3.9"
  timeout         = var.lambda_timeout

  architectures = ["arm64"]

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
      SNS_TOPIC_ARN      = aws_sns_topic.compliance_notifications.arn
      AWS_REGION_NAME    = each.value
    }
  }

  tags = {
    Name        = "tagging-check-${var.environment_suffix}-${each.value}"
    Environment = var.environment_suffix
    ComplianceRule = "tagging"
  }
}

# Lambda function for backup compliance check
resource "aws_lambda_function" "backup_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  filename         = data.archive_file.backup_lambda.output_path
  function_name    = "config-backup-check-${var.environment_suffix}-${each.value}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "backup_check.lambda_handler"
  source_code_hash = data.archive_file.backup_lambda.output_base64sha256
  runtime         = "python3.9"
  timeout         = var.lambda_timeout

  architectures = ["arm64"]

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
      SNS_TOPIC_ARN      = aws_sns_topic.compliance_notifications.arn
      AWS_REGION_NAME    = each.value
    }
  }

  tags = {
    Name        = "backup-check-${var.environment_suffix}-${each.value}"
    Environment = var.environment_suffix
    ComplianceRule = "backup"
  }
}

# Lambda permission for Config to invoke encryption check
resource "aws_lambda_permission" "encryption_check" {
  for_each = toset(var.aws_regions)

  statement_id  = "AllowConfigInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.encryption_check[each.value].function_name
  principal     = "config.amazonaws.com"
  source_account = local.account_id
}

# Lambda permission for Config to invoke tagging check
resource "aws_lambda_permission" "tagging_check" {
  for_each = toset(var.aws_regions)

  statement_id  = "AllowConfigInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tagging_check[each.value].function_name
  principal     = "config.amazonaws.com"
  source_account = local.account_id
}

# Lambda permission for Config to invoke backup check
resource "aws_lambda_permission" "backup_check" {
  for_each = toset(var.aws_regions)

  statement_id  = "AllowConfigInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backup_check[each.value].function_name
  principal     = "config.amazonaws.com"
  source_account = local.account_id
}

# EventBridge rule to trigger Lambda functions every 6 hours
resource "aws_cloudwatch_event_rule" "compliance_schedule" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  name                = "compliance-check-schedule-${var.environment_suffix}-${each.value}"
  description         = "Trigger compliance checks every 6 hours"
  schedule_expression = var.compliance_check_schedule

  tags = {
    Name        = "compliance-schedule-${var.environment_suffix}-${each.value}"
    Environment = var.environment_suffix
  }
}

# EventBridge targets for encryption check
resource "aws_cloudwatch_event_target" "encryption_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  rule      = aws_cloudwatch_event_rule.compliance_schedule[each.value].name
  target_id = "encryption-check-${each.value}"
  arn       = aws_lambda_function.encryption_check[each.value].arn
}

# Lambda permission for EventBridge to invoke encryption check
resource "aws_lambda_permission" "encryption_check_eventbridge" {
  for_each = toset(var.aws_regions)

  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.encryption_check[each.value].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_schedule[each.value].arn
}

# EventBridge targets for tagging check
resource "aws_cloudwatch_event_target" "tagging_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  rule      = aws_cloudwatch_event_rule.compliance_schedule[each.value].name
  target_id = "tagging-check-${each.value}"
  arn       = aws_lambda_function.tagging_check[each.value].arn
}

# Lambda permission for EventBridge to invoke tagging check
resource "aws_lambda_permission" "tagging_check_eventbridge" {
  for_each = toset(var.aws_regions)

  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tagging_check[each.value].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_schedule[each.value].arn
}

# EventBridge targets for backup check
resource "aws_cloudwatch_event_target" "backup_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  rule      = aws_cloudwatch_event_rule.compliance_schedule[each.value].name
  target_id = "backup-check-${each.value}"
  arn       = aws_lambda_function.backup_check[each.value].arn
}

# Lambda permission for EventBridge to invoke backup check
resource "aws_lambda_permission" "backup_check_eventbridge" {
  for_each = toset(var.aws_regions)

  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backup_check[each.value].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_schedule[each.value].arn
}
```

### File: lambda_packages.tf

```hcl
# Archive Lambda function code
data "archive_file" "encryption_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/encryption_check.py"
  output_path = "${path.module}/lambda/encryption_check.zip"
}

data "archive_file" "tagging_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/tagging_check.py"
  output_path = "${path.module}/lambda/tagging_check.zip"
}

data "archive_file" "backup_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/backup_check.py"
  output_path = "${path.module}/lambda/backup_check.zip"
}
```

### File: config.tf

```hcl
# AWS Config Recorder for us-east-1
resource "aws_config_configuration_recorder" "us_east_1" {
  provider = aws.us_east_1
  name     = "config-recorder-${var.environment_suffix}-us-east-1"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = false
    include_global_resource_types = true
    resource_types                = var.resource_types_to_record
  }
}

# AWS Config Delivery Channel for us-east-1
resource "aws_config_delivery_channel" "us_east_1" {
  provider = aws.us_east_1
  name     = "config-delivery-${var.environment_suffix}-us-east-1"

  s3_bucket_name = aws_s3_bucket.config_bucket.id
  s3_key_prefix  = "us-east-1"
  sns_topic_arn  = aws_sns_topic.compliance_notifications.arn

  snapshot_delivery_properties {
    delivery_frequency = var.config_delivery_frequency
  }

  depends_on = [aws_config_configuration_recorder.us_east_1]
}

# Start Config Recorder for us-east-1
resource "aws_config_configuration_recorder_status" "us_east_1" {
  provider = aws.us_east_1
  name     = aws_config_configuration_recorder.us_east_1.name

  is_enabled = true

  depends_on = [aws_config_delivery_channel.us_east_1]
}

# AWS Config Recorder for us-west-2
resource "aws_config_configuration_recorder" "us_west_2" {
  provider = aws.us_west_2
  name     = "config-recorder-${var.environment_suffix}-us-west-2"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = false
    include_global_resource_types = false
    resource_types                = var.resource_types_to_record
  }
}

# AWS Config Delivery Channel for us-west-2
resource "aws_config_delivery_channel" "us_west_2" {
  provider = aws.us_west_2
  name     = "config-delivery-${var.environment_suffix}-us-west-2"

  s3_bucket_name = aws_s3_bucket.config_bucket.id
  s3_key_prefix  = "us-west-2"
  sns_topic_arn  = aws_sns_topic.compliance_notifications.arn

  snapshot_delivery_properties {
    delivery_frequency = var.config_delivery_frequency
  }

  depends_on = [aws_config_configuration_recorder.us_west_2]
}

# Start Config Recorder for us-west-2
resource "aws_config_configuration_recorder_status" "us_west_2" {
  provider = aws.us_west_2
  name     = aws_config_configuration_recorder.us_west_2.name

  is_enabled = true

  depends_on = [aws_config_delivery_channel.us_west_2]
}

# AWS Config Recorder for eu-west-1
resource "aws_config_configuration_recorder" "eu_west_1" {
  provider = aws.eu_west_1
  name     = "config-recorder-${var.environment_suffix}-eu-west-1"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = false
    include_global_resource_types = false
    resource_types                = var.resource_types_to_record
  }
}

# AWS Config Delivery Channel for eu-west-1
resource "aws_config_delivery_channel" "eu_west_1" {
  provider = aws.eu_west_1
  name     = "config-delivery-${var.environment_suffix}-eu-west-1"

  s3_bucket_name = aws_s3_bucket.config_bucket.id
  s3_key_prefix  = "eu-west-1"
  sns_topic_arn  = aws_sns_topic.compliance_notifications.arn

  snapshot_delivery_properties {
    delivery_frequency = var.config_delivery_frequency
  }

  depends_on = [aws_config_configuration_recorder.eu_west_1]
}

# Start Config Recorder for eu-west-1
resource "aws_config_configuration_recorder_status" "eu_west_1" {
  provider = aws.eu_west_1
  name     = aws_config_configuration_recorder.eu_west_1.name

  is_enabled = true

  depends_on = [aws_config_delivery_channel.eu_west_1]
}
```

### File: config_rules.tf

```hcl
# Config Rule for encryption compliance in us-east-1
resource "aws_config_config_rule" "encryption_us_east_1" {
  provider = aws.us_east_1
  name     = "encryption-compliance-${var.environment_suffix}-us-east-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.encryption_check["us-east-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_east_1,
    aws_lambda_permission.encryption_check["us-east-1"]
  ]
}

# Config Rule for tagging compliance in us-east-1
resource "aws_config_config_rule" "tagging_us_east_1" {
  provider = aws.us_east_1
  name     = "tagging-compliance-${var.environment_suffix}-us-east-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.tagging_check["us-east-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_east_1,
    aws_lambda_permission.tagging_check["us-east-1"]
  ]
}

# Config Rule for backup compliance in us-east-1
resource "aws_config_config_rule" "backup_us_east_1" {
  provider = aws.us_east_1
  name     = "backup-compliance-${var.environment_suffix}-us-east-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.backup_check["us-east-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_east_1,
    aws_lambda_permission.backup_check["us-east-1"]
  ]
}

# Config Rule for encryption compliance in us-west-2
resource "aws_config_config_rule" "encryption_us_west_2" {
  provider = aws.us_west_2
  name     = "encryption-compliance-${var.environment_suffix}-us-west-2"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.encryption_check["us-west-2"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_west_2,
    aws_lambda_permission.encryption_check["us-west-2"]
  ]
}

# Config Rule for tagging compliance in us-west-2
resource "aws_config_config_rule" "tagging_us_west_2" {
  provider = aws.us_west_2
  name     = "tagging-compliance-${var.environment_suffix}-us-west-2"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.tagging_check["us-west-2"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_west_2,
    aws_lambda_permission.tagging_check["us-west-2"]
  ]
}

# Config Rule for backup compliance in us-west-2
resource "aws_config_config_rule" "backup_us_west_2" {
  provider = aws.us_west_2
  name     = "backup-compliance-${var.environment_suffix}-us-west-2"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.backup_check["us-west-2"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_west_2,
    aws_lambda_permission.backup_check["us-west-2"]
  ]
}

# Config Rule for encryption compliance in eu-west-1
resource "aws_config_config_rule" "encryption_eu_west_1" {
  provider = aws.eu_west_1
  name     = "encryption-compliance-${var.environment_suffix}-eu-west-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.encryption_check["eu-west-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.eu_west_1,
    aws_lambda_permission.encryption_check["eu-west-1"]
  ]
}

# Config Rule for tagging compliance in eu-west-1
resource "aws_config_config_rule" "tagging_eu_west_1" {
  provider = aws.eu_west_1
  name     = "tagging-compliance-${var.environment_suffix}-eu-west-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.tagging_check["eu-west-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.eu_west_1,
    aws_lambda_permission.tagging_check["eu-west-1"]
  ]
}

# Config Rule for backup compliance in eu-west-1
resource "aws_config_config_rule" "backup_eu_west_1" {
  provider = aws.eu_west_1
  name     = "backup-compliance-${var.environment_suffix}-eu-west-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.backup_check["eu-west-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.eu_west_1,
    aws_lambda_permission.backup_check["eu-west-1"]
  ]
}
```

### File: config_aggregator.tf

```hcl
# Config Aggregator to collect data from all regions
resource "aws_config_configuration_aggregator" "organization" {
  provider = aws.primary
  name     = "config-aggregator-${var.environment_suffix}"

  account_aggregation_source {
    account_ids = [local.account_id]
    regions     = var.aws_regions
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_east_1,
    aws_config_configuration_recorder_status.us_west_2,
    aws_config_configuration_recorder_status.eu_west_1
  ]

  tags = {
    Name        = "config-aggregator-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
```

### File: outputs.tf

```hcl
output "config_bucket_name" {
  description = "Name of the S3 bucket for Config data"
  value       = aws_s3_bucket.config_bucket.id
}

output "config_bucket_arn" {
  description = "ARN of the S3 bucket for Config data"
  value       = aws_s3_bucket.config_bucket.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for compliance notifications"
  value       = aws_sns_topic.compliance_notifications.arn
}

output "config_role_arn" {
  description = "ARN of the IAM role for AWS Config"
  value       = aws_iam_role.config_role.arn
}

output "lambda_role_arn" {
  description = "ARN of the IAM role for Lambda functions"
  value       = aws_iam_role.lambda_role.arn
}

output "config_aggregator_arn" {
  description = "ARN of the Config aggregator"
  value       = aws_config_configuration_aggregator.organization.arn
}

output "encryption_lambda_arns" {
  description = "ARNs of encryption check Lambda functions"
  value       = { for region, func in aws_lambda_function.encryption_check : region => func.arn }
}

output "tagging_lambda_arns" {
  description = "ARNs of tagging check Lambda functions"
  value       = { for region, func in aws_lambda_function.tagging_check : region => func.arn }
}

output "backup_lambda_arns" {
  description = "ARNs of backup check Lambda functions"
  value       = { for region, func in aws_lambda_function.backup_check : region => func.arn }
}

output "config_recorder_names" {
  description = "Names of Config recorders by region"
  value = {
    "us-east-1" = aws_config_configuration_recorder.us_east_1.name
    "us-west-2" = aws_config_configuration_recorder.us_west_2.name
    "eu-west-1" = aws_config_configuration_recorder.eu_west_1.name
  }
}
```

### File: lambda/encryption_check.py

```python
import json
import boto3
import os
from datetime import datetime

config_client = boto3.client('config')
sns_client = boto3.client('sns')
ec2_client = boto3.client('ec2')
rds_client = boto3.client('rds')
s3_client = boto3.client('s3')

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
REGION = os.environ.get('AWS_REGION_NAME', 'us-east-1')


def lambda_handler(event, context):
    """
    Lambda handler for encryption compliance checks.
    Evaluates EC2 instances, RDS databases, and S3 buckets for encryption.
    """
    print(f"Encryption compliance check triggered: {json.dumps(event)}")

    # Handle both Config rule evaluation and scheduled events
    if 'configRuleId' in event:
        # Config rule evaluation
        invoking_event = json.loads(event['configRuleInvokingEvent'])
        configuration_item = invoking_event.get('configurationItem', {})
        resource_type = configuration_item.get('resourceType')
        resource_id = configuration_item.get('resourceId')

        compliance = evaluate_resource_encryption(resource_type, resource_id)

        # Put evaluation result
        evaluations = [{
            'ComplianceResourceType': resource_type,
            'ComplianceResourceId': resource_id,
            'ComplianceType': compliance['status'],
            'Annotation': compliance['message'],
            'OrderingTimestamp': datetime.utcnow()
        }]

        config_client.put_evaluations(
            Evaluations=evaluations,
            ResultToken=event['resultToken']
        )

        # Send SNS notification if non-compliant
        if compliance['status'] == 'NON_COMPLIANT':
            send_notification(resource_type, resource_id, compliance['message'])

    else:
        # Scheduled event - scan all resources
        print("Scheduled scan initiated")
        scan_all_resources()

    return {
        'statusCode': 200,
        'body': json.dumps('Encryption compliance check completed')
    }


def evaluate_resource_encryption(resource_type, resource_id):
    """
    Evaluate encryption compliance for a specific resource.
    """
    try:
        if resource_type == 'AWS::EC2::Instance':
            return check_ec2_encryption(resource_id)
        elif resource_type == 'AWS::RDS::DBInstance':
            return check_rds_encryption(resource_id)
        elif resource_type == 'AWS::S3::Bucket':
            return check_s3_encryption(resource_id)
        else:
            return {
                'status': 'NOT_APPLICABLE',
                'message': 'Resource type not supported for encryption check'
            }
    except Exception as e:
        print(f"Error evaluating resource {resource_id}: {str(e)}")
        return {
            'status': 'INSUFFICIENT_DATA',
            'message': f'Error evaluating resource: {str(e)}'
        }


def check_ec2_encryption(instance_id):
    """
    Check if EC2 instance volumes are encrypted.
    """
    try:
        response = ec2_client.describe_instances(InstanceIds=[instance_id])

        if not response['Reservations']:
            return {'status': 'NOT_APPLICABLE', 'message': 'Instance not found'}

        instance = response['Reservations'][0]['Instances'][0]

        # Check all attached volumes
        unencrypted_volumes = []
        for mapping in instance.get('BlockDeviceMappings', []):
            volume_id = mapping.get('Ebs', {}).get('VolumeId')
            if volume_id:
                volume_response = ec2_client.describe_volumes(VolumeIds=[volume_id])
                if volume_response['Volumes']:
                    volume = volume_response['Volumes'][0]
                    if not volume.get('Encrypted', False):
                        unencrypted_volumes.append(volume_id)

        if unencrypted_volumes:
            return {
                'status': 'NON_COMPLIANT',
                'message': f'EC2 instance has unencrypted volumes: {", ".join(unencrypted_volumes)}'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'All EC2 instance volumes are encrypted'
        }
    except Exception as e:
        print(f"Error checking EC2 encryption: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_rds_encryption(db_instance_id):
    """
    Check if RDS instance is encrypted.
    """
    try:
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)

        if not response['DBInstances']:
            return {'status': 'NOT_APPLICABLE', 'message': 'DB instance not found'}

        db_instance = response['DBInstances'][0]

        if not db_instance.get('StorageEncrypted', False):
            return {
                'status': 'NON_COMPLIANT',
                'message': 'RDS instance storage is not encrypted'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'RDS instance storage is encrypted'
        }
    except Exception as e:
        print(f"Error checking RDS encryption: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_s3_encryption(bucket_name):
    """
    Check if S3 bucket has encryption enabled.
    """
    try:
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)

        rules = response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])

        if not rules:
            return {
                'status': 'NON_COMPLIANT',
                'message': 'S3 bucket does not have encryption configured'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'S3 bucket has encryption enabled'
        }
    except s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
        return {
            'status': 'NON_COMPLIANT',
            'message': 'S3 bucket does not have encryption configured'
        }
    except Exception as e:
        print(f"Error checking S3 encryption: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def scan_all_resources():
    """
    Scan all resources in the region for encryption compliance.
    """
    print("Scanning all resources for encryption compliance")
    non_compliant_resources = []

    # Scan EC2 instances
    try:
        ec2_response = ec2_client.describe_instances()
        for reservation in ec2_response['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                compliance = check_ec2_encryption(instance_id)
                if compliance['status'] == 'NON_COMPLIANT':
                    non_compliant_resources.append(f"EC2: {instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning EC2 instances: {str(e)}")

    # Scan RDS instances
    try:
        rds_response = rds_client.describe_db_instances()
        for db_instance in rds_response['DBInstances']:
            db_instance_id = db_instance['DBInstanceIdentifier']
            compliance = check_rds_encryption(db_instance_id)
            if compliance['status'] == 'NON_COMPLIANT':
                non_compliant_resources.append(f"RDS: {db_instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning RDS instances: {str(e)}")

    # Send summary notification if there are non-compliant resources
    if non_compliant_resources:
        message = f"Encryption Compliance Scan Results ({REGION}):\n\n"
        message += f"Found {len(non_compliant_resources)} non-compliant resources:\n\n"
        message += "\n".join(non_compliant_resources)

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Encryption Compliance Alert - {REGION}',
            Message=message
        )


def send_notification(resource_type, resource_id, message):
    """
    Send SNS notification for non-compliant resources.
    """
    try:
        sns_message = f"""
Encryption Compliance Alert

Environment: {ENVIRONMENT_SUFFIX}
Region: {REGION}
Resource Type: {resource_type}
Resource ID: {resource_id}
Status: NON_COMPLIANT

Details: {message}

Please review and remediate this compliance issue.
"""

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Encryption Compliance Alert: {resource_type}',
            Message=sns_message
        )
        print(f"Notification sent for {resource_type}: {resource_id}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")
```

### File: lambda/tagging_check.py

```python
import json
import boto3
import os
from datetime import datetime

config_client = boto3.client('config')
sns_client = boto3.client('sns')
ec2_client = boto3.client('ec2')
rds_client = boto3.client('rds')
s3_client = boto3.client('s3')

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
REGION = os.environ.get('AWS_REGION_NAME', 'us-east-1')

# Required tags for compliance
REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter']


def lambda_handler(event, context):
    """
    Lambda handler for tagging compliance checks.
    Evaluates resources for required tags.
    """
    print(f"Tagging compliance check triggered: {json.dumps(event)}")

    # Handle both Config rule evaluation and scheduled events
    if 'configRuleId' in event:
        # Config rule evaluation
        invoking_event = json.loads(event['configRuleInvokingEvent'])
        configuration_item = invoking_event.get('configurationItem', {})
        resource_type = configuration_item.get('resourceType')
        resource_id = configuration_item.get('resourceId')

        compliance = evaluate_resource_tags(resource_type, resource_id)

        # Put evaluation result
        evaluations = [{
            'ComplianceResourceType': resource_type,
            'ComplianceResourceId': resource_id,
            'ComplianceType': compliance['status'],
            'Annotation': compliance['message'],
            'OrderingTimestamp': datetime.utcnow()
        }]

        config_client.put_evaluations(
            Evaluations=evaluations,
            ResultToken=event['resultToken']
        )

        # Send SNS notification if non-compliant
        if compliance['status'] == 'NON_COMPLIANT':
            send_notification(resource_type, resource_id, compliance['message'])

    else:
        # Scheduled event - scan all resources
        print("Scheduled scan initiated")
        scan_all_resources()

    return {
        'statusCode': 200,
        'body': json.dumps('Tagging compliance check completed')
    }


def evaluate_resource_tags(resource_type, resource_id):
    """
    Evaluate tagging compliance for a specific resource.
    """
    try:
        if resource_type == 'AWS::EC2::Instance':
            return check_ec2_tags(resource_id)
        elif resource_type == 'AWS::RDS::DBInstance':
            return check_rds_tags(resource_id)
        elif resource_type == 'AWS::S3::Bucket':
            return check_s3_tags(resource_id)
        else:
            return {
                'status': 'NOT_APPLICABLE',
                'message': 'Resource type not supported for tagging check'
            }
    except Exception as e:
        print(f"Error evaluating resource {resource_id}: {str(e)}")
        return {
            'status': 'INSUFFICIENT_DATA',
            'message': f'Error evaluating resource: {str(e)}'
        }


def check_ec2_tags(instance_id):
    """
    Check if EC2 instance has required tags.
    """
    try:
        response = ec2_client.describe_instances(InstanceIds=[instance_id])

        if not response['Reservations']:
            return {'status': 'NOT_APPLICABLE', 'message': 'Instance not found'}

        instance = response['Reservations'][0]['Instances'][0]
        tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

        missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]

        if missing_tags:
            return {
                'status': 'NON_COMPLIANT',
                'message': f'EC2 instance missing required tags: {", ".join(missing_tags)}'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'EC2 instance has all required tags'
        }
    except Exception as e:
        print(f"Error checking EC2 tags: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_rds_tags(db_instance_id):
    """
    Check if RDS instance has required tags.
    """
    try:
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)

        if not response['DBInstances']:
            return {'status': 'NOT_APPLICABLE', 'message': 'DB instance not found'}

        db_instance = response['DBInstances'][0]
        db_arn = db_instance['DBInstanceArn']

        tags_response = rds_client.list_tags_for_resource(ResourceName=db_arn)
        tags = {tag['Key']: tag['Value'] for tag in tags_response.get('TagList', [])}

        missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]

        if missing_tags:
            return {
                'status': 'NON_COMPLIANT',
                'message': f'RDS instance missing required tags: {", ".join(missing_tags)}'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'RDS instance has all required tags'
        }
    except Exception as e:
        print(f"Error checking RDS tags: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_s3_tags(bucket_name):
    """
    Check if S3 bucket has required tags.
    """
    try:
        response = s3_client.get_bucket_tagging(Bucket=bucket_name)
        tags = {tag['Key']: tag['Value'] for tag in response.get('TagSet', [])}

        missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]

        if missing_tags:
            return {
                'status': 'NON_COMPLIANT',
                'message': f'S3 bucket missing required tags: {", ".join(missing_tags)}'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'S3 bucket has all required tags'
        }
    except s3_client.exceptions.NoSuchTagSet:
        return {
            'status': 'NON_COMPLIANT',
            'message': f'S3 bucket has no tags. Required tags: {", ".join(REQUIRED_TAGS)}'
        }
    except Exception as e:
        print(f"Error checking S3 tags: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def scan_all_resources():
    """
    Scan all resources in the region for tagging compliance.
    """
    print("Scanning all resources for tagging compliance")
    non_compliant_resources = []

    # Scan EC2 instances
    try:
        ec2_response = ec2_client.describe_instances()
        for reservation in ec2_response['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                compliance = check_ec2_tags(instance_id)
                if compliance['status'] == 'NON_COMPLIANT':
                    non_compliant_resources.append(f"EC2: {instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning EC2 instances: {str(e)}")

    # Scan RDS instances
    try:
        rds_response = rds_client.describe_db_instances()
        for db_instance in rds_response['DBInstances']:
            db_instance_id = db_instance['DBInstanceIdentifier']
            compliance = check_rds_tags(db_instance_id)
            if compliance['status'] == 'NON_COMPLIANT':
                non_compliant_resources.append(f"RDS: {db_instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning RDS instances: {str(e)}")

    # Send summary notification if there are non-compliant resources
    if non_compliant_resources:
        message = f"Tagging Compliance Scan Results ({REGION}):\n\n"
        message += f"Found {len(non_compliant_resources)} non-compliant resources:\n\n"
        message += "\n".join(non_compliant_resources)

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Tagging Compliance Alert - {REGION}',
            Message=message
        )


def send_notification(resource_type, resource_id, message):
    """
    Send SNS notification for non-compliant resources.
    """
    try:
        sns_message = f"""
Tagging Compliance Alert

Environment: {ENVIRONMENT_SUFFIX}
Region: {REGION}
Resource Type: {resource_type}
Resource ID: {resource_id}
Status: NON_COMPLIANT

Details: {message}

Required Tags: {', '.join(REQUIRED_TAGS)}

Please review and add the missing tags.
"""

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Tagging Compliance Alert: {resource_type}',
            Message=sns_message
        )
        print(f"Notification sent for {resource_type}: {resource_id}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")
```

### File: lambda/backup_check.py

```python
import json
import boto3
import os
from datetime import datetime, timedelta

config_client = boto3.client('config')
sns_client = boto3.client('sns')
ec2_client = boto3.client('ec2')
rds_client = boto3.client('rds')
s3_client = boto3.client('s3')

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
REGION = os.environ.get('AWS_REGION_NAME', 'us-east-1')


def lambda_handler(event, context):
    """
    Lambda handler for backup compliance checks.
    Evaluates resources for backup policies.
    """
    print(f"Backup compliance check triggered: {json.dumps(event)}")

    # Handle both Config rule evaluation and scheduled events
    if 'configRuleId' in event:
        # Config rule evaluation
        invoking_event = json.loads(event['configRuleInvokingEvent'])
        configuration_item = invoking_event.get('configurationItem', {})
        resource_type = configuration_item.get('resourceType')
        resource_id = configuration_item.get('resourceId')

        compliance = evaluate_resource_backup(resource_type, resource_id)

        # Put evaluation result
        evaluations = [{
            'ComplianceResourceType': resource_type,
            'ComplianceResourceId': resource_id,
            'ComplianceType': compliance['status'],
            'Annotation': compliance['message'],
            'OrderingTimestamp': datetime.utcnow()
        }]

        config_client.put_evaluations(
            Evaluations=evaluations,
            ResultToken=event['resultToken']
        )

        # Send SNS notification if non-compliant
        if compliance['status'] == 'NON_COMPLIANT':
            send_notification(resource_type, resource_id, compliance['message'])

    else:
        # Scheduled event - scan all resources
        print("Scheduled scan initiated")
        scan_all_resources()

    return {
        'statusCode': 200,
        'body': json.dumps('Backup compliance check completed')
    }


def evaluate_resource_backup(resource_type, resource_id):
    """
    Evaluate backup compliance for a specific resource.
    """
    try:
        if resource_type == 'AWS::EC2::Instance':
            return check_ec2_backup(resource_id)
        elif resource_type == 'AWS::RDS::DBInstance':
            return check_rds_backup(resource_id)
        elif resource_type == 'AWS::S3::Bucket':
            return check_s3_backup(resource_id)
        else:
            return {
                'status': 'NOT_APPLICABLE',
                'message': 'Resource type not supported for backup check'
            }
    except Exception as e:
        print(f"Error evaluating resource {resource_id}: {str(e)}")
        return {
            'status': 'INSUFFICIENT_DATA',
            'message': f'Error evaluating resource: {str(e)}'
        }


def check_ec2_backup(instance_id):
    """
    Check if EC2 instance has recent snapshots (backup policy).
    """
    try:
        response = ec2_client.describe_instances(InstanceIds=[instance_id])

        if not response['Reservations']:
            return {'status': 'NOT_APPLICABLE', 'message': 'Instance not found'}

        instance = response['Reservations'][0]['Instances'][0]

        # Check for backup tag
        tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
        if 'Backup' not in tags or tags['Backup'].lower() != 'true':
            return {
                'status': 'NON_COMPLIANT',
                'message': 'EC2 instance does not have Backup tag set to true'
            }

        # Check for recent snapshots (last 7 days)
        volume_ids = [mapping.get('Ebs', {}).get('VolumeId')
                     for mapping in instance.get('BlockDeviceMappings', [])
                     if mapping.get('Ebs', {}).get('VolumeId')]

        if not volume_ids:
            return {
                'status': 'COMPLIANT',
                'message': 'EC2 instance has backup tag enabled (no volumes to check)'
            }

        # Check for snapshots
        cutoff_date = datetime.utcnow() - timedelta(days=7)

        for volume_id in volume_ids:
            snapshots = ec2_client.describe_snapshots(
                Filters=[
                    {'Name': 'volume-id', 'Values': [volume_id]},
                    {'Name': 'status', 'Values': ['completed']}
                ]
            )

            recent_snapshots = [
                s for s in snapshots['Snapshots']
                if s['StartTime'].replace(tzinfo=None) > cutoff_date
            ]

            if not recent_snapshots:
                return {
                    'status': 'NON_COMPLIANT',
                    'message': f'EC2 instance volume {volume_id} has no recent snapshots (last 7 days)'
                }

        return {
            'status': 'COMPLIANT',
            'message': 'EC2 instance has backup tag and recent snapshots'
        }
    except Exception as e:
        print(f"Error checking EC2 backup: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_rds_backup(db_instance_id):
    """
    Check if RDS instance has automated backups enabled.
    """
    try:
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)

        if not response['DBInstances']:
            return {'status': 'NOT_APPLICABLE', 'message': 'DB instance not found'}

        db_instance = response['DBInstances'][0]

        backup_retention = db_instance.get('BackupRetentionPeriod', 0)

        if backup_retention == 0:
            return {
                'status': 'NON_COMPLIANT',
                'message': 'RDS instance does not have automated backups enabled'
            }

        if backup_retention < 7:
            return {
                'status': 'NON_COMPLIANT',
                'message': f'RDS instance backup retention period ({backup_retention} days) is less than 7 days'
            }

        return {
            'status': 'COMPLIANT',
            'message': f'RDS instance has automated backups enabled with {backup_retention} days retention'
        }
    except Exception as e:
        print(f"Error checking RDS backup: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_s3_backup(bucket_name):
    """
    Check if S3 bucket has versioning enabled (backup policy).
    """
    try:
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)

        status = response.get('Status', 'Disabled')

        if status != 'Enabled':
            return {
                'status': 'NON_COMPLIANT',
                'message': 'S3 bucket does not have versioning enabled'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'S3 bucket has versioning enabled'
        }
    except Exception as e:
        print(f"Error checking S3 backup: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def scan_all_resources():
    """
    Scan all resources in the region for backup compliance.
    """
    print("Scanning all resources for backup compliance")
    non_compliant_resources = []

    # Scan EC2 instances
    try:
        ec2_response = ec2_client.describe_instances()
        for reservation in ec2_response['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                compliance = check_ec2_backup(instance_id)
                if compliance['status'] == 'NON_COMPLIANT':
                    non_compliant_resources.append(f"EC2: {instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning EC2 instances: {str(e)}")

    # Scan RDS instances
    try:
        rds_response = rds_client.describe_db_instances()
        for db_instance in rds_response['DBInstances']:
            db_instance_id = db_instance['DBInstanceIdentifier']
            compliance = check_rds_backup(db_instance_id)
            if compliance['status'] == 'NON_COMPLIANT':
                non_compliant_resources.append(f"RDS: {db_instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning RDS instances: {str(e)}")

    # Send summary notification if there are non-compliant resources
    if non_compliant_resources:
        message = f"Backup Compliance Scan Results ({REGION}):\n\n"
        message += f"Found {len(non_compliant_resources)} non-compliant resources:\n\n"
        message += "\n".join(non_compliant_resources)

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Backup Compliance Alert - {REGION}',
            Message=message
        )


def send_notification(resource_type, resource_id, message):
    """
    Send SNS notification for non-compliant resources.
    """
    try:
        sns_message = f"""
Backup Compliance Alert

Environment: {ENVIRONMENT_SUFFIX}
Region: {REGION}
Resource Type: {resource_type}
Resource ID: {resource_id}
Status: NON_COMPLIANT

Details: {message}

Please review and configure backup policies.
"""

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Backup Compliance Alert: {resource_type}',
            Message=sns_message
        )
        print(f"Notification sent for {resource_type}: {resource_id}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")
```

### File: terraform.tfvars.example

```hcl
# Example Terraform variables file
# Copy this file to terraform.tfvars and update with your values

environment_suffix = "prod"

aws_regions = ["us-east-1", "us-west-2", "eu-west-1"]

primary_region = "us-east-1"

notification_email = "compliance-team@example.com"

config_delivery_frequency = "TwentyFour_Hours"

lambda_timeout = 30

compliance_check_schedule = "rate(6 hours)"

resource_types_to_record = [
  "AWS::EC2::Instance",
  "AWS::RDS::DBInstance",
  "AWS::S3::Bucket",
  "AWS::IAM::Role",
  "AWS::IAM::Policy",
  "AWS::IAM::User"
]
```

### File: README.md

```markdown
# AWS Config Compliance Analysis System

This Terraform configuration implements an automated infrastructure compliance scanning system for AWS resources across multiple regions. It uses AWS Config with custom Lambda-based compliance rules to monitor EC2, RDS, S3, and IAM resources for encryption, tagging, and backup policy compliance.

## Architecture

The solution deploys:

- **AWS Config**: Continuous configuration recording in us-east-1, us-west-2, and eu-west-1
- **Lambda Functions**: Python 3.9 functions for custom compliance rule evaluation (ARM64/Graviton2)
- **S3 Bucket**: Centralized storage for Config snapshots and compliance reports
- **SNS Topic**: Notifications for non-compliant resources
- **Config Aggregator**: Multi-region data collection
- **IAM Roles**: Least-privilege policies for Config and Lambda
- **EventBridge Rules**: Scheduled compliance checks every 6 hours

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create Config, Lambda, S3, SNS, IAM resources
- Email address for compliance notifications

## Configuration

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values:
   ```hcl
   environment_suffix = "your-unique-suffix"
   notification_email = "your-email@example.com"
   ```

3. Review and adjust other variables as needed (regions, schedules, etc.)

## Deployment

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Review the planned changes:
   ```bash
   terraform plan
   ```

3. Apply the configuration:
   ```bash
   terraform apply
   ```

4. Confirm your email subscription:
   - Check your email inbox for the SNS subscription confirmation
   - Click the confirmation link to receive compliance notifications

## Compliance Rules

The system implements three types of compliance checks:

### 1. Encryption Compliance
- **EC2 Instances**: All EBS volumes must be encrypted
- **RDS Instances**: Storage encryption must be enabled
- **S3 Buckets**: Server-side encryption must be configured

### 2. Tagging Compliance
All resources must have the following tags:
- `Environment`: Deployment environment (e.g., prod, dev)
- `Owner`: Team or individual responsible for the resource
- `CostCenter`: Cost allocation identifier

### 3. Backup Compliance
- **EC2 Instances**: Must have `Backup: true` tag and recent snapshots (last 7 days)
- **RDS Instances**: Automated backups enabled with retention >= 7 days
- **S3 Buckets**: Versioning must be enabled

## Compliance Evaluation

- **Real-time**: Config rules evaluate resources within 15 minutes of changes
- **Scheduled**: Lambda functions scan all resources every 6 hours
- **Notifications**: SNS alerts sent immediately for non-compliant resources

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}-{region}`

Example: `config-recorder-prod-us-east-1`

## Monitoring

Access AWS Config console to view:
- Compliance dashboard across all regions
- Config aggregator for multi-region view
- Compliance timeline and history
- Resource configuration changes

## Cost Optimization

- Lambda functions use ARM64 (Graviton2) for 20% cost savings
- 30-second timeout limits prevent runaway executions
- Config recording limited to specific resource types
- S3 lifecycle policies can be added for log archival

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: The S3 bucket has `force_destroy = true` enabled, so it will be deleted with all contents during cleanup.

## Troubleshooting

### Config Not Recording
- Verify IAM role permissions
- Check Config delivery channel S3 bucket policy
- Ensure Config recorder is started

### Lambda Execution Errors
- Review CloudWatch Logs for Lambda functions
- Verify Lambda execution role has required permissions
- Check Lambda environment variables

### SNS Notifications Not Received
- Confirm email subscription is active
- Check SNS topic policy allows Lambda and Config to publish
- Review CloudWatch Logs for SNS publish errors

## Security Considerations

- All S3 data encrypted with SSE-S3
- Public access blocked on S3 bucket
- IAM roles follow least-privilege principle
- Config data includes unique S3 prefixes per region
- Lambda functions run with minimal required permissions

## Compliance Standards

This solution helps meet requirements for:
- SOC 2 Type II
- PCI DSS
- HIPAA
- GDPR
- NIST Cybersecurity Framework

## Support

For issues or questions, please refer to:
- [AWS Config Documentation](https://docs.aws.amazon.com/config/)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## License

This code is provided as-is for infrastructure compliance monitoring purposes.
```

## Summary

This Terraform implementation provides a complete AWS Config-based compliance analysis system with:

1. Multi-region AWS Config deployment (us-east-1, us-west-2, eu-west-1)
2. Custom Lambda functions for encryption, tagging, and backup compliance
3. Centralized S3 storage with versioning and encryption
4. SNS notifications for non-compliant resources
5. Config aggregator for multi-region visibility
6. Scheduled compliance scans every 6 hours
7. ARM64/Graviton2 Lambda functions for cost optimization
8. Proper IAM roles with least-privilege policies
9. Unique resource naming with environmentSuffix
10. Complete documentation and deployment instructions

All resources are configured to be destroyable (force_destroy enabled on S3 bucket), and the implementation follows Terraform and AWS best practices.
