# CloudWatch log groups with retention
resource "aws_cloudwatch_log_group" "ecs" {
  for_each = local.log_groups

  name              = each.value
  retention_in_days = lookup(var.log_retention_days, var.environment, 7)

  tags = merge(
    local.service_tags[each.key],
    { Name = each.value }
  )
}

# CloudWatch dashboard for monitoring
resource "aws_cloudwatch_dashboard" "ecs" {
  dashboard_name = "${var.environment}-ecs-dashboard-${local.env_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            for service in keys(var.services) : [
              "AWS/ECS", "CPUUtilization",
              "ServiceName", "${var.environment}-${service}-${local.env_suffix}",
              "ClusterName", local.cluster_name
            ]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "CPU Utilization"
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            for service in keys(var.services) : [
              "AWS/ECS", "MemoryUtilization",
              "ServiceName", "${var.environment}-${service}-${local.env_suffix}",
              "ClusterName", local.cluster_name
            ]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Memory Utilization"
        }
      }
    ]
  })
}