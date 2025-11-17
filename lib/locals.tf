locals {
  # Environment-specific configurations
  env_config = {
    dev = {
      asg_min_size       = 1
      asg_max_size       = 2
      asg_desired        = 1
      rds_instance_class = "db.t3.small"
      rds_storage        = 20
      rds_backup_days    = 3
    }
    staging = {
      asg_min_size       = 2
      asg_max_size       = 4
      asg_desired        = 2
      rds_instance_class = "db.t3.medium"
      rds_storage        = 50
      rds_backup_days    = 7
    }
    prod = {
      asg_min_size       = 3
      asg_max_size       = 10
      asg_desired        = 3
      rds_instance_class = "db.t3.large"
      rds_storage        = 100
      rds_backup_days    = 30
    }
  }

  current_env = lookup(local.env_config, terraform.workspace, local.env_config["dev"])

  # Common tags with merge() function
  common_tags = merge(
    var.default_tags,
    {
      Environment       = terraform.workspace
      EnvironmentSuffix = var.environment_suffix
      ManagedBy         = "Terraform"
      # LastUpdated removed to prevent constant drift
      # Consider using a static version tag or deployment date instead
    }
  )
}
