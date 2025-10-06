# main.tf
# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Lambda function archive
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda_function.zip"
}

# DynamoDB Table for transactions
resource "aws_dynamodb_table" "transactions" {
  name         = "fintech-api-transactions-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"
  range_key    = "timestamp"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  global_secondary_index {
    name            = "customer_id_index"
    hash_key        = "customer_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name = "fintech-api-transactions"
  })
}

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_execution" {
  name = "fintech-api-lambda-execution-${var.environment_suffix}"

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

  tags = var.common_tags
}

# IAM policy for Lambda to access DynamoDB
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "fintech-api-lambda-dynamodb"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          aws_dynamodb_table.transactions.arn,
          "${aws_dynamodb_table.transactions.arn}/index/*"
        ]
      }
    ]
  })
}

# IAM policy for Lambda to access SSM Parameter Store
resource "aws_iam_role_policy" "lambda_ssm" {
  name = "fintech-api-lambda-ssm"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:parameter/fintech-api-${var.environment_suffix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach AWS managed policy for CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach AWS managed policy for X-Ray
resource "aws_iam_role_policy_attachment" "lambda_xray" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/fintech-api-processor-${var.environment_suffix}"
  retention_in_days = 7

  tags = var.common_tags
}

# Lambda function for transaction processing
resource "aws_lambda_function" "transaction_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "fintech-api-processor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 512
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  # Enable X-Ray tracing
  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      DYNAMODB_TABLE       = aws_dynamodb_table.transactions.name
      REGION               = var.aws_region
      ENVIRONMENT          = "Production"
      ENVIRONMENT_SUFFIX   = var.environment_suffix
      SSM_PARAMETER_PREFIX = "/fintech-api-${var.environment_suffix}"
      XRAY_TRACE_ID        = "" # X-Ray tracing context
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs,
    aws_iam_role_policy_attachment.lambda_xray,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = merge(var.common_tags, {
    Name = "fintech-api-processor"
  })
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "fintech_api" {
  name          = "fintech-api-${var.environment_suffix}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins     = var.allowed_origins
    allow_methods     = ["GET", "POST", "OPTIONS"]
    allow_headers     = ["content-type", "x-api-key"]
    expose_headers    = ["x-request-id"]
    max_age           = 300
    allow_credentials = false
  }

  tags = merge(var.common_tags, {
    Name = "fintech-api"
  })
}

# Lambda integration for API Gateway
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.fintech_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.transaction_processor.invoke_arn
  payload_format_version = "2.0"
}

