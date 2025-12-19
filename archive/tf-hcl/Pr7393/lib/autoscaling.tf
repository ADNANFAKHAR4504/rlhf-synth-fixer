# Auto Scaling Configuration for ECS Services
# Step scaling policies with proper cooldown periods

# Auto Scaling Target for API Service
resource "aws_appautoscaling_target" "api" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  role_arn           = aws_iam_role.ecs_autoscale.arn

  depends_on = [aws_ecs_service.api]
}

# CPU-based Step Scaling Policy for API Service
resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "api-cpu-scaling-${var.environment_suffix}"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 10
      scaling_adjustment          = 1
    }

    step_adjustment {
      metric_interval_lower_bound = 10
      scaling_adjustment          = 2
    }
  }
}

# CloudWatch Alarm for API CPU Scale Up
resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  alarm_name          = "api-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "This metric monitors API service CPU utilization"
  alarm_actions       = [aws_appautoscaling_policy.api_cpu.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }

  tags = {
    Name       = "api-cpu-high-alarm-${var.environment_suffix}"
    Service    = "api"
    CostCenter = "infrastructure"
  }
}

# CPU-based Step Scaling Policy for API Service Scale Down
resource "aws_appautoscaling_policy" "api_cpu_down" {
  name               = "api-cpu-scaling-down-${var.environment_suffix}"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment          = -1
    }
  }
}

# CloudWatch Alarm for API CPU Scale Down
resource "aws_cloudwatch_metric_alarm" "api_cpu_low" {
  alarm_name          = "api-cpu-low-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "This metric monitors API service CPU utilization for scale down"
  alarm_actions       = [aws_appautoscaling_policy.api_cpu_down.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }

  tags = {
    Name       = "api-cpu-low-alarm-${var.environment_suffix}"
    Service    = "api"
    CostCenter = "infrastructure"
  }
}

# Memory-based Step Scaling Policy for API Service
resource "aws_appautoscaling_policy" "api_memory" {
  name               = "api-memory-scaling-${var.environment_suffix}"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 2
    }
  }
}

# CloudWatch Alarm for API Memory Scale Up
resource "aws_cloudwatch_metric_alarm" "api_memory_high" {
  alarm_name          = "api-memory-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors API service memory utilization"
  alarm_actions       = [aws_appautoscaling_policy.api_memory.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }

  tags = {
    Name       = "api-memory-high-alarm-${var.environment_suffix}"
    Service    = "api"
    CostCenter = "infrastructure"
  }
}

# Auto Scaling Target for Worker Service
resource "aws_appautoscaling_target" "worker" {
  max_capacity       = 8
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.worker.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  role_arn           = aws_iam_role.ecs_autoscale.arn

  depends_on = [aws_ecs_service.worker]
}

# CPU-based Step Scaling Policy for Worker Service
resource "aws_appautoscaling_policy" "worker_cpu" {
  name               = "worker-cpu-scaling-${var.environment_suffix}"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.worker.resource_id
  scalable_dimension = aws_appautoscaling_target.worker.scalable_dimension
  service_namespace  = aws_appautoscaling_target.worker.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 10
      scaling_adjustment          = 1
    }

    step_adjustment {
      metric_interval_lower_bound = 10
      scaling_adjustment          = 2
    }
  }
}

# CloudWatch Alarm for Worker CPU Scale Up
resource "aws_cloudwatch_metric_alarm" "worker_cpu_high" {
  alarm_name          = "worker-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "This metric monitors Worker service CPU utilization"
  alarm_actions       = [aws_appautoscaling_policy.worker_cpu.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.worker.name
  }

  tags = {
    Name       = "worker-cpu-high-alarm-${var.environment_suffix}"
    Service    = "worker"
    CostCenter = "infrastructure"
  }
}

# CPU-based Step Scaling Policy for Worker Service Scale Down
resource "aws_appautoscaling_policy" "worker_cpu_down" {
  name               = "worker-cpu-scaling-down-${var.environment_suffix}"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.worker.resource_id
  scalable_dimension = aws_appautoscaling_target.worker.scalable_dimension
  service_namespace  = aws_appautoscaling_target.worker.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment          = -1
    }
  }
}

# CloudWatch Alarm for Worker CPU Scale Down
resource "aws_cloudwatch_metric_alarm" "worker_cpu_low" {
  alarm_name          = "worker-cpu-low-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 25
  alarm_description   = "This metric monitors Worker service CPU utilization for scale down"
  alarm_actions       = [aws_appautoscaling_policy.worker_cpu_down.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.worker.name
  }

  tags = {
    Name       = "worker-cpu-low-alarm-${var.environment_suffix}"
    Service    = "worker"
    CostCenter = "infrastructure"
  }
}

# Memory-based Step Scaling Policy for Worker Service
resource "aws_appautoscaling_policy" "worker_memory" {
  name               = "worker-memory-scaling-${var.environment_suffix}"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.worker.resource_id
  scalable_dimension = aws_appautoscaling_target.worker.scalable_dimension
  service_namespace  = aws_appautoscaling_target.worker.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 2
    }
  }
}

# CloudWatch Alarm for Worker Memory Scale Up
resource "aws_cloudwatch_metric_alarm" "worker_memory_high" {
  alarm_name          = "worker-memory-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "This metric monitors Worker service memory utilization"
  alarm_actions       = [aws_appautoscaling_policy.worker_memory.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.worker.name
  }

  tags = {
    Name       = "worker-memory-high-alarm-${var.environment_suffix}"
    Service    = "worker"
    CostCenter = "infrastructure"
  }
}

# Auto Scaling Target for Scheduler Service
resource "aws_appautoscaling_target" "scheduler" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.scheduler.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  role_arn           = aws_iam_role.ecs_autoscale.arn

  depends_on = [aws_ecs_service.scheduler]
}

# CPU-based Step Scaling Policy for Scheduler Service
resource "aws_appautoscaling_policy" "scheduler_cpu" {
  name               = "scheduler-cpu-scaling-${var.environment_suffix}"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.scheduler.resource_id
  scalable_dimension = aws_appautoscaling_target.scheduler.scalable_dimension
  service_namespace  = aws_appautoscaling_target.scheduler.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 1
    }
  }
}

# CloudWatch Alarm for Scheduler CPU Scale Up
resource "aws_cloudwatch_metric_alarm" "scheduler_cpu_high" {
  alarm_name          = "scheduler-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "This metric monitors Scheduler service CPU utilization"
  alarm_actions       = [aws_appautoscaling_policy.scheduler_cpu.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.scheduler.name
  }

  tags = {
    Name       = "scheduler-cpu-high-alarm-${var.environment_suffix}"
    Service    = "scheduler"
    CostCenter = "infrastructure"
  }
}
