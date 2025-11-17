# Local variables
locals {
  current_env             = terraform.workspace == "default" ? "dev" : terraform.workspace
  health_check_bucket     = var.health_check_bucket != "" ? var.health_check_bucket : "payment-health-check-scripts"
  health_check_script_key = "scripts/health_check.py"
}

data "aws_caller_identity" "current" {}

# Core Infrastructure Module
module "core" {
  source = "./modules/core"

  environment          = local.current_env
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
  enable_nat_gateway   = var.enable_nat_gateway
  single_nat_gateway   = var.single_nat_gateway
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment           = local.current_env
  vpc_id                = module.core.vpc_id
  private_subnet_ids    = module.core.private_subnet_ids
  instance_class        = var.rds_instance_class
  db_name               = var.db_name
  db_username           = var.db_username
  allocated_storage     = var.rds_allocated_storage
  backup_retention      = var.rds_backup_retention
  multi_az              = var.rds_multi_az
  ecs_security_group_id = module.ecs.ecs_security_group_id
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  environment             = local.current_env
  vpc_id                  = module.core.vpc_id
  private_subnet_ids      = module.core.private_subnet_ids
  public_subnet_ids       = module.core.public_subnet_ids
  task_count              = var.ecs_task_count
  task_cpu                = var.ecs_task_cpu
  task_memory             = var.ecs_task_memory
  container_image         = "python:3.11-slim"
  container_port          = 8080
  health_check_path       = "/health"
  database_url            = module.rds.db_connection_string
  certificate_arn         = var.certificate_arn
  health_check_bucket     = local.health_check_bucket
  health_check_script_key = local.health_check_script_key
  transaction_logs_bucket = aws_s3_bucket.transaction_logs.id
}

# S3 Bucket for Transaction Logs
resource "aws_s3_bucket" "transaction_logs" {
  bucket = "payment-logs-${local.current_env}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "payment-logs-${local.current_env}"
    Environment = local.current_env
  }
}

resource "aws_s3_bucket_versioning" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  rule {
    id     = "retention-policy"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = var.s3_transition_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.s3_glacier_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.s3_expiration_days
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
