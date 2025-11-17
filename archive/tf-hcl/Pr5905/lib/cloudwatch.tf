# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  name = "cloudwatch-alarms-${var.environment_suffix}"

  tags = {
    Name = "cloudwatch-alarms-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - Blue Target Group Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "blue_unhealthy_hosts" {
  alarm_name          = "blue-unhealthy-hosts-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when blue environment has unhealthy hosts"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.blue.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name        = "blue-unhealthy-hosts-${var.environment_suffix}"
    Environment = "Blue"
  }
}

# CloudWatch Alarm - Green Target Group Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "green_unhealthy_hosts" {
  alarm_name          = "green-unhealthy-hosts-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when green environment has unhealthy hosts"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.green.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name        = "green-unhealthy-hosts-${var.environment_suffix}"
    Environment = "Green"
  }
}

# CloudWatch Alarm - Blue ASG CPU Utilization
resource "aws_cloudwatch_metric_alarm" "blue_cpu_high" {
  alarm_name          = "blue-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when blue environment CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.blue.name
  }

  tags = {
    Name        = "blue-cpu-high-${var.environment_suffix}"
    Environment = "Blue"
  }
}

# CloudWatch Alarm - Green ASG CPU Utilization
resource "aws_cloudwatch_metric_alarm" "green_cpu_high" {
  alarm_name          = "green-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when green environment CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.green.name
  }

  tags = {
    Name        = "green-cpu-high-${var.environment_suffix}"
    Environment = "Green"
  }
}

# CloudWatch Alarm - Blue Target Group Request Count
resource "aws_cloudwatch_metric_alarm" "blue_request_count_high" {
  alarm_name          = "blue-request-count-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RequestCountPerTarget"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10000"
  alarm_description   = "Alert when blue environment request count is high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.blue.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name        = "blue-request-count-high-${var.environment_suffix}"
    Environment = "Blue"
  }
}

# CloudWatch Alarm - Green Target Group Request Count
resource "aws_cloudwatch_metric_alarm" "green_request_count_high" {
  alarm_name          = "green-request-count-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RequestCountPerTarget"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10000"
  alarm_description   = "Alert when green environment request count is high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.green.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name        = "green-request-count-high-${var.environment_suffix}"
    Environment = "Green"
  }
}

# CloudWatch Alarm - ALB 5XX Errors
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "alb-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert when ALB has high 5XX error rate"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "alb-5xx-errors-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "rds-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when RDS CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = {
    Name = "rds-cpu-high-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - RDS Database Connections
resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "rds-connections-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "800"
  alarm_description   = "Alert when RDS connections exceed 800"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = {
    Name = "rds-connections-high-${var.environment_suffix}"
  }
}
