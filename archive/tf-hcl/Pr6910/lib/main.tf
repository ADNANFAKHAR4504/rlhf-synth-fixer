# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix          = "${local.name_prefix}-${var.environment_suffix}"
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  enable_nat_gateway   = true
  single_nat_gateway   = var.environment == "dev" ? true : false
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.common_tags
}

# IAM Roles Module
module "iam" {
  source = "./modules/iam"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  roles_config       = local.iam_roles

  tags = local.common_tags
}

# Aurora PostgreSQL Module
module "aurora" {
  source = "./modules/aurora"

  cluster_identifier      = local.resource_names.aurora_cluster
  engine_version          = "15"
  instance_class          = var.aurora_instance_class
  instance_count          = var.aurora_instance_count
  database_name           = "${var.project_name}_${var.environment}"
  master_username         = "dbadmin"
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [module.alb.alb_security_group_id]
  backup_retention_period = local.current_config.backup_retention
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = true
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.aurora.arn
  environment_suffix      = var.environment_suffix

  tags = local.common_tags
}

# KMS Key for Aurora Encryption
resource "aws_kms_key" "aurora" {
  description             = "KMS key for Aurora encryption - ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-kms-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "aurora" {
  name          = "alias/${local.name_prefix}-aurora-${var.environment_suffix}"
  target_key_id = aws_kms_key.aurora.key_id
}

# S3 Storage Module
module "storage" {
  source = "./modules/storage"

  bucket_names       = var.bucket_names
  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  enable_versioning  = true
  force_destroy      = true

  tags = local.common_tags
}

# Lambda Function Module
module "lambda" {
  source = "./modules/lambda"

  function_name      = local.resource_names.lambda
  handler            = "index.handler"
  runtime            = "python3.9"
  memory_size        = var.lambda_memory_size
  timeout            = var.lambda_timeout
  source_dir         = "${path.module}/lambda/data_processor"
  execution_role_arn = module.iam.lambda_execution_role_arn

  environment_variables = {
    ENVIRONMENT        = var.environment
    ENVIRONMENT_SUFFIX = var.environment_suffix
    DB_ENDPOINT        = module.aurora.cluster_endpoint
    DB_NAME            = module.aurora.database_name
    BUCKET_PREFIX      = "${var.project_name}-${var.environment}"
  }

  vpc_config = {
    subnet_ids         = module.vpc.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = local.common_tags
}

# Lambda Security Group
resource "aws_security_group" "lambda" {
  name_prefix = "${local.name_prefix}-lambda-${var.environment_suffix}"
  description = "Security group for Lambda functions"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  name               = "pp-${var.environment}-${var.environment_suffix}-alb"
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.public_subnet_ids
  security_group_ids = [aws_security_group.alb.id]
  environment_suffix = var.environment_suffix

  listener_rules = [
    {
      priority = 100
      conditions = [
        {
          path_pattern = ["/api/*"]
        }
      ]
      actions = [
        {
          type             = "forward"
          target_group_arn = module.alb.default_target_group_arn
        }
      ]
    }
  ]

  tags = local.common_tags
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP traffic"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Monitoring Module (CloudWatch + SNS)
module "monitoring" {
  source = "./modules/monitoring"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  log_retention_days = var.log_retention_days
  sns_topic_name     = local.resource_names.sns_topic

  alarm_email_endpoints = []

  tags = local.common_tags
}

# Parameter Store for Database Password
resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.project_name}/${var.environment}/${var.environment_suffix}/db/master-password"
  description = "Master password for Aurora cluster"
  type        = "SecureString"
  value       = random_password.db_password.result

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-password-${var.environment_suffix}"
  })
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# S3 Event Notification to Lambda
resource "aws_s3_bucket_notification" "data_processing" {
  bucket = module.storage.bucket_ids[0]

  lambda_function {
    lambda_function_arn = module.lambda.function_arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "incoming/"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = module.storage.bucket_arns[0]
}

# Data source for remote state (example for cross-environment reference)
# Commented out for QA deployment - bucket doesn't exist in test environment
# data "terraform_remote_state" "shared" {
#   backend   = "s3"
#   workspace = "shared"
#
#   config = {
#     bucket = "terraform-state-shared-${var.environment_suffix}"
#     key    = "shared/terraform.tfstate"
#     region = var.aws_region
#   }
# }
