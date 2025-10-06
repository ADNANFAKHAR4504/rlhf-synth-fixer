# Route 53 Hosted Zone (assuming it exists)
data "aws_route53_zone" "main" {
  provider     = aws.route53
  name         = var.domain_name
  private_zone = false
}

# Primary Health Check
resource "aws_route53_health_check" "primary" {
  provider          = aws.route53
  fqdn              = var.primary_alb_dns
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = var.failover_threshold
  request_interval  = var.health_check_interval

  tags = merge(var.tags, {
    Name   = "primary-health-check"
    Region = "primary"
  })
}

# Secondary Health Check  
resource "aws_route53_health_check" "secondary" {
  provider          = aws.route53
  fqdn              = var.secondary_alb_dns
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = var.failover_threshold
  request_interval  = var.health_check_interval

  tags = merge(var.tags, {
    Name   = "secondary-health-check"
    Region = "secondary"
  })
}

# Primary Route53 Record
resource "aws_route53_record" "primary" {
  provider = aws.route53
  zone_id  = data.aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"

  alias {
    name                   = var.primary_alb_dns
    zone_id                = var.primary_alb_zone_id
    evaluate_target_health = true
  }

  set_identifier = "Primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id
}

# Secondary Route53 Record
resource "aws_route53_record" "secondary" {
  provider = aws.route53
  zone_id  = data.aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"

  alias {
    name                   = var.secondary_alb_dns
    zone_id                = var.secondary_alb_zone_id
    evaluate_target_health = true
  }

  set_identifier = "Secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id
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
      PRIMARY_REGION   = var.primary_region
      SECONDARY_REGION = var.secondary_region
      PRIMARY_DB_ARN   = var.primary_db_arn
      SECONDARY_DB_ARN = var.secondary_db_arn
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
          "route53:ChangeResourceRecordSets",
          "route53:GetHealthCheck",
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
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Alarm when primary region is unhealthy"
  alarm_actions       = [aws_sns_topic.failover_alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
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
