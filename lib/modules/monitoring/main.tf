# CloudWatch Alarms and Monitoring

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-dr-alerts-${var.environment}-${var.resource_suffix}"

  tags = {
    Name        = "${var.project_name}-sns-alerts-${var.resource_suffix}"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "lambda" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = var.lambda_function_arn
}

resource "aws_lambda_permission" "sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alerts.arn
}

# CloudWatch Alarm - Primary ALB Unhealthy Targets
resource "aws_cloudwatch_metric_alarm" "primary_alb_unhealthy" {
  alarm_name          = "${var.project_name}-primary-alb-unhealthy-targets-${var.resource_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = var.asg_desired_capacity * 0.5
  alarm_description   = "Triggers when >50% of primary ALB targets are unhealthy"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.primary_alb_arn_suffix
    TargetGroup  = var.primary_tg_arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-primary-unhealthy"
    Environment = var.environment
  }
}

# CloudWatch Alarm - Primary Aurora DB Connections
resource "aws_cloudwatch_metric_alarm" "primary_db_connections" {
  alarm_name          = "${var.project_name}-primary-db-connections-critical-${var.resource_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Triggers when primary Aurora DB has no active connections"
  treat_missing_data  = "breaching"

  dimensions = {
    DBClusterIdentifier = var.primary_db_cluster_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-db-connections"
    Environment = var.environment
  }
}

# CloudWatch Alarm - Primary Region Total Failures
resource "aws_cloudwatch_metric_alarm" "primary_region_failure" {
  alarm_name          = "${var.project_name}-primary-region-total-failure-${var.resource_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Critical: Primary region complete failure detected - triggers DR failover"
  treat_missing_data  = "breaching"

  dimensions = {
    LoadBalancer = var.primary_alb_arn_suffix
    TargetGroup  = var.primary_tg_arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-region-failure"
    Environment = var.environment
    Critical    = "true"
  }
}

# Monitor Lambda failover function errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-failover-errors-${var.resource_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alert when Lambda failover function encounters errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-lambda-errors"
    Environment = var.environment
  }
}

# Monitor ALB response time
resource "aws_cloudwatch_metric_alarm" "primary_alb_latency" {
  alarm_name          = "${var.project_name}-primary-alb-high-latency-${var.resource_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "Alert when ALB response time exceeds 5 seconds"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.primary_alb_arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-alb-latency"
    Environment = var.environment
  }
}

# Monitor DynamoDB read/write throttling
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.project_name}-dynamodb-throttled-requests-${var.resource_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert on DynamoDB throttling events"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = var.dynamodb_table_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-alarm-dynamodb-throttles"
    Environment = var.environment
  }
}

# ============================================================================
# EVENTBRIDGE RULES FOR AUTOMATION
# ============================================================================

resource "aws_cloudwatch_event_rule" "health_check" {
  name                = "${var.project_name}-dr-health-check-${var.resource_suffix}"
  description         = "Periodic health check for DR readiness"
  schedule_expression = "rate(5 minutes)"

  tags = {
    Name        = "${var.project_name}-eventbridge-health-${var.resource_suffix}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_event_target" "health_check_lambda" {
  rule      = aws_cloudwatch_event_rule.health_check.name
  target_id = "HealthCheckLambda"
  arn       = var.lambda_function_arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.health_check.arn
}

