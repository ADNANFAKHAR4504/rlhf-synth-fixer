# Auto Scaling Target for Payment Service
resource "aws_appautoscaling_target" "payment_service" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.fintech_cluster.name}/${aws_ecs_service.payment_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU-based Auto Scaling Policy for Payment Service
resource "aws_appautoscaling_policy" "payment_service_cpu" {
  name               = "payment-service-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.payment_service.resource_id
  scalable_dimension = aws_appautoscaling_target.payment_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.payment_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_cpu_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Memory-based Auto Scaling Policy for Payment Service
resource "aws_appautoscaling_policy" "payment_service_memory" {
  name               = "payment-service-memory-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.payment_service.resource_id
  scalable_dimension = aws_appautoscaling_target.payment_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.payment_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.autoscaling_memory_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Target for Auth Service
resource "aws_appautoscaling_target" "auth_service" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.fintech_cluster.name}/${aws_ecs_service.auth_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU-based Auto Scaling Policy for Auth Service
resource "aws_appautoscaling_policy" "auth_service_cpu" {
  name               = "auth-service-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.auth_service.resource_id
  scalable_dimension = aws_appautoscaling_target.auth_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.auth_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_cpu_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Memory-based Auto Scaling Policy for Auth Service
resource "aws_appautoscaling_policy" "auth_service_memory" {
  name               = "auth-service-memory-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.auth_service.resource_id
  scalable_dimension = aws_appautoscaling_target.auth_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.auth_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.autoscaling_memory_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Target for Analytics Service
resource "aws_appautoscaling_target" "analytics_service" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.fintech_cluster.name}/${aws_ecs_service.analytics_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU-based Auto Scaling Policy for Analytics Service
resource "aws_appautoscaling_policy" "analytics_service_cpu" {
  name               = "analytics-service-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.analytics_service.resource_id
  scalable_dimension = aws_appautoscaling_target.analytics_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.analytics_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_cpu_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Memory-based Auto Scaling Policy for Analytics Service
resource "aws_appautoscaling_policy" "analytics_service_memory" {
  name               = "analytics-service-memory-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.analytics_service.resource_id
  scalable_dimension = aws_appautoscaling_target.analytics_service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.analytics_service.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.autoscaling_memory_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
