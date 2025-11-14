# Auto-scaling Target for Blue Service
resource "aws_appautoscaling_target" "ecs_target_blue" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.blue.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto-scaling Policy for Blue Service - CPU
resource "aws_appautoscaling_policy" "ecs_policy_cpu_blue" {
  name               = "payment-ecs-cpu-scaling-blue-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target_blue.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target_blue.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target_blue.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_target_cpu
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto-scaling Policy for Blue Service - Memory
resource "aws_appautoscaling_policy" "ecs_policy_memory_blue" {
  name               = "payment-ecs-memory-scaling-blue-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target_blue.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target_blue.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target_blue.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto-scaling Target for Green Service
resource "aws_appautoscaling_target" "ecs_target_green" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.green.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto-scaling Policy for Green Service - CPU
resource "aws_appautoscaling_policy" "ecs_policy_cpu_green" {
  name               = "payment-ecs-cpu-scaling-green-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target_green.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target_green.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target_green.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_target_cpu
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto-scaling Policy for Green Service - Memory
resource "aws_appautoscaling_policy" "ecs_policy_memory_green" {
  name               = "payment-ecs-memory-scaling-green-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target_green.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target_green.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target_green.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
