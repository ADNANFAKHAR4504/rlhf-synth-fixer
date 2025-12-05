# ecs.tf - Minimal ECS cluster for monitoring (fixes MODEL_RESPONSE dependency issue)

# Create ECS cluster since none exists (MODEL_RESPONSE incorrectly assumed existing infrastructure)
resource "aws_ecs_cluster" "main" {
  name = var.ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = var.ecs_cluster_name
  }
}

# Update data source to use created cluster instead of lookup
locals {
  ecs_cluster_arn  = aws_ecs_cluster.main.arn
  ecs_cluster_name = aws_ecs_cluster.main.name
}
