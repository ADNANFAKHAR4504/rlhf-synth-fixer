# Auto Scaling Policy for Task Nodes
resource "aws_emr_managed_scaling_policy" "main" {
  cluster_id = aws_emr_cluster.main.id

  compute_limits {
    unit_type                       = "Instances"
    minimum_capacity_units          = 1 + var.core_instance_count
    maximum_capacity_units          = 1 + var.core_instance_count + var.task_instance_max
    maximum_ondemand_capacity_units = 1 + var.core_instance_count
    maximum_core_capacity_units     = 1 + var.core_instance_count
  }
}

# Custom Auto Scaling Rules based on YARN Memory
resource "aws_applicationautoscaling_target" "emr_task_group" {
  max_capacity       = var.task_instance_max
  min_capacity       = var.task_instance_min
  resource_id        = "instancegroup/${aws_emr_cluster.main.id}/${aws_emr_instance_group.task.id}"
  role_arn           = aws_iam_role.emr_autoscaling_role.arn
  scalable_dimension = "elasticmapreduce:instancegroup:InstanceCount"
  service_namespace  = "elasticmapreduce"
}

# Scale Out Policy - When YARN Memory Available is Low
resource "aws_applicationautoscaling_policy" "scale_out" {
  name               = "${local.bucket_prefix}-emr-yarn-memory"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_applicationautoscaling_target.emr_task_group.resource_id
  scalable_dimension = aws_applicationautoscaling_target.emr_task_group.scalable_dimension
  service_namespace  = aws_applicationautoscaling_target.emr_task_group.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = var.yarn_memory_target

    customized_metric_specification {
      metric_name = "YARNMemoryAvailablePercentage"
      namespace   = "AWS/ElasticMapReduce"
      statistic   = "Average"
      unit        = "Percent"

      dimensions {
        name  = "ClusterId"
        value = aws_emr_cluster.main.id
      }
    }

    scale_out_cooldown = 300
    scale_in_cooldown  = 300
  }
}

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