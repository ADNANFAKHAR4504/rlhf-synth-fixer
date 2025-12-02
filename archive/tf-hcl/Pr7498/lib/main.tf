# main.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary region provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
      Workspace   = terraform.workspace
    }
  }
}

# Cross-region provider aliases for replication
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.environment
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
      Workspace   = terraform.workspace
    }
  }
}

provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = var.environment
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
      Workspace   = terraform.workspace
    }
  }
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = {
      Environment = var.environment
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
      Workspace   = terraform.workspace
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)

  common_tags = {
    Environment = var.environment
    CostCenter  = var.cost_center
    Project     = "multi-environment-infrastructure"
  }
}

# Networking module
module "networking" {
  source = "./modules/networking"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  vpc_cidr           = var.vpc_cidr
  availability_zones = local.availability_zones
  common_tags        = local.common_tags
}

# Application Load Balancer module
module "alb" {
  source = "./modules/alb"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  vpc_id             = module.networking.vpc_id
  subnet_ids         = module.networking.public_subnet_ids
  target_port        = var.container_port
  health_check_path  = var.health_check_path
  common_tags        = local.common_tags
}

# ECS Fargate module
module "ecs" {
  source = "./modules/ecs"

  environment           = var.environment
  environment_suffix    = var.environment_suffix
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.alb.alb_security_group_id
  target_group_arn      = module.alb.target_group_arn
  alb_listener_arn      = module.alb.alb_dns_name
  container_image       = var.container_image
  container_port        = var.container_port
  task_cpu              = var.task_cpu
  task_memory           = var.task_memory
  desired_count         = var.desired_count
  log_retention_days    = var.log_retention_days
  db_host               = "" # Will be provided via environment variable
  common_tags           = local.common_tags
}

# RDS Aurora module
module "rds" {
  source = "./modules/rds"

  environment           = var.environment
  environment_suffix    = var.environment_suffix
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  ecs_security_group_id = module.ecs.security_group_id
  database_name         = var.database_name
  master_username       = var.db_master_username
  master_password       = var.db_master_password
  instance_class        = var.db_instance_class
  instance_count        = var.db_instance_count
  common_tags           = local.common_tags
}

# S3 bucket for state management (created separately)
resource "aws_s3_bucket" "terraform_state" {
  bucket        = "terraform-state-bucket-${var.environment}-${var.environment_suffix}"
  force_destroy = true

  tags = merge(
    local.common_tags,
    {
      Name    = "terraform-state-bucket-${var.environment}-${var.environment_suffix}"
      Purpose = "Terraform state storage"
    }
  )

  lifecycle {
    precondition {
      condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", "terraform-state-bucket-${var.environment}-${var.environment_suffix}"))
      error_message = "S3 bucket name must be lowercase alphanumeric with hyphens."
    }
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-locks-${var.environment}-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(
    local.common_tags,
    {
      Name    = "terraform-locks-${var.environment}-${var.environment_suffix}"
      Purpose = "Terraform state locking"
    }
  )
}

# Remote state data source example (for sharing outputs between environments)
# Commented out to avoid hardcoded environment dependency
# data "terraform_remote_state" "shared" {
#   count   = var.environment != "dev" ? 1 : 0
#   backend = "s3"
#
#   config = {
#     bucket = "terraform-state-bucket-${var.shared_env}-${var.environment_suffix}"
#     key    = "infrastructure/terraform.tfstate"
#     region = var.aws_region
#   }
# }
