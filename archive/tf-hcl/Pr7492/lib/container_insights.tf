# Enable Container Insights for ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = var.ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"

      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = var.ecs_cluster_name
    }
  )
}

resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/aws/ecs/${var.ecs_cluster_name}/exec"
  retention_in_days = 7

  tags = local.common_tags
}

# CloudWatch Container Insights alarms
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${local.name_prefix}-ecs-cpu-reservation-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUReservation"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "ECS CPU reservation is high"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${local.name_prefix}-ecs-memory-reservation-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryReservation"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "ECS memory reservation is high"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = local.common_tags
}

# Task-level metric filters
resource "aws_cloudwatch_log_group" "ecs_tasks" {
  name              = "/ecs/${var.ecs_cluster_name}/tasks"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_cloudwatch_log_metric_filter" "ecs_task_errors" {
  name           = "${local.name_prefix}-ecs-task-errors"
  log_group_name = aws_cloudwatch_log_group.ecs_tasks.name
  pattern        = "[time, request_id, level=ERROR*, ...]"

  metric_transformation {
    name          = "ECSTaskErrors"
    namespace     = "CustomMetrics/${local.name_prefix}"
    value         = "1"
    default_value = "0"
  }
}
