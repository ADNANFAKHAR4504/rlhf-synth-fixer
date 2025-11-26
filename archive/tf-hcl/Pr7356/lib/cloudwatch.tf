# cloudwatch.tf - CloudWatch monitoring and metric filters

# Metric filter for error monitoring
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "payment-error-count-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.ecs.name
  pattern        = "[time, request_id, level = ERROR*, ...]"

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "Payment/Application"
    value         = "1"
    default_value = "0"
  }
}

# Metric filter for critical errors
resource "aws_cloudwatch_log_metric_filter" "critical_error_count" {
  name           = "payment-critical-error-count-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.ecs.name
  pattern        = "[time, request_id, level = CRITICAL*, ...]"

  metric_transformation {
    name          = "CriticalErrorCount"
    namespace     = "Payment/Application"
    value         = "1"
    default_value = "0"
  }
}

# CloudWatch alarm for high error rate
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "payment-high-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "Payment/Application"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors application error rate"
  treat_missing_data  = "notBreaching"

  tags = {
    Name       = "payment-high-error-rate-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# CloudWatch alarm for ALB unhealthy targets
resource "aws_cloudwatch_metric_alarm" "unhealthy_targets" {
  alarm_name          = "payment-unhealthy-targets-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "This alarm monitors unhealthy targets in ALB"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }

  tags = {
    Name       = "payment-unhealthy-targets-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# CloudWatch alarm for ECS CPU utilization
resource "aws_cloudwatch_metric_alarm" "ecs_high_cpu" {
  alarm_name          = "payment-ecs-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This alarm monitors ECS CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }

  tags = {
    Name       = "payment-ecs-high-cpu-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# CloudWatch alarm for ECS memory utilization
resource "aws_cloudwatch_metric_alarm" "ecs_high_memory" {
  alarm_name          = "payment-ecs-high-memory-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "This alarm monitors ECS memory utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }

  tags = {
    Name       = "payment-ecs-high-memory-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# CloudWatch alarm for Aurora CPU
resource "aws_cloudwatch_metric_alarm" "aurora_high_cpu" {
  alarm_name          = "payment-aurora-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This alarm monitors Aurora CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name       = "payment-aurora-high-cpu-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

# CloudWatch alarm for Aurora connections
resource "aws_cloudwatch_metric_alarm" "aurora_high_connections" {
  alarm_name          = "payment-aurora-high-connections-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This alarm monitors Aurora database connections"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name       = "payment-aurora-high-connections-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}
