# CloudWatch Dashboard for Monitoring
resource "aws_cloudwatch_dashboard" "emr_monitoring" {
  dashboard_name = "${local.bucket_prefix}-emr-dashboard"

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
            ["AWS/ElasticMapReduce", "YARNMemoryAvailablePercentage", { stat = "Average" }],
            [".", "ContainerPendingRatio", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "YARN Memory and Container Metrics"
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
            ["AWS/ElasticMapReduce", "CoreNodesRunning", { stat = "Average" }],
            [".", "TaskNodesRunning", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Running Instances"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6

        properties = {
          metrics = [
            ["AWS/ElasticMapReduce", "AppsCompleted", { stat = "Sum" }],
            [".", "AppsFailed", { stat = "Sum" }],
            [".", "AppsRunning", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Application Status"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_yarn_memory_pressure" {
  alarm_name          = "${local.bucket_prefix}-emr-high-memory-pressure"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "YARNMemoryAvailablePercentage"
  namespace           = "AWS/ElasticMapReduce"
  period              = "300"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "YARN memory available is critically low"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterId = aws_emr_cluster.main.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "failed_apps" {
  alarm_name          = "${local.bucket_prefix}-emr-failed-apps"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "AppsFailed"
  namespace           = "AWS/ElasticMapReduce"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "More than 5 applications failed in the last 5 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterId = aws_emr_cluster.main.id
  }

  tags = local.common_tags
}