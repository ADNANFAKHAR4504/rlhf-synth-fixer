# S3 Buckets for Data Lake and Athena Results
resource "aws_s3_bucket" "feedback_data_lake" {
  bucket        = "feedback-data-lake-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name        = "Feedback Data Lake"
    Environment = "production"
    Purpose     = "Customer feedback storage"
  }
}

resource "aws_s3_bucket_versioning" "feedback_data_lake" {
  bucket = aws_s3_bucket.feedback_data_lake.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "athena_results" {
  bucket = "feedback-athena-results-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "Athena Query Results"
    Environment = "production"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    id     = "delete-old-results"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 30
    }
  }
}

# DynamoDB Table for Feedback Storage
resource "aws_dynamodb_table" "feedback" {
  name         = "customer-feedback-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "feedbackId"
  range_key    = "timestamp"

  attribute {
    name = "feedbackId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "Customer Feedback Table"
    Environment = "production"
  }
}

# IAM Role for Lambda Function
resource "aws_iam_role" "lambda_feedback_processor" {
  name = "lambda-feedback-processor-role-${var.environment_suffix}"

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
    Name = "Lambda Feedback Processor Role"
  }
}

# IAM Policy for Lambda Function
resource "aws_iam_role_policy" "lambda_feedback_processor" {
  name = "lambda-feedback-processor-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_feedback_processor.id

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
        Resource = "arn:aws:logs:us-west-1:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "comprehend:DetectSentiment"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.feedback.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.feedback_data_lake.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "feedback_processor" {
  filename         = "lambda_function.zip"
  function_name    = "feedback-processor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_feedback_processor.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 512
  source_code_hash = filebase64sha256("lambda_function.zip")

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.feedback.name
      S3_BUCKET      = aws_s3_bucket.feedback_data_lake.id
    }
  }

  tags = {
    Name        = "Feedback Processor"
    Environment = "production"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "feedback_processor" {
  name              = "/aws/lambda/${aws_lambda_function.feedback_processor.function_name}"
  retention_in_days = 14

  tags = {
    Name = "Feedback Processor Logs"
  }
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "feedback_api" {
  name        = "feedback-submission-api-${var.environment_suffix}"
  description = "API for customer feedback submission"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "Feedback API"
    Environment = "production"
  }
}

# API Gateway Resource
resource "aws_api_gateway_resource" "feedback" {
  rest_api_id = aws_api_gateway_rest_api.feedback_api.id
  parent_id   = aws_api_gateway_rest_api.feedback_api.root_resource_id
  path_part   = "feedback"
}

# API Gateway Method
resource "aws_api_gateway_method" "feedback_post" {
  rest_api_id   = aws_api_gateway_rest_api.feedback_api.id
  resource_id   = aws_api_gateway_resource.feedback.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration
resource "aws_api_gateway_integration" "feedback_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.feedback_api.id
  resource_id             = aws_api_gateway_resource.feedback.id
  http_method             = aws_api_gateway_method.feedback_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.feedback_processor.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "feedback_api" {
  rest_api_id = aws_api_gateway_rest_api.feedback_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.feedback.id,
      aws_api_gateway_method.feedback_post.id,
      aws_api_gateway_integration.feedback_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_method.feedback_post,
    aws_api_gateway_integration.feedback_lambda
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.feedback_api.id
  rest_api_id   = aws_api_gateway_rest_api.feedback_api.id
  stage_name    = "prod"

  tags = {
    Name        = "Production Stage"
    Environment = "production"
  }
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.feedback_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.feedback_api.execution_arn}/*/*"
}

# Glue Database
resource "aws_glue_catalog_database" "feedback_db" {
  name = "feedback_database_${var.environment_suffix}"

  tags = {
    Name        = "Feedback Database"
    Environment = "production"
  }
}

# IAM Role for Glue Crawler
resource "aws_iam_role" "glue_crawler" {
  name = "glue-crawler-feedback-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "glue.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "Glue Crawler Role"
  }
}

# IAM Policy for Glue Crawler
resource "aws_iam_role_policy" "glue_crawler" {
  name = "glue-crawler-policy-${var.environment_suffix}"
  role = aws_iam_role.glue_crawler.id

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
          aws_s3_bucket.feedback_data_lake.arn,
          "${aws_s3_bucket.feedback_data_lake.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "glue:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:/aws-glue/*"
      }
    ]
  })
}

# Glue Crawler
resource "aws_glue_crawler" "feedback_crawler" {
  name          = "feedback-crawler-${var.environment_suffix}"
  role          = aws_iam_role.glue_crawler.arn
  database_name = aws_glue_catalog_database.feedback_db.name

  schedule = "cron(0 0 * * ? *)"

  s3_target {
    path = "s3://${aws_s3_bucket.feedback_data_lake.id}/feedback/"
  }

  schema_change_policy {
    update_behavior = "UPDATE_IN_DATABASE"
    delete_behavior = "LOG"
  }

  tags = {
    Name        = "Feedback Crawler"
    Environment = "production"
  }
}

# Athena Workgroup
resource "aws_athena_workgroup" "feedback_analytics" {
  name = "feedback-analytics-${var.environment_suffix}"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.id}/results/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
  }

  tags = {
    Name        = "Feedback Analytics Workgroup"
    Environment = "production"
  }
}

# CloudWatch Metric Alarm for Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "feedback-processor-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.feedback_processor.function_name
  }

  tags = {
    Name = "Lambda Error Alarm"
  }
}

# CloudWatch Metric Alarm for DynamoDB Throttles
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "feedback-table-throttles-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors DynamoDB throttling"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.feedback.name
  }

  tags = {
    Name = "DynamoDB Throttle Alarm"
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
