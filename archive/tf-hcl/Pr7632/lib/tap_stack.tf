# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name         = local.project_name
  environment          = local.environment
  region               = local.region
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway   = var.enable_nat_gateway
  common_tags          = local.common_tags
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  project_name       = local.project_name
  environment        = local.environment
  region             = local.region
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  task_cpu           = var.ecs_task_cpu
  task_memory        = var.ecs_task_memory
  desired_count      = var.ecs_desired_count
  common_tags        = local.common_tags
}

# RDS Aurora Global Database Module
module "rds_aurora_global" {
  source = "./modules/rds_aurora_global"

  project_name       = local.project_name
  environment        = local.environment
  region             = local.region
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  instance_class     = var.aurora_instance_class
  engine_version     = var.aurora_engine_version
  cluster_size       = var.aurora_cluster_size
  is_primary_region  = var.is_primary_region
  global_cluster_id  = var.aurora_global_cluster_id != "" ? var.aurora_global_cluster_id : null
  common_tags        = local.common_tags
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  project_name             = local.project_name
  environment              = local.environment
  region                   = local.region
  enable_replication       = var.s3_enable_replication
  replication_destinations = var.s3_replication_destinations
  common_tags              = local.common_tags
}

# Validation Module
module "validation" {
  source = "./modules/validation"

  workspace          = local.workspace
  aws_region         = var.aws_region
  environment_suffix = var.environment_suffix
  vpc_cidr           = var.vpc_cidr
  ecs_task_cpu       = var.ecs_task_cpu
  ecs_task_memory    = var.ecs_task_memory
}

# Removed complex remote state and drift detection logic
# Each workspace is independent and manages its own region/environment

# Comprehensive Outputs for Testing and Monitoring

# VPC Infrastructure Outputs
output "vpc_details" {
  description = "Complete VPC configuration details for testing"
  value = {
    vpc_id             = module.vpc.vpc_id
    vpc_arn            = "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:vpc/${module.vpc.vpc_id}"
    vpc_cidr           = module.vpc.vpc_cidr
    availability_zones = var.availability_zones
    public_subnet_ids  = module.vpc.public_subnet_ids
    private_subnet_ids = module.vpc.private_subnet_ids
    nat_gateway_ids    = module.vpc.nat_gateway_ids
    region             = var.aws_region
    environment        = var.environment_suffix
  }
}

output "networking_details" {
  description = "Network configuration for connectivity testing"
  value = {
    vpc_id               = module.vpc.vpc_id
    public_subnet_cidrs  = var.public_subnet_cidrs
    private_subnet_cidrs = var.private_subnet_cidrs
    availability_zones   = var.availability_zones
    nat_gateway_count    = length(module.vpc.nat_gateway_ids)
    subnet_distribution = {
      public_subnets  = length(module.vpc.public_subnet_ids)
      private_subnets = length(module.vpc.private_subnet_ids)
    }
  }
}

# ECS Infrastructure Outputs
output "ecs_details" {
  description = "ECS configuration details for application testing"
  value = {
    cluster_name        = module.ecs.cluster_name
    cluster_id          = module.ecs.cluster_id
    service_name        = module.ecs.service_name
    alb_dns_name        = module.ecs.alb_dns_name
    alb_url             = "http://${module.ecs.alb_dns_name}"
    task_definition_arn = module.ecs.task_definition_arn
    task_cpu            = module.ecs.task_cpu
    task_memory         = module.ecs.task_memory
    desired_count       = var.ecs_desired_count
  }
}

output "ecs_endpoints" {
  description = "ECS service endpoints for testing"
  value = {
    load_balancer_dns = module.ecs.alb_dns_name
    health_check_url  = "http://${module.ecs.alb_dns_name}/health"
    application_url   = "http://${module.ecs.alb_dns_name}"
    cluster_arn       = module.ecs.cluster_id
  }
}

# Aurora Database Outputs
output "aurora_details" {
  description = "Aurora database configuration details"
  value = {
    cluster_endpoint  = module.rds_aurora_global.cluster_endpoint
    reader_endpoint   = module.rds_aurora_global.reader_endpoint
    cluster_id        = module.rds_aurora_global.cluster_id
    global_cluster_id = module.rds_aurora_global.global_cluster_id
    instance_class    = module.rds_aurora_global.instance_class
    engine_version    = var.aurora_engine_version
    cluster_size      = var.aurora_cluster_size
    is_primary_region = var.is_primary_region
    port              = 3306
  }
  sensitive = true
}

