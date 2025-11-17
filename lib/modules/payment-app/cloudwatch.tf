# SNS Topic for alarms
resource "aws_sns_topic" "alarms" {
  name = "${var.environment}-payment-app-alarms"
  
  tags = {
    Name        = "${var.environment}-payment-app-alarms"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# SNS Topic Subscription (email)
resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = "ops-${var.environment}@example.com"
}

# CloudWatch Alarm for RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.environment}-payment-app-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = var.rds_cpu_threshold
  alarm_description  = "This metric monitors RDS CPU utilization"
  alarm_actions      = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-rds-cpu-alarm"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarm for RDS Storage Space
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${var.environment}-payment-app-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "FreeStorageSpace"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = 2000000000  # 2GB in bytes
  alarm_description  = "This metric monitors RDS free storage space"
  alarm_actions      = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-rds-storage-alarm"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarm for ALB Target Health
resource "aws_cloudwatch_metric_alarm" "alb_healthy_hosts" {
  alarm_name          = "${var.environment}-payment-app-alb-unhealthy-hosts"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "HealthyHostCount"
  namespace          = "AWS/ApplicationELB"
  period             = "60"
  statistic          = "Average"
  threshold          = var.instance_count * 0.5
  alarm_description  = "Alert when we have less than 50% healthy hosts"
  alarm_actions      = [aws_sns_topic.alarms.arn]
  treat_missing_data = "breaching"
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.main.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-alb-healthy-hosts-alarm"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarm for EC2 CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  count = var.instance_count
  
  alarm_name          = "${var.environment}-payment-app-ec2-${count.index + 1}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "300"
  statistic          = "Average"
  threshold          = var.environment == "prod" ? 70 : 80
  alarm_description  = "This metric monitors EC2 CPU utilization"
  alarm_actions      = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    InstanceId = aws_instance.app[count.index].id
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-ec2-${count.index + 1}-cpu-alarm"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-payment-app-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "RDS CPU" }],
            ["AWS/EC2", "CPUUtilization", { stat = "Average", label = "EC2 CPU" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "CPU Utilization"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
            [".", "RequestCount", { stat = "Sum" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Metrics"
        }
      }
    ]
  })
}