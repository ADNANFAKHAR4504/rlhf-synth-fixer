# CloudWatch Alarm - ALB Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  alarm_name          = "alb-unhealthy-hosts-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 0

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }

  alarm_description  = "Alert when ALB has unhealthy targets"
  treat_missing_data = "notBreaching"

  tags = {
    Name = "alb-unhealthy-hosts-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "rds-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_description = "Alert when RDS CPU exceeds 80%"

  tags = {
    Name = "rds-cpu-high-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - RDS Free Storage Space
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "rds-storage-low-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240 # 10 GB in bytes

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_description = "Alert when RDS free storage is below 10GB"

  tags = {
    Name = "rds-storage-low-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - ALB Target Response Time
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "alb-response-time-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 1.0

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_description = "Alert when ALB target response time exceeds 1 second"

  tags = {
    Name = "alb-response-time-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Application Logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/ecommerce-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "app-logs-${var.environment_suffix}"
  }
}
