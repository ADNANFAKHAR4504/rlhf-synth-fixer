# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.ecs_service_name, "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "ECS CPU and Memory Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix],
            [".", "RequestCount", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "ALB Performance"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.rds_instance_id],
            [".", "CPUUtilization", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "RDS Performance"
          period  = 300
        }
      }
    ]
  })
}

# ECS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ECS-CPU-Alarm-${var.region}-${var.environment}"
  })
}

# ECS Memory Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.project_name}-ecs-memory-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ECS-Memory-Alarm-${var.region}-${var.environment}"
  })
}

# RDS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-rds-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-RDS-CPU-Alarm-${var.region}-${var.environment}"
  })
}

# RDS Storage Alarm
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${var.project_name}-rds-storage-low-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10GB in bytes
  alarm_description   = "This metric monitors RDS free storage"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-RDS-Storage-Alarm-${var.region}-${var.environment}"
  })
}

# ALB Target Health Alarm
resource "aws_cloudwatch_metric_alarm" "alb_healthy_hosts" {
  alarm_name          = "${var.project_name}-alb-unhealthy-hosts-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB healthy host count"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    TargetGroup  = var.target_group_arn_suffix
    LoadBalancer = var.alb_arn_suffix
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ALB-Health-Alarm-${var.region}-${var.environment}"
  })
}

# ALB Response Time Alarm
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.project_name}-alb-response-time-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-ALB-ResponseTime-Alarm-${var.region}-${var.environment}"
  })
}