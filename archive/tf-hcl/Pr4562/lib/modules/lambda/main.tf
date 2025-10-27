# modules/lambda/main.tf - Lambda Module Main Configuration

# ============================================================================
# IAM ROLE FOR LAMBDA
# ============================================================================

resource "aws_iam_role" "lambda_traffic_analyzer" {
  name_prefix = "lambda-traffic-analyzer-${var.suffix}"

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

  tags = merge(var.common_tags, {
    Name = "lambda-traffic-analyzer-role-${var.suffix}"
  })
}

resource "aws_iam_role_policy" "lambda_traffic_analyzer" {
  name_prefix = "lambda-traffic-analyzer-policy-${var.suffix}"
  role        = aws_iam_role.lambda_traffic_analyzer.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${var.account_id}:log-group:/aws/lambda/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:StartQuery",
          "logs:GetQueryResults",
          "logs:DescribeLogGroups"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${var.account_id}:log-group:/aws/vpc/flowlogs/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "Company/VPCPeering"
          }
        }
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
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:PutParameter"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${var.account_id}:parameter/vpc-peering/*"
      }
    ]
  })
}

# Add X-Ray permissions if enabled
resource "aws_iam_role_policy" "lambda_xray" {
  count       = var.enable_xray ? 1 : 0
  name_prefix = "lambda-xray-policy-${var.suffix}"
  role        = aws_iam_role.lambda_traffic_analyzer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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

# ============================================================================
# LAMBDA FUNCTION
# ============================================================================

data "archive_file" "lambda_traffic_analyzer" {
  type        = "zip"
  source_file = "${path.module}/../../lambda/traffic_analyzer.py"
  output_path = "${path.module}/../../.terraform/lambda/traffic_analyzer.zip"
}

resource "aws_lambda_function" "traffic_analyzer" {
  filename         = data.archive_file.lambda_traffic_analyzer.output_path
  function_name    = var.function_name
  role             = aws_iam_role.lambda_traffic_analyzer.arn
  handler          = "traffic_analyzer.lambda_handler"
  source_code_hash = data.archive_file.lambda_traffic_analyzer.output_base64sha256
  runtime          = var.runtime
  timeout          = var.timeout
  memory_size      = var.memory_size

  reserved_concurrent_executions = var.reserved_concurrent_executions

  environment {
    variables = {
      VPC_A_LOG_GROUP   = var.vpc_a_log_group_name
      VPC_B_LOG_GROUP   = var.vpc_b_log_group_name
      TRAFFIC_BASELINE  = tostring(var.traffic_baseline)
      SNS_TOPIC_ARN     = var.sns_topic_arn
      ALLOWED_PORTS     = join(",", var.allowed_ports)
      ANOMALY_THRESHOLD = tostring(var.anomaly_threshold_percent)
      VPC_A_CIDR        = var.vpc_a_cidr
      VPC_B_CIDR        = var.vpc_b_cidr
    }
  }

  tracing_config {
    mode = var.enable_xray ? "Active" : "PassThrough"
  }

  tags = merge(var.common_tags, {
    Name = var.function_name
  })
}

resource "aws_cloudwatch_log_group" "lambda_traffic_analyzer" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.retention_days

  tags = merge(var.common_tags, {
    Name = "lambda-traffic-analyzer-logs-${var.suffix}"
  })
}

# ============================================================================
# EVENTBRIDGE RULE FOR LAMBDA
# ============================================================================

resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  name_prefix         = "vpc-traffic-analyzer-schedule-${var.suffix}"
  description         = "Trigger Lambda traffic analyzer on schedule"
  schedule_expression = var.lambda_schedule

  tags = merge(var.common_tags, {
    Name = "lambda-schedule-${var.suffix}"
  })
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.lambda_schedule.name
  target_id = "LambdaTarget"
  arn       = aws_lambda_function.traffic_analyzer.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.traffic_analyzer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_schedule.arn
}