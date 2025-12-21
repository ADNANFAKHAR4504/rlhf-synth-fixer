# alarms.tf - CloudWatch Alarms for monitoring

# CPU Utilization Alarms (Warning Level)
resource "aws_cloudwatch_metric_alarm" "cpu_warning" {
  for_each = toset(var.microservices)

  alarm_name          = "cpu-warning-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.warning_threshold_percentage
  alarm_description   = "CPU utilization warning for ${each.value}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name     = "cpu-warning-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "warning"
  }
}

# CPU Utilization Alarms (Critical Level)
resource "aws_cloudwatch_metric_alarm" "cpu_critical" {
  for_each = toset(var.microservices)

  alarm_name          = "cpu-critical-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.critical_threshold_percentage
  alarm_description   = "CPU utilization critical for ${each.value}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name     = "cpu-critical-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "critical"
  }
}

# Memory Utilization Alarms (Warning Level)
resource "aws_cloudwatch_metric_alarm" "memory_warning" {
  for_each = toset(var.microservices)

  alarm_name          = "memory-warning-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.warning_threshold_percentage
  alarm_description   = "Memory utilization warning for ${each.value}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name     = "memory-warning-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "warning"
  }
}

# Memory Utilization Alarms (Critical Level)
resource "aws_cloudwatch_metric_alarm" "memory_critical" {
  for_each = toset(var.microservices)

  alarm_name          = "memory-critical-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.critical_threshold_percentage
  alarm_description   = "Memory utilization critical for ${each.value}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name     = "memory-critical-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "critical"
  }
}

# Application Error Rate Alarms
resource "aws_cloudwatch_metric_alarm" "error_rate_warning" {
  for_each = toset(var.microservices)

  alarm_name          = "error-rate-warning-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "CustomMetrics/${each.value}"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Error rate warning for ${each.value}"
  treat_missing_data  = "notBreaching"

  tags = {
    Name     = "error-rate-warning-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "warning"
  }
}

resource "aws_cloudwatch_metric_alarm" "error_rate_critical" {
  for_each = toset(var.microservices)

  alarm_name          = "error-rate-critical-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "CustomMetrics/${each.value}"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "Error rate critical for ${each.value}"
  treat_missing_data  = "notBreaching"

  tags = {
    Name     = "error-rate-critical-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "critical"
  }
}

# Composite Alarms (Combining CPU, Memory, and Error Rate)
resource "aws_cloudwatch_composite_alarm" "service_health_warning" {
  for_each = toset(var.microservices)

  alarm_name        = "service-health-warning-${each.value}-${var.environment_suffix}"
  alarm_description = "Composite warning alarm for ${each.value} - triggers when CPU OR Memory OR Error Rate exceeds warning thresholds"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.warning_alerts.arn]
  ok_actions        = [aws_sns_topic.warning_alerts.arn]

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.cpu_warning[each.value].alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.memory_warning[each.value].alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.error_rate_warning[each.value].alarm_name})"

  tags = {
    Name     = "composite-warning-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "warning"
  }
}

resource "aws_cloudwatch_composite_alarm" "service_health_critical" {
  for_each = toset(var.microservices)

  alarm_name        = "service-health-critical-${each.value}-${var.environment_suffix}"
  alarm_description = "Composite critical alarm for ${each.value} - triggers when CPU AND Memory are high OR Error Rate is critical"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.critical_alerts.arn]
  ok_actions        = [aws_sns_topic.critical_alerts.arn]

  alarm_rule = "(ALARM(${aws_cloudwatch_metric_alarm.cpu_critical[each.value].alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.memory_critical[each.value].alarm_name})) OR ALARM(${aws_cloudwatch_metric_alarm.error_rate_critical[each.value].alarm_name})"

  tags = {
    Name     = "composite-critical-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "critical"
  }
}

# ECS Task Failure Alarms (Container Insights)
resource "aws_cloudwatch_metric_alarm" "task_failure" {
  for_each = toset(var.microservices)

  alarm_name          = "task-failure-${each.value}-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "Alert when ${each.value} running tasks drop below 1"
  treat_missing_data  = "breaching"

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  alarm_actions = [aws_sns_topic.critical_alerts.arn]

  tags = {
    Name     = "task-failure-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "critical"
  }
}
