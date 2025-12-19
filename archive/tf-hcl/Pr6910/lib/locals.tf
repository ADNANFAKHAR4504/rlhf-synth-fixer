locals {
  # Environment-specific configurations
  environment_config = {
    dev = {
      instance_type         = "t3.small"
      aurora_instance_class = "db.t3.medium"
      log_retention         = 7
      backup_retention      = 1
      multi_az              = false
    }
    staging = {
      instance_type         = "t3.medium"
      aurora_instance_class = "db.r6g.large"
      log_retention         = 30
      backup_retention      = 7
      multi_az              = true
    }
    prod = {
      instance_type         = "t3.large"
      aurora_instance_class = "db.r6g.xlarge"
      log_retention         = 90
      backup_retention      = 30
      multi_az              = true
    }
  }

  # Current environment configuration
  current_config = local.environment_config[var.environment]

  # Common naming prefix
  name_prefix = "${var.project_name}-${var.environment}"

  # Resource naming with environment suffix
  resource_names = {
    vpc            = "${local.name_prefix}-vpc-${var.environment_suffix}"
    aurora_cluster = "${local.name_prefix}-aurora-${var.environment_suffix}"
    alb            = "${local.name_prefix}-alb-${var.environment_suffix}"
    lambda         = "${local.name_prefix}-processor-${var.environment_suffix}"
    sns_topic      = "${local.name_prefix}-alerts-${var.environment_suffix}"
    log_group      = "/aws/${var.project_name}/${var.environment}/${var.environment_suffix}"
  }

  # Common tags
  common_tags = {
    Environment       = var.environment
    EnvironmentSuffix = var.environment_suffix
    Project           = var.project_name
    ManagedBy         = "Terraform"
    Workspace         = terraform.workspace
  }

  # IAM role configurations
  iam_roles = {
    lambda_execution = {
      name        = "${local.name_prefix}-lambda-exec-${var.environment_suffix}"
      description = "Lambda execution role for ${var.environment}"
    }
    ecs_task = {
      name        = "${local.name_prefix}-ecs-task-${var.environment_suffix}"
      description = "ECS task role for ${var.environment}"
    }
    rds_monitoring = {
      name        = "${local.name_prefix}-rds-mon-${var.environment_suffix}"
      description = "RDS enhanced monitoring role for ${var.environment}"
    }
  }
}
