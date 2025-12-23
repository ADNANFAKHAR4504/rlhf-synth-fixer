# CloudWatch Log Group for Application Logs
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ec2/loan-processing-${local.env_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "loan-processing-log-group-${local.env_suffix}"
  }
}

# CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "loan-proc-high-cpu-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = {
    Name = "loan-processing-high-cpu-alarm-${local.env_suffix}"
  }
}

# CloudWatch Alarm - Unhealthy Target Count
resource "aws_cloudwatch_metric_alarm" "unhealthy_targets" {
  alarm_name          = "loan-proc-unhealthy-targets-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors unhealthy target count"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }

  tags = {
    Name = "loan-processing-unhealthy-targets-alarm-${local.env_suffix}"
  }
}

# CloudWatch Alarm - Aurora CPU
resource "aws_cloudwatch_metric_alarm" "aurora_cpu" {
  alarm_name          = "loan-proc-aurora-cpu-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors aurora cpu utilization"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "loan-processing-aurora-cpu-alarm-${local.env_suffix}"
  }
}

# CloudWatch Alarm - Aurora Connections
resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "loan-proc-aurora-conn-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors aurora database connections"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "loan-processing-aurora-conn-alarm-${local.env_suffix}"
  }
}
