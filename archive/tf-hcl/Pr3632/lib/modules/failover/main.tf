terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.primary, aws.secondary]
    }
  }
}

# Use primary provider for Global Accelerator (must be in same region as primary ALB)

# AWS Global Accelerator
resource "aws_globalaccelerator_accelerator" "main" {
  provider        = aws.primary
  name            = "${var.environment}-global-accelerator"
  ip_address_type = "IPV4"
  enabled         = true

  attributes {
    flow_logs_enabled   = true
    flow_logs_s3_bucket = aws_s3_bucket.global_accelerator_logs.bucket
    flow_logs_s3_prefix = "flow-logs/"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-global-accelerator"
  })
}

# Global Accelerator Listener
resource "aws_globalaccelerator_listener" "main" {
  provider        = aws.primary
  accelerator_arn = aws_globalaccelerator_accelerator.main.id
  protocol        = "TCP"

  port_range {
    from_port = 80
    to_port   = 80
  }
}

# Primary Endpoint Group (Primary Region)
resource "aws_globalaccelerator_endpoint_group" "primary" {
  provider     = aws.primary
  listener_arn = aws_globalaccelerator_listener.main.id

  endpoint_configuration {
    endpoint_id                    = var.primary_alb_arn
    weight                         = 100
    client_ip_preservation_enabled = true
  }


  health_check_interval_seconds = var.health_check_interval
  health_check_path             = "/health"
  health_check_port             = 80
  health_check_protocol         = "HTTP"
  threshold_count               = var.failover_threshold
  traffic_dial_percentage       = 100
}

# Secondary Endpoint Group (Secondary Region)
resource "aws_globalaccelerator_endpoint_group" "secondary" {
  provider     = aws.secondary
  listener_arn = aws_globalaccelerator_listener.main.id

  endpoint_configuration {
    endpoint_id                    = var.secondary_alb_arn
    weight                         = 0
    client_ip_preservation_enabled = true
  }

  health_check_interval_seconds = var.health_check_interval
  health_check_path             = "/health"
  health_check_port             = 80
  health_check_protocol         = "HTTP"
  threshold_count               = var.failover_threshold
  traffic_dial_percentage       = 100
}

# S3 Bucket for Global Accelerator Flow Logs
resource "aws_s3_bucket" "global_accelerator_logs" {
  provider = aws.primary
  bucket   = "${var.environment}-global-accelerator-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, {
    Name = "${var.environment}-global-accelerator-logs"
  })
}

resource "aws_s3_bucket_public_access_block" "global_accelerator_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.global_accelerator_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "global_accelerator_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.global_accelerator_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_caller_identity" "current" {
  provider = aws.primary
}

# Lambda Function for Automated Failover
resource "aws_lambda_function" "failover" {
  provider         = aws.primary
  filename         = "${path.module}/lambda_failover.zip"
  function_name    = "disaster-recovery-failover"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60

  environment {
    variables = {
      PRIMARY_REGION    = var.primary_region
      SECONDARY_REGION  = var.secondary_region
      PRIMARY_DB_ARN    = var.primary_db_arn
      SECONDARY_DB_ARN  = var.secondary_db_arn
      ACCELERATOR_ARN   = aws_globalaccelerator_accelerator.main.arn
      PRIMARY_ALB_ARN   = var.primary_alb_arn
      SECONDARY_ALB_ARN = var.secondary_alb_arn
    }
  }

  tags = merge(var.tags, {
    Name = "disaster-recovery-failover"
  })
}

# Lambda IAM Role
resource "aws_iam_role" "lambda" {
  provider = aws.primary
  name     = "disaster-recovery-lambda-role"

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

resource "aws_iam_role_policy" "lambda" {
  provider = aws.primary
  name     = "disaster-recovery-lambda-policy"
  role     = aws_iam_role.lambda.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:PromoteReadReplica",
          "rds:ModifyDBInstance",
          "rds:DescribeDBInstances",
          "globalaccelerator:UpdateEndpointGroup",
          "globalaccelerator:DescribeAccelerator",
          "autoscaling:UpdateAutoScalingGroup"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Alarms for Failover
resource "aws_cloudwatch_metric_alarm" "primary_health" {
  provider            = aws.primary
  alarm_name          = "primary-region-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Alarm when primary region is unhealthy"
  alarm_actions       = [aws_sns_topic.failover_alerts.arn]

  dimensions = {
    LoadBalancer = var.primary_alb_arn
  }

  tags = var.tags
}

# SNS Topic for Failover Alerts
resource "aws_sns_topic" "failover_alerts" {
  provider = aws.primary
  name     = "disaster-recovery-failover-alerts"

  tags = merge(var.tags, {
    Name = "disaster-recovery-failover-alerts"
  })
}

resource "aws_sns_topic_subscription" "failover_lambda" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.failover_alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.failover.arn
}

resource "aws_lambda_permission" "sns" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.failover_alerts.arn
}

# Data source for Lambda ZIP
data "archive_file" "lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda_failover.zip"

  source {
    content  = file("${path.module}/lambda_function.py")
    filename = "index.py"
  }
}