# API Gateway routes
resource "aws_apigatewayv2_route" "post_transaction" {
  api_id    = aws_apigatewayv2_api.fintech_api.id
  route_key = "POST /transactions"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "get_transaction" {
  api_id    = aws_apigatewayv2_api.fintech_api.id
  route_key = "GET /transactions/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# API Gateway stage
resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.fintech_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(var.common_tags, {
    Name = "fintech-api-stage"
  })
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/fintech-api-${var.environment_suffix}"
  retention_in_days = 7

  tags = var.common_tags
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.fintech_api.execution_arn}/*/*"
}

# SSM Parameters for sensitive data
resource "aws_ssm_parameter" "api_key" {
  name        = "/fintech-api-${var.environment_suffix}/api-key"
  description = "API Key for fintech API"
  type        = "SecureString"
  value       = var.api_key

  tags = var.common_tags
}

resource "aws_ssm_parameter" "db_connection" {
  name        = "/fintech-api-${var.environment_suffix}/db-connection"
  description = "Database connection string"
  type        = "SecureString"
  value       = var.db_connection_string

  tags = var.common_tags
}

resource "aws_ssm_parameter" "third_party_endpoint" {
  name        = "/fintech-api-${var.environment_suffix}/third-party-endpoint"
  description = "Third party service endpoint"
  type        = "String"
  value       = var.third_party_endpoint

  tags = var.common_tags
}

# CloudWatch Alarm for error rate
resource "aws_cloudwatch_metric_alarm" "error_rate_alarm" {
  alarm_name          = "fintech-api-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors lambda error rate"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.transaction_processor.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = var.common_tags
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "fintech-api-alerts-${var.environment_suffix}"

  tags = merge(var.common_tags, {
    Name = "fintech-api-alerts"
  })
}

resource "aws_sns_topic_subscription" "alert_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "fintech_dashboard" {
  dashboard_name = "fintech-api-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Errors" }],
            [".", "Duration", { stat = "Average", label = "Duration" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "Lambda Metrics"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum" }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "DynamoDB Capacity"
          period = 300
        }
      }
    ]
  })
}

# IAM role for EventBridge Scheduler
resource "aws_iam_role" "scheduler_role" {
  name = "fintech-api-scheduler-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# IAM policy for EventBridge Scheduler to invoke Lambda
resource "aws_iam_role_policy" "scheduler_lambda_invoke" {
  name = "fintech-api-scheduler-lambda-invoke"
  role = aws_iam_role.scheduler_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.transaction_processor.arn
      }
    ]
  })
}

# EventBridge Scheduler for daily reports
resource "aws_scheduler_schedule" "daily_report" {
  name       = "fintech-api-daily-report-${var.environment_suffix}"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "cron(0 2 * * ? *)"

  target {
    arn      = aws_lambda_function.transaction_processor.arn
    role_arn = aws_iam_role.scheduler_role.arn

    input = jsonencode({
      action = "generate_daily_report"
    })
  }
}

# EventBridge Scheduler for data cleanup
resource "aws_scheduler_schedule" "cleanup_old_records" {
  name       = "fintech-api-cleanup-${var.environment_suffix}"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "cron(0 3 * * ? *)"

  target {
    arn      = aws_lambda_function.transaction_processor.arn
    role_arn = aws_iam_role.scheduler_role.arn

    input = jsonencode({
      action       = "cleanup_old_records"
      days_to_keep = 90
    })
  }
}

# ===== AWS X-Ray Configuration =====

# X-Ray Sampling Rule with Adaptive Sampling
resource "aws_xray_sampling_rule" "fintech_api_sampling" {
  rule_name      = "api-sampling-${substr(var.environment_suffix, 0, 19)}"
  priority       = 1000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1 # Sample 10% of requests normally
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "fintech-api-*"
  resource_arn   = "*"

  tags = var.common_tags
}

# X-Ray Encryption Configuration
resource "aws_xray_encryption_config" "fintech_api" {
  type   = "KMS"
  key_id = "arn:aws:kms:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:alias/aws/xray"
}

# X-Ray Group for filtering traces
resource "aws_xray_group" "fintech_api_group" {
  group_name        = "fintech-api-${var.environment_suffix}"
  filter_expression = "service(\"fintech-api-processor-${var.environment_suffix}\")"

  tags = var.common_tags
}

# ===== AWS WAF Configuration =====

# CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf_logs" {
  name              = "/aws/wafv2/fintech-api-${var.environment_suffix}"
  retention_in_days = 7

  tags = var.common_tags
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "fintech_api_waf" {
  name  = "fintech-api-waf-${var.environment_suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"

        scope_down_statement {
          not_statement {
            statement {
              byte_match_statement {
                field_to_match {
                  uri_path {}
                }
                positional_constraint = "STARTS_WITH"
                search_string         = "/health"
                text_transformation {
                  priority = 0
                  type     = "LOWERCASE"
                }
              }
            }
          }
        }
      }
    }

    action {
      block {
        custom_response {
          response_code            = 429
          custom_response_body_key = "rate_limit_error"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - OWASP Top 10
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - SQL Injection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # AWS Bot Control Rule with Targeted Protection Level
  rule {
    name     = "AWSManagedRulesBotControl"
    priority = 5

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesBotControlRuleSet"
        vendor_name = "AWS"

        managed_rule_group_configs {
          aws_managed_rules_bot_control_rule_set {
            inspection_level = "TARGETED"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "BotControl"
      sampled_requests_enabled   = true
    }
  }

  # Geo-blocking rule for high-risk countries
  rule {
    name     = "GeoBlockingRule"
    priority = 6

    statement {
      geo_match_statement {
        country_codes = ["CN", "RU", "KP", "IR"] # Example high-risk countries
      }
    }

    action {
      block {
        custom_response {
          response_code            = 403
          custom_response_body_key = "geo_block_error"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlocking"
      sampled_requests_enabled   = true
    }
  }

  # Custom response bodies
  custom_response_body {
    key          = "rate_limit_error"
    content      = "{\"error\": \"Too many requests. Please try again later.\"}"
    content_type = "APPLICATION_JSON"
  }

  custom_response_body {
    key          = "geo_block_error"
    content      = "{\"error\": \"Access denied from your location.\"}"
    content_type = "APPLICATION_JSON"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "fintech-api-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(var.common_tags, {
    Name = "fintech-api-waf"
  })
}

# WAF Logging Configuration (commented out due to regional restrictions)
# resource "aws_wafv2_web_acl_logging_configuration" "fintech_api_waf_logging" {
#   resource_arn            = aws_wafv2_web_acl.fintech_api_waf.arn
#   log_destination_configs = [aws_cloudwatch_log_group.waf_logs.arn]

#   redacted_fields {
#     single_header {
#       name = "authorization"
#     }
#   }

#   redacted_fields {
#     single_header {
#       name = "x-api-key"
#     }
#   }

#   redacted_fields {
#     single_query_argument {
#       name = "password"
#     }
#   }
# }

# WAF Association with HTTP API (API Gateway v2) is not supported
# Only REST APIs support WAF integration according to AWS documentation
# resource "aws_wafv2_web_acl_association" "api_gateway_waf" {
#   resource_arn = "arn:aws:apigateway:${data.aws_region.current.id}::/apis/${aws_apigatewayv2_api.fintech_api.id}/stages/${aws_apigatewayv2_stage.api_stage.name}"
#   web_acl_arn  = aws_wafv2_web_acl.fintech_api_waf.arn
# }