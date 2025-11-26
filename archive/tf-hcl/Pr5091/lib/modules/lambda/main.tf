# Data sources for IAM policy scoping
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# Validation Lambda
resource "aws_lambda_function" "validator" {
  filename                       = var.validator_package_path
  function_name                  = "${var.name_prefix}-validator"
  role                           = aws_iam_role.validator.arn
  handler                        = "index.handler"
  runtime                        = "python3.11"
  timeout                        = 2
  memory_size                    = 1024
  reserved_concurrent_executions = 100

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  environment {
    variables = {
      BUSINESS_RULES_COUNT = var.business_rules_count
      SNS_TOPIC_ARN        = var.sns_topic_arn
      ENVIRONMENT          = var.environment
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = var.tags
}

resource "aws_lambda_event_source_mapping" "dynamodb_stream" {
  event_source_arn  = var.dynamodb_stream_arn
  function_name     = aws_lambda_function.validator.arn
  starting_position = "LATEST"

  maximum_batching_window_in_seconds = 0
  parallelization_factor             = 10
  maximum_retry_attempts             = 2
  maximum_record_age_in_seconds      = 60

  destination_config {
    on_failure {
      destination_arn = var.dlq_arn
    }
  }
}

# Cache Updater Lambdas (one per microservice)
resource "aws_lambda_function" "cache_updater" {
  count = var.microservices_count

  filename                       = var.cache_updater_package_path
  function_name                  = "${var.name_prefix}-cache-updater-${format("%03d", count.index)}"
  role                           = aws_iam_role.cache_updater.arn
  handler                        = "index.handler"
  runtime                        = "python3.11"
  timeout                        = 3
  memory_size                    = 512
  reserved_concurrent_executions = 10

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  environment {
    variables = {
      REDIS_ENDPOINT  = var.redis_endpoint
      MICROSERVICE_ID = format("service-%03d", count.index)
      ENVIRONMENT     = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      MicroserviceId = format("service-%03d", count.index)
    }
  )
}

# Consistency Checker Lambda
resource "aws_lambda_function" "consistency_checker" {
  filename                       = var.consistency_checker_package_path
  function_name                  = "${var.name_prefix}-consistency-checker"
  role                           = aws_iam_role.consistency_checker.arn
  handler                        = "index.handler"
  runtime                        = "python3.11"
  timeout                        = 5
  memory_size                    = 2048
  reserved_concurrent_executions = 50

  environment {
    variables = {
      DYNAMODB_TABLE      = var.dynamodb_table_name
      MICROSERVICES_COUNT = var.microservices_count
      ENVIRONMENT         = var.environment
    }
  }

  tags = var.tags
}

# Rollback Lambda
resource "aws_lambda_function" "rollback" {
  filename      = var.rollback_package_path
  function_name = "${var.name_prefix}-rollback"
  role          = aws_iam_role.rollback.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 8
  memory_size   = 1024

  environment {
    variables = {
      DYNAMODB_TABLE    = var.dynamodb_table_name
      OPENSEARCH_DOMAIN = var.opensearch_endpoint
      ENVIRONMENT       = var.environment
    }
  }

  tags = var.tags
}

# IAM Roles with least privilege
resource "aws_iam_role" "validator" {
  name_prefix = "${var.name_prefix}-validator-"

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

  tags = var.tags
}

resource "aws_iam_role_policy" "validator" {
  role = aws_iam_role.validator.id

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
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.name_prefix}-validator",
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.name_prefix}-validator:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_topic_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "cache_updater" {
  name_prefix = "${var.name_prefix}-cache-updater-"

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

  tags = var.tags
}

resource "aws_iam_role_policy" "cache_updater" {
  role = aws_iam_role.cache_updater.id

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
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.name_prefix}-cache-updater-*",
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.name_prefix}-cache-updater-*:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "consistency_checker" {
  name_prefix = "${var.name_prefix}-consistency-checker-"

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

  tags = var.tags
}

resource "aws_iam_role_policy" "consistency_checker" {
  role = aws_iam_role.consistency_checker.id

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
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.name_prefix}-consistency-checker",
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.name_prefix}-consistency-checker:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = "arn:aws:dynamodb:*:*:table/${var.dynamodb_table_name}"
      }
    ]
  })
}

resource "aws_iam_role" "rollback" {
  name_prefix = "${var.name_prefix}-rollback-"

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

  tags = var.tags
}

resource "aws_iam_role_policy" "rollback" {
  role = aws_iam_role.rollback.id

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
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.name_prefix}-rollback",
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.name_prefix}-rollback:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = "arn:aws:dynamodb:*:*:table/${var.dynamodb_table_name}"
      },
      {
        Effect = "Allow"
        Action = [
          "es:ESHttpPost",
          "es:ESHttpPut"
        ]
        Resource = "${var.opensearch_endpoint}/*"
      }
    ]
  })
}

# CloudWatch Log Groups with retention policies
resource "aws_cloudwatch_log_group" "validator" {
  name              = "/aws/lambda/${var.name_prefix}-validator"
  retention_in_days = var.is_production ? 30 : 7
  kms_key_id        = var.kms_key_arn
  
  tags = var.tags
}

resource "aws_cloudwatch_log_group" "cache_updater" {
  count = var.microservices_count
  
  name              = "/aws/lambda/${var.name_prefix}-cache-updater-${format("%03d", count.index)}"
  retention_in_days = var.is_production ? 30 : 7
  kms_key_id        = var.kms_key_arn
  
  tags = merge(
    var.tags,
    {
      MicroserviceId = format("service-%03d", count.index)
    }
  )
}

resource "aws_cloudwatch_log_group" "consistency_checker" {
  name              = "/aws/lambda/${var.name_prefix}-consistency-checker"
  retention_in_days = var.is_production ? 30 : 7
  kms_key_id        = var.kms_key_arn
  
  tags = var.tags
}

resource "aws_cloudwatch_log_group" "rollback" {
  name              = "/aws/lambda/${var.name_prefix}-rollback"
  retention_in_days = var.is_production ? 30 : 7
  kms_key_id        = var.kms_key_arn
  
  tags = var.tags
}

# Critical CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "validator_errors" {
  alarm_name          = "${var.name_prefix}-validator-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.validator.function_name
  }
  
  alarm_description = "Alert when validator Lambda has more than 10 errors in 2 minutes"
  alarm_actions     = [var.sns_alert_topic_arn]
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "validator_throttles" {
  alarm_name          = "${var.name_prefix}-validator-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.validator.function_name
  }
  
  alarm_description = "Alert when validator Lambda is throttled"
  alarm_actions     = [var.sns_alert_topic_arn]
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "consistency_checker_errors" {
  alarm_name          = "${var.name_prefix}-consistency-checker-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.consistency_checker.function_name
  }
  
  alarm_description = "Alert when consistency checker has errors"
  alarm_actions     = [var.sns_alert_topic_arn]
  
  tags = var.tags
}
