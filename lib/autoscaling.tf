# autoscaling.tf - Auto-scaling policies for Aurora Serverless

# Application Auto Scaling target for Aurora
resource "aws_appautoscaling_target" "aurora_serverless" {
  service_namespace  = "rds"
  scalable_dimension = "rds:cluster:ServerlessV2ScalingConfiguration"
  resource_id        = "cluster:${aws_rds_cluster.aurora_serverless.cluster_identifier}"
  min_capacity       = floor(var.aurora_min_capacity)
  max_capacity       = floor(var.aurora_max_capacity)

  depends_on = [aws_rds_cluster_instance.aurora_instance]
}

# Auto-scaling policy based on CPU utilization
resource "aws_appautoscaling_policy" "aurora_cpu" {
  name               = "${var.project_name}-${var.environment_suffix}-aurora-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.aurora_serverless.resource_id
  scalable_dimension = aws_appautoscaling_target.aurora_serverless.scalable_dimension
  service_namespace  = aws_appautoscaling_target.aurora_serverless.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "RDSReaderAverageCPUUtilization"
    }

    target_value       = var.cpu_scale_up_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto-scaling policy based on database connections
resource "aws_appautoscaling_policy" "aurora_connections" {
  name               = "${var.project_name}-${var.environment_suffix}-aurora-connections-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.aurora_serverless.resource_id
  scalable_dimension = aws_appautoscaling_target.aurora_serverless.scalable_dimension
  service_namespace  = aws_appautoscaling_target.aurora_serverless.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "RDSReaderAverageDatabaseConnections"
    }

    target_value       = var.connections_scale_up_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Custom CloudWatch metric for gaming-specific metrics
resource "aws_cloudwatch_log_metric_filter" "concurrent_players" {
  name           = "${var.project_name}-${var.environment_suffix}-concurrent-players"
  log_group_name = "/aws/rds/cluster/${aws_rds_cluster.aurora_serverless.cluster_identifier}/general"
  pattern        = "[timestamp, request_id, user, database, query_time, lock_time, rows_sent, rows_examined, query]"

  metric_transformation {
    name      = "ConcurrentPlayers"
    namespace = "${var.project_name}/Gaming"
    value     = "1"
  }
}

# Scheduled scaling for predictable gaming patterns
resource "aws_appautoscaling_scheduled_action" "scale_up_peak" {
  name               = "${var.project_name}-${var.environment_suffix}-scale-up-peak"
  service_namespace  = aws_appautoscaling_target.aurora_serverless.service_namespace
  resource_id        = aws_appautoscaling_target.aurora_serverless.resource_id
  scalable_dimension = aws_appautoscaling_target.aurora_serverless.scalable_dimension
  schedule           = "cron(0 18 * * ? *)" # 6 PM UTC daily

  scalable_target_action {
    min_capacity = 4
    max_capacity = var.aurora_max_capacity
  }
}

resource "aws_appautoscaling_scheduled_action" "scale_down_offpeak" {
  name               = "${var.project_name}-${var.environment_suffix}-scale-down-offpeak"
  service_namespace  = aws_appautoscaling_target.aurora_serverless.service_namespace
  resource_id        = aws_appautoscaling_target.aurora_serverless.resource_id
  scalable_dimension = aws_appautoscaling_target.aurora_serverless.scalable_dimension
  schedule           = "cron(0 2 * * ? *)" # 2 AM UTC daily

  scalable_target_action {
    min_capacity = floor(var.aurora_min_capacity)
    max_capacity = 8
  }
}