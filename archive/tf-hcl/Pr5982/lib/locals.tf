locals {
  environment = terraform.workspace

  # Environment-specific configurations
  env_config = {
    "staging-migration" = {
      db_instance_class       = "db.r6g.large"
      ecs_task_count          = 2
      ecs_task_cpu            = 1024
      ecs_task_memory         = 2048
      alb_deletion_protection = false
      db_backup_retention     = 7
    }
    "production-migration" = {
      db_instance_class       = "db.r6g.xlarge"
      ecs_task_count          = 4
      ecs_task_cpu            = 2048
      ecs_task_memory         = 4096
      alb_deletion_protection = true
      db_backup_retention     = 30
    }
  }

  current_env = lookup(local.env_config, local.environment, local.env_config["staging-migration"])

  common_tags = {
    Environment    = local.environment
    MigrationPhase = var.migration_phase
    CostCenter     = var.cost_center
    ManagedBy      = "terraform"
    Project        = "payment-migration"
  }

  # Resource naming with environment suffix
  name_prefix = "payment-${var.environment_suffix}"
}