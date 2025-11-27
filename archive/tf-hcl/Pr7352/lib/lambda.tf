# lambda.tf - Lambda Functions for Data Transformation

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "lambda-role-${var.environment_suffix}"

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
    Name = "lambda-role-${var.environment_suffix}"
  }
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda" {
  name = "lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda.id

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
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.aurora_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.session_state.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.migration_logs.arn}/*"
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

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_transformation" {
  name              = "/aws/lambda/data-transformation-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "lambda-logs-${var.environment_suffix}"
  }
}

# Archive Lambda function code
data "archive_file" "lambda_transformation" {
  type        = "zip"
  source_file = "${path.module}/lambda/data_transformation.py"
  output_path = "${path.module}/lambda/data_transformation.zip"
}

# Lambda Function for Data Transformation
resource "aws_lambda_function" "data_transformation" {
  filename                       = data.archive_file.lambda_transformation.output_path
  function_name                  = "data-transformation-${var.environment_suffix}"
  role                           = aws_iam_role.lambda.arn
  handler                        = "data_transformation.lambda_handler"
  source_code_hash               = data.archive_file.lambda_transformation.output_base64sha256
  runtime                        = "python3.11"
  timeout                        = 300
  memory_size                    = var.lambda_memory_size
  reserved_concurrent_executions = var.lambda_reserved_concurrency

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
      AURORA_SECRET_ARN  = aws_secretsmanager_secret.aurora_credentials.arn
      LOG_BUCKET         = aws_s3_bucket.migration_logs.id
      DYNAMODB_TABLE     = aws_dynamodb_table.session_state.name
      # AWS_REGION is a reserved environment variable and cannot be set
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name = "data-transformation-${var.environment_suffix}"
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_transformation,
    aws_iam_role_policy.lambda
  ]
}

# Lambda Permission for DMS to invoke (if using Lambda as DMS target)
resource "aws_lambda_permission" "dms_invoke" {
  statement_id  = "AllowDMSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_transformation.function_name
  principal     = "dms.amazonaws.com"
  source_arn    = aws_dms_replication_instance.main.replication_instance_arn
}

# CloudWatch Alarm for Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "lambda-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors Lambda function errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.data_transformation.function_name
  }

  tags = {
    Name = "lambda-errors-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Lambda Duration
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "lambda-duration-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Average"
  threshold           = 250000
  alarm_description   = "This metric monitors Lambda function duration"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.data_transformation.function_name
  }

  tags = {
    Name = "lambda-duration-alarm-${var.environment_suffix}"
  }
}
