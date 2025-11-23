locals {
  environmentSuffix = var.environment == "prod" ? "" : "-${var.environment}"

  bucket_name    = "media-processor-images${local.environmentSuffix}"
  function_name  = "image-processor${local.environmentSuffix}"
  table_name     = "image-metadata${local.environmentSuffix}"
  dashboard_name = "image-processing-metrics${local.environmentSuffix}"
}

# ==================== S3 CONFIGURATION ====================

# Main S3 bucket for image storage
resource "aws_s3_bucket" "image_bucket" {
  bucket = local.bucket_name

  tags = {
    Name        = "Image Processing Bucket"
    Description = "Stores original and processed images"
  }
}

# Enable versioning
resource "aws_s3_bucket_versioning" "image_bucket_versioning" {
  bucket = aws_s3_bucket.image_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption with AES256
resource "aws_s3_bucket_server_side_encryption_configuration" "image_bucket_encryption" {
  bucket = aws_s3_bucket.image_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "image_bucket_pab" {
  bucket = aws_s3_bucket.image_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policies
resource "aws_s3_bucket_lifecycle_configuration" "image_bucket_lifecycle" {
  bucket = aws_s3_bucket.image_bucket.id

  rule {
    id     = "transition-processed-images"
    status = "Enabled"

    filter {
      prefix = "processed/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }

  rule {
    id     = "delete-old-thumbnails"
    status = "Enabled"

    filter {
      and {
        prefix = "processed/"
        tags = {
          Type = "thumbnail"
        }
      }
    }

    expiration {
      days = 90
    }
  }
}

# S3 event notification for Lambda trigger
resource "aws_s3_bucket_notification" "image_upload_trigger" {
  bucket = aws_s3_bucket.image_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.image_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ""
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}

# ==================== DYNAMODB CONFIGURATION ====================

# DynamoDB table for image metadata
resource "aws_dynamodb_table" "image_metadata" {
  name         = local.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "image_id"

  attribute {
    name = "image_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "upload_timestamp"
    type = "N"
  }

  # Global secondary index for user queries
  global_secondary_index {
    name            = "user-images-index"
    hash_key        = "user_id"
    range_key       = "upload_timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "Image Metadata Table"
    Description = "Stores metadata for processed images"
  }
}

# ==================== LAMBDA CONFIGURATION ====================

# Package Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/image_processor.py"
  output_path = "${path.module}/lambda/image_processor.zip"
}

# Lambda function for image processing
resource "aws_lambda_function" "image_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = local.function_name
  role             = aws_iam_role.lambda_execution.arn
  handler          = "image_processor.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.9"
  memory_size      = 1024
  timeout          = 60

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.image_bucket.id
      TABLE_NAME  = aws_dynamodb_table.image_metadata.name
    }
  }

  layers = [
    "arn:aws:lambda:${var.aws_region}:770693421928:layer:Klayers-p39-pillow:1"
  ]

  tags = {
    Name        = "Image Processor Lambda"
    Description = "Processes uploaded images and generates thumbnails"
  }
}

# Lambda permission for S3 to invoke
resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.image_bucket.arn
}

# ==================== IAM CONFIGURATION ====================

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${local.function_name}-execution-role"

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
    Name        = "Lambda Execution Role"
    Description = "Role for image processor Lambda function"
  }
}

# Lambda execution policy - least privilege
resource "aws_iam_policy" "lambda_execution" {
  name        = "${local.function_name}-policy"
  description = "Policy for image processor Lambda with least privilege"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ReadUploadPrefix"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.image_bucket.arn}/uploads/*"
      },
      {
        Sid    = "S3WriteProcessedPrefix"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectTagging"
        ]
        Resource = "${aws_s3_bucket.image_bucket.arn}/processed/*"
      },
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.image_metadata.arn,
          "${aws_dynamodb_table.image_metadata.arn}/index/*"
        ]
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.function_name}*"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "lambda_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_execution.arn
}

# ==================== CLOUDWATCH CONFIGURATION ====================

# Log group for Lambda function
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 7

  tags = {
    Name        = "Lambda Log Group"
    Description = "Logs for image processor Lambda"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "image_processing" {
  dashboard_name = local.dashboard_name

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Daily Processing Count" }],
            [".", "Duration", { stat = "Average", label = "Avg Processing Time (ms)" }],
            [".", "Errors", { stat = "Sum", label = "Error Count" }],
            [".", "Throttles", { stat = "Sum", label = "Throttle Count" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Image Processing Metrics"
          view   = "timeSeries"
          dimensions = {
            FunctionName = local.function_name
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", { stat = "Average", label = "Error Rate %" }],
            [".", "Invocations", { stat = "Sum", visible = false }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Error Rate"
          view   = "singleValue"
          dimensions = {
            FunctionName = local.function_name
          }
        }
      },
      {
        type = "log"
        properties = {
          query  = "SOURCE '/aws/lambda/${local.function_name}' | fields @timestamp, @message | sort @timestamp desc | limit 100"
          region = var.aws_region
          title  = "Recent Processing Logs"
        }
      }
    ]
  })
}

# SNS Topic for alarms
resource "aws_sns_topic" "alarms" {
  name = "${local.function_name}-alarms"

  tags = {
    Name        = "Image Processing Alarms"
    Description = "SNS topic for CloudWatch alarms"
  }
}

resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${local.function_name}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "0.05"
  alarm_description   = "Triggers when error rate exceeds 5%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.image_processor.function_name
  }

  tags = {
    Name = "High Error Rate Alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_processing_time" {
  alarm_name          = "${local.function_name}-high-processing-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "30000"
  alarm_description   = "Triggers when processing time exceeds 30 seconds"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.image_processor.function_name
  }

  tags = {
    Name = "High Processing Time Alarm"
  }
}

# ==================== DATA SOURCES ====================

data "aws_caller_identity" "current" {}

# ==================== OUTPUTS ====================

output "s3_bucket_name" {
  value       = aws_s3_bucket.image_bucket.id
  description = "Name of the S3 bucket for image storage"
}

output "lambda_function_arn" {
  value       = aws_lambda_function.image_processor.arn
  description = "ARN of the image processor Lambda function"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.image_metadata.name
  description = "Name of the DynamoDB table for image metadata"
}

output "cloudwatch_dashboard_url" {
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.image_processing.dashboard_name}"
  description = "URL to access the CloudWatch dashboard"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.alarms.arn
  description = "ARN of the SNS topic for alarms"
}

output "upload_prefix" {
  value       = "s3://${aws_s3_bucket.image_bucket.id}/uploads/"
  description = "S3 path for uploading images"
}

output "processed_prefix" {
  value       = "s3://${aws_s3_bucket.image_bucket.id}/processed/"
  description = "S3 path for processed images"
}