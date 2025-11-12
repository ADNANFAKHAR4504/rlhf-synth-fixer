# Auto Scaling Target - Fraud Detection
resource "aws_appautoscaling_target" "fraud_detection" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.fraud_detection.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU Scaling Policy - Fraud Detection
resource "aws_appautoscaling_policy" "fraud_detection_cpu" {
  name               = "fraud-detection-cpu-scaling-${var.environmentSuffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.fraud_detection.resource_id
  scalable_dimension = aws_appautoscaling_target.fraud_detection.scalable_dimension
  service_namespace  = aws_appautoscaling_target.fraud_detection.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Memory Scaling Policy - Fraud Detection
resource "aws_appautoscaling_policy" "fraud_detection_memory" {
  name               = "fraud-detection-memory-scaling-${var.environmentSuffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.fraud_detection.resource_id
  scalable_dimension = aws_appautoscaling_target.fraud_detection.scalable_dimension
  service_namespace  = aws_appautoscaling_target.fraud_detection.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Target - Transaction Processor
resource "aws_appautoscaling_target" "transaction_processor" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.transaction_processor.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU Scaling Policy - Transaction Processor
resource "aws_appautoscaling_policy" "transaction_processor_cpu" {
  name               = "transaction-processor-cpu-scaling-${var.environmentSuffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.transaction_processor.resource_id
  scalable_dimension = aws_appautoscaling_target.transaction_processor.scalable_dimension
  service_namespace  = aws_appautoscaling_target.transaction_processor.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Memory Scaling Policy - Transaction Processor
resource "aws_appautoscaling_policy" "transaction_processor_memory" {
  name               = "transaction-processor-memory-scaling-${var.environmentSuffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.transaction_processor.resource_id
  scalable_dimension = aws_appautoscaling_target.transaction_processor.scalable_dimension
  service_namespace  = aws_appautoscaling_target.transaction_processor.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
