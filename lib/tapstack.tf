# Data sources for shared resources
data "aws_ecr_repository" "payment_api" {
  name = "payment-api"
}

data "aws_caller_identity" "current" {}

# Core Infrastructure Module
module "core" {
  source = "./modules/core"

  environment          = terraform.workspace
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

  environment           = terraform.workspace
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

  environment        = terraform.workspace
  vpc_id             = module.core.vpc_id
  private_subnet_ids = module.core.private_subnet_ids
  public_subnet_ids  = module.core.public_subnet_ids
  task_count         = var.ecs_task_count
  task_cpu           = var.ecs_task_cpu
  task_memory        = var.ecs_task_memory
  container_image    = "${data.aws_ecr_repository.payment_api.repository_url}:latest"
  container_port     = 8080
  health_check_path  = "/health"
  database_url       = module.rds.db_connection_string
  certificate_arn    = var.certificate_arn
}

# S3 Bucket for Transaction Logs
resource "aws_s3_bucket" "transaction_logs" {
  bucket = "payment-logs-${terraform.workspace}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "payment-logs-${terraform.workspace}"
    Environment = terraform.workspace
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
