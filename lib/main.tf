# Data source to get AWS account ID for unique bucket naming
data "aws_caller_identity" "current" {}

# Generate a unique ID for bucket naming that includes timestamp
# Using random_id for stability, combined with timestamp for uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
  # No keepers - this creates a stable ID after first creation
}

locals {
  # Create a timestamp-based string for bucket naming
  # Format: YYYYMMDDHHmmss (14 chars) + random hex (8 chars) = 22 chars total
  # The timestamp provides uniqueness, random_id provides additional entropy
  timestamp_str    = formatdate("YYYYMMDDHHmmss", timestamp())
  bucket_timestamp = "${substr(local.timestamp_str, 0, 14)}${substr(random_id.bucket_suffix.hex, 0, 8)}"
}

# IAM Role for Lambda execution
resource "aws_iam_role" "compliance_lambda" {
  name = "compliance-scanner-lambda-${var.environment_suffix}"

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
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

resource "aws_iam_role_policy" "compliance_lambda_policy" {
  name = "compliance-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.compliance_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.state_files.arn,
          "${aws_s3_bucket.state_files.arn}/*",
          aws_s3_bucket.reports.arn,
          "${aws_s3_bucket.reports.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.compliance_results.arn
      },
      {
        Effect = "Allow"
        Action = [
          "config:DescribeConfigRules",
          "config:DescribeComplianceByConfigRule",
          "config:GetComplianceDetailsByConfigRule"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.compliance_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# S3 Bucket for Terraform State Files
resource "aws_s3_bucket" "state_files" {
  bucket = "compliance-state-${local.bucket_timestamp}-${data.aws_caller_identity.current.account_id}-${var.environment_suffix}"

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }

  lifecycle {
    # Ignore bucket name changes after creation to prevent recreation
    ignore_changes = [bucket]
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state_files" {
  bucket = aws_s3_bucket.state_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket for PDF Reports
resource "aws_s3_bucket" "reports" {
  bucket = "compliance-reports-${local.bucket_timestamp}-${data.aws_caller_identity.current.account_id}-${var.environment_suffix}"

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceReports"
    CostCenter  = var.cost_center
  }

  lifecycle {
    # Ignore bucket name changes after creation to prevent recreation
    ignore_changes = [bucket]
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    id     = "delete-old-reports"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 90
    }
  }
}

# DynamoDB Table for Compliance Results
resource "aws_dynamodb_table" "compliance_results" {
  name         = "compliance-results-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "resource_id"
  range_key    = "timestamp"

  attribute {
    name = "resource_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "rule_name"
    type = "S"
  }

  global_secondary_index {
    name            = "rule-index"
    hash_key        = "rule_name"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "compliance-config-${var.environment_suffix}"

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
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# S3 Bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "compliance-config-${local.bucket_timestamp}-${data.aws_caller_identity.current.account_id}-${var.environment_suffix}"

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }

  lifecycle {
    # Ignore bucket name changes after creation to prevent recreation
    ignore_changes = [bucket]
  }
}

# S3 Bucket Policy for Config
resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id

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
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Config Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "compliance-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "compliance-delivery-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config.bucket

  depends_on = [aws_config_configuration_recorder.main, aws_s3_bucket_policy.config]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Rules
resource "aws_config_config_rule" "ec2_instance_type" {
  name = "ec2-instance-type-check-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "DESIRED_INSTANCE_TYPE"
  }

  input_parameters = jsonencode({
    instanceType = "t3.micro"
  })

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

resource "aws_config_config_rule" "rds_backup_retention" {
  name = "rds-backup-retention-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

# Lambda Function for State File Processing
resource "aws_lambda_function" "compliance_scanner" {
  filename         = "lambda_function.zip"
  function_name    = "compliance-scanner-${var.environment_suffix}"
  role             = aws_iam_role.compliance_lambda.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("lambda_function.zip")
  runtime          = "python3.11"
  timeout          = 900
  memory_size      = 3008

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.compliance_results.name
      REPORTS_BUCKET = aws_s3_bucket.reports.id
      SNS_TOPIC_ARN  = aws_sns_topic.compliance_alerts.arn
    }
  }

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

# SNS Topic for Compliance Alerts
resource "aws_sns_topic" "compliance_alerts" {
  name         = "compliance-alerts-${var.environment_suffix}"
  display_name = "Compliance Alerts"

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceAlerts"
    CostCenter  = var.cost_center
  }
}

# EventBridge Rule for Scheduled Scans
resource "aws_cloudwatch_event_rule" "compliance_scan" {
  name                = "compliance-scan-schedule-${var.environment_suffix}"
  description         = "Trigger compliance scans every 6 hours"
  schedule_expression = "rate(6 hours)"

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

resource "aws_cloudwatch_event_target" "compliance_scan" {
  rule      = aws_cloudwatch_event_rule.compliance_scan.name
  target_id = "ComplianceScannerLambda"
  arn       = aws_lambda_function.compliance_scanner.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_scanner.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_scan.arn
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "compliance" {
  dashboard_name = "compliance-monitoring-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Scanner Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Scanner Errors" }],
            [".", "Duration", { stat = "Average", label = "Avg Duration" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Performance"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum" }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Activity"
        }
      }
    ]
  })
}
