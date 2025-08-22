locals {
  # Add environment suffix to project name for unique naming
  project_prefix = "${var.project_name}-${var.environment_suffix}"

  common_tags = {
    environment = "multi"
    owner       = var.owner
    project     = var.project_name
    managed_by  = "terraform"
    env_suffix  = var.environment_suffix
  }

  env_tags = {
    for env in var.environments : env => merge(local.common_tags, {
      environment = env
    })
  }
}