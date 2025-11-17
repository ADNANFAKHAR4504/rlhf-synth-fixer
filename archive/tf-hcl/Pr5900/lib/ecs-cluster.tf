# ECS Cluster
resource "aws_ecs_cluster" "fintech_cluster" {
  name = "fintech-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  tags = {
    Name = "fintech-cluster-${var.environment_suffix}"
  }
}

# ECS Cluster Capacity Provider (Fargate)
resource "aws_ecs_cluster_capacity_providers" "fintech_cluster" {
  cluster_name = aws_ecs_cluster.fintech_cluster.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}
