resource "aws_cloudwatch_dashboard" "migration" {
  dashboard_name = "migration-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DMS", "CDCLatencySource", { stat = "Average" }],
            [".", "CDCLatencyTarget", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "DMS Replication Lag"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum" }],
            [".", "TargetResponseTime", { stat = "Average" }]
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
            ["AWS/AutoScaling", "GroupInServiceInstances", { stat = "Average" }],
            [".", "GroupDesiredCapacity", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Auto Scaling Group Health"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "dms_lag" {
  count               = terraform.workspace == "production" ? 1 : 0
  alarm_name          = "dms-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CDCLatencySource"
  namespace           = "AWS/DMS"
  period              = 300
  statistic           = "Average"
  threshold           = 60
  alarm_description   = "DMS replication lag exceeds 60 seconds"

  dimensions = {
    ReplicationInstanceIdentifier = aws_dms_replication_instance.main[0].replication_instance_id
  }

  tags = merge(local.common_tags, {
    Name = "dms-lag-alarm-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "alb-unhealthy-targets-${terraform.workspace}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "ALB has unhealthy targets"

  dimensions = {
    TargetGroup  = aws_lb_target_group.main.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(local.common_tags, {
    Name = "alb-unhealthy-alarm-${terraform.workspace}-${var.environment_suffix}"
  })
}
