terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Environment = var.environment
      CostCenter  = var.cost_center
      Project     = "DisasterRecovery"
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary region provider (us-west-2)
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      Environment = var.environment
      CostCenter  = var.cost_center
      Project     = "DisasterRecovery"
      ManagedBy   = "Terraform"
    }
  }
}

# KMS keys for encryption
resource "aws_kms_key" "primary" {
  provider    = aws.primary
  description = "KMS key for primary region encryption"

  enable_key_rotation = true

  tags = {
    Name    = "kms-key-primary-${var.environment_suffix}"
    DR-Role = "primary"
  }
}

resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/dr-primary-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_kms_key" "secondary" {
  provider    = aws.secondary
  description = "KMS key for secondary region encryption"

  enable_key_rotation = true

  tags = {
    Name    = "kms-key-secondary-${var.environment_suffix}"
    DR-Role = "secondary"
  }
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/dr-secondary-${var.environment_suffix}"
  target_key_id = aws_kms_key.secondary.key_id
}

# Secrets Manager for RDS credentials
module "secrets_manager" {
  source = "./modules/secrets"

  environment_suffix = var.environment_suffix
  environment        = var.environment
  cost_center        = var.cost_center

  db_master_username = var.db_master_username
  database_name      = var.database_name
  enable_rotation    = true
}

# SNS Topic for notifications
resource "aws_sns_topic" "alerts" {
  provider = aws.primary
  name     = "dr-alerts-${var.environment_suffix}"

  tags = {
    Name        = "sns-dr-alerts-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_sns_topic_subscription" "email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.sns_email
}

# Secondary region SNS Topic
resource "aws_sns_topic" "alerts_secondary" {
  provider = aws.secondary
  name     = "dr-alerts-${var.environment_suffix}"

  tags = {
    Name        = "sns-dr-alerts-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_sns_topic_subscription" "email_secondary" {
  provider  = aws.secondary
  topic_arn = aws_sns_topic.alerts_secondary.arn
  protocol  = "email"
  endpoint  = var.sns_email
}

# RDS Aurora Global Cluster
resource "aws_rds_global_cluster" "main" {
  provider                  = aws.primary
  global_cluster_identifier = "aurora-global-${var.environment_suffix}"
  engine                    = "aurora-mysql"
  engine_version            = "8.0.mysql_aurora.3.04.0"
  database_name             = var.database_name
  storage_encrypted         = true
}

# Primary region infrastructure
module "primary_region" {
  source = "./modules/region"

  providers = {
    aws = aws.primary
  }

  region             = var.primary_region
  environment_suffix = var.environment_suffix
  vpc_cidr           = var.primary_vpc_cidr
  availability_zones = var.primary_availability_zones
  kms_key_arn        = aws_kms_key.primary.arn
  is_primary         = true
  dr_role            = "primary"

  # RDS configuration
  global_cluster_identifier = aws_rds_global_cluster.main.id
  database_name             = var.database_name
  db_master_username        = var.db_master_username
  db_master_password        = module.secrets_manager.db_password
  db_instance_class         = var.db_instance_class

  # Lambda configuration
  lambda_runtime = var.lambda_runtime
  sns_email      = var.sns_email
  sns_topic_arn  = aws_sns_topic.alerts.arn
  db_secret_arn  = module.secrets_manager.secret_arn

  environment = var.environment
  cost_center = var.cost_center
}

# Secondary region infrastructure
module "secondary_region" {
  source = "./modules/region"

  providers = {
    aws = aws.secondary
  }

  region             = var.secondary_region
  environment_suffix = var.environment_suffix
  vpc_cidr           = var.secondary_vpc_cidr
  availability_zones = var.secondary_availability_zones
  kms_key_arn        = aws_kms_key.secondary.arn
  is_primary         = false
  dr_role            = "secondary"

  # RDS configuration
  global_cluster_identifier = aws_rds_global_cluster.main.id
  database_name             = var.database_name
  db_master_username        = var.db_master_username
  db_master_password        = module.secrets_manager.db_password
  db_instance_class         = var.db_instance_class

  # Lambda configuration
  lambda_runtime = var.lambda_runtime
  sns_email      = var.sns_email
  sns_topic_arn  = aws_sns_topic.alerts_secondary.arn
  db_secret_arn  = module.secrets_manager.secret_arn

  environment = var.environment
  cost_center = var.cost_center

  depends_on = [module.primary_region]
}

# S3 cross-region replication
module "s3_replication" {
  source = "./modules/s3"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  environment_suffix    = var.environment_suffix
  primary_kms_key_arn   = aws_kms_key.primary.arn
  secondary_kms_key_arn = aws_kms_key.secondary.arn

  environment = var.environment
  cost_center = var.cost_center
}

# Route 53 DNS failover
module "route53_failover" {
  source = "./modules/route53"

  providers = {
    aws = aws.primary
  }

  domain_name        = var.domain_name
  environment_suffix = var.environment_suffix

  primary_endpoint   = module.primary_region.alb_dns_name
  secondary_endpoint = module.secondary_region.alb_dns_name

  primary_alb_zone_id   = module.primary_region.alb_zone_id
  secondary_alb_zone_id = module.secondary_region.alb_zone_id

  health_check_interval = var.health_check_interval
  health_check_path     = var.health_check_path

  environment = var.environment
  cost_center = var.cost_center
}

# DynamoDB Global Tables for session state
module "dynamodb_global" {
  source = "./modules/dynamodb_global"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  environment_suffix = var.environment_suffix
  secondary_region   = var.secondary_region

  primary_kms_key_arn   = aws_kms_key.primary.arn
  secondary_kms_key_arn = aws_kms_key.secondary.arn
  sns_topic_arn         = aws_sns_topic.alerts.arn

  environment = var.environment
  cost_center = var.cost_center
}

# CloudWatch monitoring and alarms
module "cloudwatch_monitoring" {
  source = "./modules/cloudwatch"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  environment_suffix = var.environment_suffix

  primary_cluster_id   = module.primary_region.rds_cluster_id
  secondary_cluster_id = module.secondary_region.rds_cluster_id

  replication_lag_threshold = var.replication_lag_threshold
  sns_email                 = var.sns_email

  environment = var.environment
  cost_center = var.cost_center
}