output "database_connection_info" {
  description = "Database connection information for testing"
  value = {
    cluster_endpoint    = module.rds_aurora_global.cluster_endpoint
    reader_endpoint     = module.rds_aurora_global.reader_endpoint
    port                = 3306
    database_name       = "tapproddb"
    username            = "admin"
    password_secret_arn = var.is_primary_region ? "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${local.project_name}-${var.aws_region}-aurora-passwords-${var.environment_suffix}" : null
    connection_string   = "mysql://admin:<password>@${module.rds_aurora_global.cluster_endpoint}:3306/tapproddb"
  }
  sensitive = true
}

# S3 Storage Outputs
output "s3_details" {
  description = "S3 bucket configuration details"
  value = {
    bucket_name              = module.s3.bucket_name
    bucket_arn               = module.s3.bucket_arn
    bucket_region            = module.s3.bucket_region
    bucket_url               = "s3://${module.s3.bucket_name}"
    console_url              = "https://s3.console.aws.amazon.com/s3/buckets/${module.s3.bucket_name}"
    replication_enabled      = module.s3.replication_enabled
    replication_destinations = module.s3.replication_destinations
  }
}

output "storage_endpoints" {
  description = "Storage service endpoints for testing"
  value = {
    s3_bucket_name = module.s3.bucket_name
    s3_bucket_url  = "s3://${module.s3.bucket_name}"
    s3_console_url = "https://s3.console.aws.amazon.com/s3/buckets/${module.s3.bucket_name}"
    s3_region      = module.s3.bucket_region
  }
}

# Security and Access Outputs
output "security_details" {
  description = "Security configuration details for testing"
  value = {
    region              = var.aws_region
    account_id          = data.aws_caller_identity.current.account_id
    environment         = var.environment_suffix
    workspace           = local.workspace
    kms_key_arn         = var.is_primary_region ? "arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:alias/${local.project_name}-${var.aws_region}-aurora-${var.environment_suffix}" : null
    secrets_manager_arn = var.is_primary_region ? "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${local.project_name}-${var.aws_region}-aurora-passwords-${var.environment_suffix}" : null
  }
}

# Monitoring and Logging Outputs
output "monitoring_details" {
  description = "Monitoring and logging configuration for testing"
  value = {
    cloudwatch_log_group = "/ecs/${local.project_name}-${var.aws_region}-${var.environment_suffix}"
    log_group_arn        = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${local.project_name}-${var.aws_region}-${var.environment_suffix}"
    performance_insights = var.is_primary_region ? true : false
    enhanced_monitoring  = var.is_primary_region ? true : false
  }
}

# Testing and Validation Outputs
output "validation_status" {
  description = "Configuration validation status"
  value       = module.validation.validation_passed
}

output "testing_endpoints" {
  description = "All endpoints for comprehensive testing"
  value = {
    application = {
      alb_url          = "http://${module.ecs.alb_dns_name}"
      health_check_url = "http://${module.ecs.alb_dns_name}/health"
      cluster_name     = module.ecs.cluster_name
    }
    database = {
      write_endpoint = module.rds_aurora_global.cluster_endpoint
      read_endpoint  = module.rds_aurora_global.reader_endpoint
      port           = 3306
    }
    storage = {
      bucket_url  = "s3://${module.s3.bucket_name}"
      console_url = "https://s3.console.aws.amazon.com/s3/buckets/${module.s3.bucket_name}"
    }
    monitoring = {
      cloudwatch_logs = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups/log-group/$252Fecs$252F${local.project_name}-${var.aws_region}-${var.environment_suffix}"
    }
  }
}

# Resource Summary for Cost and Usage Tracking
output "resource_summary" {
  description = "Summary of deployed resources for cost tracking"
  value = {
    region             = var.aws_region
    environment        = var.environment_suffix
    workspace          = local.workspace
    vpc_count          = 1
    subnet_count       = length(var.public_subnet_cidrs) + length(var.private_subnet_cidrs)
    nat_gateway_count  = var.enable_nat_gateway ? length(var.availability_zones) : 0
    ecs_service_count  = 1
    ecs_task_count     = var.ecs_desired_count
    rds_cluster_count  = 1
    rds_instance_count = var.aurora_cluster_size
    s3_bucket_count    = 1
    deployment_time    = timestamp()
  }
}

# Data source for account ID
data "aws_caller_identity" "current" {}
