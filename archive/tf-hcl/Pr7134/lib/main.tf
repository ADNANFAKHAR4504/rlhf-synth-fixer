# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment_suffix   = var.environment_suffix
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment_suffix
      Module      = "vpc"
    }
  )
}

# Database Module
module "database" {
  source = "./modules/database"

  environment_suffix      = var.environment_suffix
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  rds_instance_class      = var.rds_instance_class
  backup_retention_period = var.rds_backup_retention_period
  aurora_instance_count   = var.aurora_instance_count

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment_suffix
      Module      = "database"
    }
  )
}

# Compute Module
module "compute" {
  source = "./modules/compute"

  environment_suffix  = var.environment_suffix
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  lambda_memory_size  = var.lambda_memory_size
  lambda_timeout      = var.lambda_timeout
  dynamodb_table_arn  = aws_dynamodb_table.main.arn
  dynamodb_table_name = aws_dynamodb_table.main.name

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment_suffix
      Module      = "compute"
    }
  )
}

# DynamoDB Table
resource "aws_dynamodb_table" "main" {
  name         = "app-data-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name            = "TimestampIndex"
    hash_key        = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment_suffix
      Name        = "app-data-${var.environment_suffix}"
    }
  )
}
