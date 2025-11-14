locals {
  # Compute the effective environment suffix
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : var.environment

  common_tags = {
    Environment       = var.environment
    EnvironmentSuffix = local.env_suffix
    ManagedBy         = "Terraform"
    Team              = "Platform"
    Project           = "FinTech"
  }

  service_tags = {
    for service, config in var.services : service => merge(
      local.common_tags,
      {
        Service = service
        Type    = "ECS-Fargate"
      }
    )
  }

  # Naming convention: {environment}-{service}-{resource_type}-{suffix}
  cluster_name = "${var.environment}-ecs-cluster-${local.env_suffix}"

  # Log group names
  log_groups = {
    for service in keys(var.services) :
    service => "/ecs/${var.environment}/${service}-${local.env_suffix}"
  }

  # ECR repository names (assuming they follow a pattern)
  ecr_repos = {
    for service in keys(var.services) :
    service => "${var.environment}-${service}"
  }
}