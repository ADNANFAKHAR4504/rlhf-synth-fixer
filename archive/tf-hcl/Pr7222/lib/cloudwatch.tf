# cloudwatch.tf - CloudWatch Alarms and Monitoring

# SNS Topic for CloudWatch Alarms
resource "aws_sns_topic" "cloudwatch_alarms" {
  name              = "payment-cloudwatch-alarms-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.cloudwatch.id

  tags = {
    Name = "payment-cloudwatch-alarms-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - Aurora Database Connections (80% threshold)
resource "aws_cloudwatch_metric_alarm" "aurora_connections_high" {
  alarm_name          = "payment-aurora-connections-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Aurora database connections exceeding 80%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.cloudwatch_alarms.arn]
  ok_actions    = [aws_sns_topic.cloudwatch_alarms.arn]

  tags = {
    Name = "payment-aurora-connections-high-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - Aurora CPU Utilization
resource "aws_cloudwatch_metric_alarm" "aurora_cpu_high" {
  alarm_name          = "payment-aurora-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Aurora CPU utilization is too high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.cloudwatch_alarms.arn]
  ok_actions    = [aws_sns_topic.cloudwatch_alarms.arn]

  tags = {
    Name = "payment-aurora-cpu-high-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - Aurora Free Storage Space
resource "aws_cloudwatch_metric_alarm" "aurora_storage_low" {
  alarm_name          = "payment-aurora-storage-low-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeLocalStorage"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5368709120 # 5 GB in bytes
  alarm_description   = "Aurora free storage space is running low"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.cloudwatch_alarms.arn]
  ok_actions    = [aws_sns_topic.cloudwatch_alarms.arn]

  tags = {
    Name = "payment-aurora-storage-low-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - ALB Target Health
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "payment-alb-unhealthy-targets-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "ALB has unhealthy targets"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = var.deployment_color == "blue" ? aws_lb_target_group.blue.arn_suffix : aws_lb_target_group.green.arn_suffix
  }

  alarm_actions = [aws_sns_topic.cloudwatch_alarms.arn]
  ok_actions    = [aws_sns_topic.cloudwatch_alarms.arn]

  tags = {
    Name = "payment-alb-unhealthy-targets-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - ALB 5XX Errors
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "payment-alb-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB is receiving too many 5XX errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.cloudwatch_alarms.arn]
  ok_actions    = [aws_sns_topic.cloudwatch_alarms.arn]

  tags = {
    Name = "payment-alb-5xx-errors-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - ALB Response Time
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "payment-alb-response-time-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "ALB response time is too high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.cloudwatch_alarms.arn]
  ok_actions    = [aws_sns_topic.cloudwatch_alarms.arn]

  tags = {
    Name = "payment-alb-response-time-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - Auto Scaling Group Capacity
resource "aws_cloudwatch_metric_alarm" "asg_capacity_blue" {
  count = var.deployment_color == "blue" ? 1 : 0

  alarm_name          = "payment-asg-capacity-blue-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "GroupDesiredCapacity"
  namespace           = "AWS/AutoScaling"
  period              = 60
  statistic           = "Average"
  threshold           = var.asg_min_size
  alarm_description   = "Auto Scaling Group capacity is below minimum"
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.blue.name
  }

  alarm_actions = [aws_sns_topic.cloudwatch_alarms.arn]
  ok_actions    = [aws_sns_topic.cloudwatch_alarms.arn]

  tags = {
    Name = "payment-asg-capacity-blue-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "asg_capacity_green" {
  count = var.deployment_color == "green" ? 1 : 0

  alarm_name          = "payment-asg-capacity-green-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "GroupDesiredCapacity"
  namespace           = "AWS/AutoScaling"
  period              = 60
  statistic           = "Average"
  threshold           = var.asg_min_size
  alarm_description   = "Auto Scaling Group capacity is below minimum"
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.green.name
  }

  alarm_actions = [aws_sns_topic.cloudwatch_alarms.arn]
  ok_actions    = [aws_sns_topic.cloudwatch_alarms.arn]

  tags = {
    Name = "payment-asg-capacity-green-${var.environment_suffix}"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "payment-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", label = "DB Connections" }],
            [".", "CPUUtilization", { stat = "Average", label = "DB CPU" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Aurora Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", label = "Response Time" }],
            [".", "RequestCount", { stat = "Sum", label = "Requests" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/AutoScaling", "GroupDesiredCapacity", { stat = "Average", label = "Desired" }],
            [".", "GroupInServiceInstances", { stat = "Average", label = "In Service" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Auto Scaling Metrics"
        }
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "ec2_application" {
  name              = "/aws/ec2/payment-api-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name = "payment-ec2-logs-${var.environment_suffix}"
  }
}
