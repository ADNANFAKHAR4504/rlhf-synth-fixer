# Basic CloudWatch Alarms for composite alarm dependencies

# Alarm 1: High CPU utilization
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.name_prefix}-high-cpu-critical"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggers when CPU utilization exceeds 80%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  alarm_actions = [aws_sns_topic.critical_alarms.arn]
  ok_actions    = [aws_sns_topic.info_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-high-cpu"
      Severity = "Critical"
    }
  )
}

# Alarm 2: High memory utilization
resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${local.name_prefix}-high-memory-warning"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "Triggers when memory utilization exceeds 85%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-high-memory"
      Severity = "Warning"
    }
  )
}

# Alarm 3: High error rate using metric math
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${local.name_prefix}-high-error-rate-critical"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  alarm_description   = "Triggers when error rate exceeds 5% using metric math"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(m2/m1)*100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "m1"

    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"

      dimensions = {
        FunctionName = aws_lambda_function.metric_processor.function_name
      }
    }
  }

  metric_query {
    id = "m2"

    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"

      dimensions = {
        FunctionName = aws_lambda_function.metric_processor.function_name
      }
    }
  }

  alarm_actions = [aws_sns_topic.critical_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-high-error-rate"
      Severity = "Critical"
    }
  )
}

# Alarm 4: Custom metric - Response Time
resource "aws_cloudwatch_metric_alarm" "slow_response" {
  alarm_name          = "${local.name_prefix}-slow-response-warning"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ResponseTime"
  namespace           = "CustomMetrics/${local.name_prefix}"
  period              = 300
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "Triggers when average response time exceeds 1000ms"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-slow-response"
      Severity = "Warning"
    }
  )
}

# Composite Alarm with AND/OR logic - System Health
resource "aws_cloudwatch_composite_alarm" "system_health" {
  alarm_name        = "${local.name_prefix}-system-health-composite"
  alarm_description = "Composite alarm monitoring system health with AND/OR logic"
  actions_enabled   = true

  # AND condition: High CPU AND High Memory = Critical system issue
  # OR condition: Any critical alarm triggers notification
  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.high_cpu.alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.high_memory.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.high_error_rate.alarm_name})"

  alarm_actions = [aws_sns_topic.critical_alarms.arn]
  ok_actions    = [aws_sns_topic.info_alarms.arn]

  actions_suppressor {
    alarm            = aws_cloudwatch_metric_alarm.maintenance_mode.alarm_name
    extension_period = 300
    wait_period      = 60
  }

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-system-health"
      Type     = "Composite"
      Severity = "Critical"
    }
  )
}

# Maintenance mode alarm for suppression
resource "aws_cloudwatch_metric_alarm" "maintenance_mode" {
  alarm_name          = "${local.name_prefix}-maintenance-mode"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "MaintenanceMode"
  namespace           = "CustomMetrics/${local.name_prefix}"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Indicates system is in maintenance mode"
  treat_missing_data  = "notBreaching"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-maintenance-mode"
    }
  )
}

# Composite Alarm - Performance degradation (3+ metrics)
resource "aws_cloudwatch_composite_alarm" "performance_degradation" {
  alarm_name        = "${local.name_prefix}-performance-composite"
  alarm_description = "Detects performance degradation across multiple metrics"
  actions_enabled   = true

  # Complex logic: (High CPU OR High Memory) AND Slow Response
  alarm_rule = "(ALARM(${aws_cloudwatch_metric_alarm.high_cpu.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.high_memory.alarm_name})) AND ALARM(${aws_cloudwatch_metric_alarm.slow_response.alarm_name})"

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-performance"
      Type     = "Composite"
      Severity = "Warning"
    }
  )
}

# Additional alarms for more comprehensive monitoring
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "${local.name_prefix}-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Triggers when Lambda throttles exceed threshold"

  dimensions = {
    FunctionName = aws_lambda_function.metric_processor.function_name
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = local.common_tags
}
