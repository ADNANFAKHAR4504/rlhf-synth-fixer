locals {
  common_tags = {
    Environment = var.environment
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
    PRNumber    = var.pr_number
  }

  is_production = var.environment == "prod"

  # Resource naming prefix with PR number
  name_prefix = var.pr_number != "" ? "${var.environment}-${var.pr_number}" : var.environment
}

# AWS Secrets Manager - Create database password secret
resource "random_password" "db_password" {
  length  = 32
  special = true
  # Override characters to avoid issues with PostgreSQL
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_password" {
  name        = "payment-app/${var.environment}/db-pass"
  description = "Database password for ${var.environment} environment"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-pass"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    password = random_password.db_password.result
  })
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = local.common_tags
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

resource "aws_security_group" "app" {
  name_prefix = "${local.name_prefix}-app-sg"
  description = "Security group for application instances"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-sg"
  })
}

resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "PostgreSQL access from application instances only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  environment = local.name_prefix
  tags        = local.common_tags
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  environment                = local.name_prefix
  vpc_id                     = module.vpc.vpc_id
  public_subnet_ids          = module.vpc.public_subnet_ids
  security_group_id          = aws_security_group.alb.id
  enable_deletion_protection = var.enable_deletion_protection
  certificate_arn            = var.certificate_arn
  tags                       = local.common_tags
}

# Auto Scaling Group Module
module "asg" {
  source = "./modules/asg"

  environment          = local.name_prefix
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  security_group_id    = aws_security_group.app.id
  target_group_arn     = module.alb.target_group_arn
  instance_type        = var.ec2_instance_type
  instance_tenancy     = var.ec2_tenancy
  iam_instance_profile = aws_iam_instance_profile.ec2_instance.name
  kms_key_id           = aws_kms_key.ebs.arn
  min_size             = var.asg_min_size
  max_size             = var.asg_max_size
  desired_capacity     = var.asg_desired_capacity
  alb_dns              = module.alb.alb_dns_name
  s3_bucket            = module.s3.bucket_name
  rds_endpoint         = module.rds.endpoint
  db_name              = module.rds.database_name
  secret_name          = aws_secretsmanager_secret.db_password.name
  kms_rds_key_id       = aws_kms_key.rds.key_id
  kms_ebs_key_id       = aws_kms_key.ebs.key_id
  aws_region           = var.aws_region
  tags                 = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment                = local.name_prefix
  private_subnet_ids         = module.vpc.private_subnet_ids
  security_group_id          = aws_security_group.rds.id
  instance_class             = var.rds_instance_class
  db_username                = var.db_username
  db_password                = random_password.db_password.result
  kms_key_id                 = aws_kms_key.rds.arn
  enable_deletion_protection = var.enable_deletion_protection
  multi_az                   = local.is_production
  tags                       = local.common_tags
}