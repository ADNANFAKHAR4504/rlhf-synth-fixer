# Local variables
locals {
  current_env = terraform.workspace == "default" ? "dev" : terraform.workspace
}

# Data sources for shared resources
# ECR Repository - create in each environment with workspace-specific naming
resource "aws_ecr_repository" "payment_api" {
  name                 = "payment-api-${local.current_env}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "payment-api-${local.current_env}"
    Environment = local.current_env
  }
}

# Lifecycle policy for ECR
resource "aws_ecr_lifecycle_policy" "payment_api" {
  repository = aws_ecr_repository.payment_api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
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

  environment        = local.current_env
  vpc_id             = module.core.vpc_id
  private_subnet_ids = module.core.private_subnet_ids
  public_subnet_ids  = module.core.public_subnet_ids
  task_count         = var.ecs_task_count
  task_cpu           = var.ecs_task_cpu
  task_memory        = var.ecs_task_memory
  container_image    = "${aws_ecr_repository.payment_api.repository_url}:latest"
  container_port     = 8080
  health_check_path  = "/health"
  database_url       = module.rds.db_connection_string
  certificate_arn    = var.certificate_arn
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
