# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name_prefix = "lambda-${var.dr_role}-${var.environment_suffix}"

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
    Name    = "role-lambda-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda" {
  name_prefix = "lambda-policy-${var.dr_role}"
  role        = aws_iam_role.lambda.id

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
          "arn:aws:logs:${var.region}:*:log-group:/aws/lambda/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*" # Network interfaces require * due to dynamic creation
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances"
        ]
        Resource = [
          "arn:aws:rds:${var.region}:*:cluster:aurora-${var.dr_role}-${var.environment_suffix}*",
          "arn:aws:rds:${var.region}:*:db:aurora-${var.dr_role}-*-${var.environment_suffix}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds:FailoverGlobalCluster"
        ]
        Resource = [
          "arn:aws:rds:*:*:global-cluster:aurora-global-${var.environment_suffix}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*" # CloudWatch metrics don't support resource-level permissions
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData"
        ]
        Resource = [
          "arn:aws:cloudwatch:${var.region}:*:metric/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          "arn:aws:sns:${var.region}:*:dr-alerts-${var.environment_suffix}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "route53:GetHealthCheckStatus",
          "route53:UpdateHealthCheck"
        ]
        Resource = [
          "arn:aws:route53:::healthcheck/*"
        ]
      }
    ]
  })
}

# CloudWatch Log Group for Health Monitor
resource "aws_cloudwatch_log_group" "health_monitor" {
  name              = "/aws/lambda/health-monitor-${var.dr_role}-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name    = "log-health-monitor-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# Lambda Function - Health Monitor
resource "aws_lambda_function" "health_monitor" {
  filename         = "${path.module}/health_monitor.zip"
  function_name    = "health-monitor-${var.dr_role}-${var.environment_suffix}"
  role             = aws_iam_role.lambda.arn
  handler          = "health_monitor.lambda_handler"
  source_code_hash = filebase64sha256("${path.module}/health_monitor.zip")
  runtime          = var.lambda_runtime
  timeout          = 60
  memory_size      = 256

  reserved_concurrent_executions = 5

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [var.security_group_id]
  }

  environment {
    variables = {
      REGION         = var.region
      RDS_CLUSTER_ID = var.rds_cluster_id
      RDS_ENDPOINT   = var.rds_endpoint
      IS_PRIMARY     = var.is_primary ? "true" : "false"
      ENVIRONMENT    = var.environment
      SNS_TOPIC_ARN  = var.sns_topic_arn
    }
  }

  tags = {
    Name    = "lambda-health-monitor-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }

  depends_on = [aws_cloudwatch_log_group.health_monitor]
}

# CloudWatch Log Group for Failover Trigger
resource "aws_cloudwatch_log_group" "failover_trigger" {
  name              = "/aws/lambda/failover-trigger-${var.dr_role}-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name    = "log-failover-trigger-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# Lambda Function - Failover Trigger
resource "aws_lambda_function" "failover_trigger" {
  filename         = "${path.module}/failover_trigger.zip"
  function_name    = "failover-trigger-${var.dr_role}-${var.environment_suffix}"
  role             = aws_iam_role.lambda.arn
  handler          = "failover_trigger.lambda_handler"
  source_code_hash = filebase64sha256("${path.module}/failover_trigger.zip")
  runtime          = var.lambda_runtime
  timeout          = 300
  memory_size      = 512

  reserved_concurrent_executions = 2

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [var.security_group_id]
  }

  environment {
    variables = {
      REGION         = var.region
      RDS_CLUSTER_ID = var.rds_cluster_id
      IS_PRIMARY     = var.is_primary ? "true" : "false"
      ENVIRONMENT    = var.environment
      SNS_TOPIC_ARN  = var.sns_topic_arn
    }
  }

  tags = {
    Name    = "lambda-failover-trigger-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }

  depends_on = [aws_cloudwatch_log_group.failover_trigger]
}

# EventBridge Rule for Health Monitor (runs every 1 minute)
resource "aws_cloudwatch_event_rule" "health_monitor" {
  name                = "health-monitor-${var.dr_role}-${var.environment_suffix}"
  description         = "Trigger health monitor Lambda every minute"
  schedule_expression = "rate(1 minute)"

  tags = {
    Name    = "rule-health-monitor-${var.dr_role}-${var.environment_suffix}"
    DR-Role = var.dr_role
  }
}

# EventBridge Target
resource "aws_cloudwatch_event_target" "health_monitor" {
  rule      = aws_cloudwatch_event_rule.health_monitor.name
  target_id = "health-monitor-lambda"
  arn       = aws_lambda_function.health_monitor.arn
}

# Lambda Permission for EventBridge
resource "aws_lambda_permission" "health_monitor" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_monitor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.health_monitor.arn
}
