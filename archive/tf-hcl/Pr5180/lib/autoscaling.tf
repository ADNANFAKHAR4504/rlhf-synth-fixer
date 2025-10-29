# autoscaling.tf - Auto-scaling configuration for Aurora Serverless v2

# Note: Aurora Serverless v2 automatically scales based on the serverlessv2_scaling_configuration
# defined in the RDS cluster resource. Application Auto Scaling API is NOT used for Serverless v2.
# The scaling happens automatically within the min_capacity and max_capacity bounds.

# For reference: The following resources are NOT needed for Aurora Serverless v2:
# - aws_appautoscaling_target (not supported for Serverless v2)
# - aws_appautoscaling_policy (scaling is automatic)
# - aws_appautoscaling_scheduled_action (not supported for Serverless v2)
# - aws_cloudwatch_log_metric_filter (requires log group to exist first)

# Aurora Serverless v2 scaling is configured in main.tf via:
# - serverlessv2_scaling_configuration {
#     min_capacity = var.aurora_min_capacity
#     max_capacity = var.aurora_max_capacity
#   }

# This file is intentionally minimal as Aurora Serverless v2 handles scaling automatically.
