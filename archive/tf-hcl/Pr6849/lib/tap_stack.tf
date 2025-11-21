# tap_stack.tf

# ===========================
# VARIABLES
# ===========================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

variable "alert_email_addresses" {
  description = "Email addresses for CloudWatch alarm notifications"
  type        = list(string)
  default     = []
}

variable "master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "master_password" {
  description = "Master password for Aurora database (minimum 8 characters)"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.master_password) >= 8
    error_message = "Master password must be at least 8 characters"
  }
}

# ===========================
# RESOURCES
# ===========================

# Primary region VPC module
module "vpc_primary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  region_name        = "primary"
  vpc_cidr           = "10.0.0.0/16"
  private_subnets = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# Secondary region VPC module
module "vpc_secondary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.secondary
  }

  environment_suffix = var.environment_suffix
  region_name        = "secondary"
  vpc_cidr           = "10.1.0.0/16"
  private_subnets = [
    "10.1.1.0/24",
    "10.1.2.0/24",
    "10.1.3.0/24"
  ]
  availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

# VPC Peering Connection
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider = aws.primary

  vpc_id      = module.vpc_primary.vpc_id
  peer_vpc_id = module.vpc_secondary.vpc_id
  peer_region = "us-west-2"
  auto_accept = false

  tags = {
    Name = "dr-payment-vpc-peering-${var.environment_suffix}"
  }
}

resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider = aws.secondary

  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = {
    Name = "dr-payment-vpc-peering-accepter-${var.environment_suffix}"
  }
}

# Aurora Global Database
module "aurora_global" {
  source = "./modules/aurora-global"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  environment_suffix        = var.environment_suffix
  global_cluster_identifier = "payment-dr-global-cluster-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "15.12"
  database_name             = "payments"
  master_username           = var.master_username
  master_password           = var.master_password

  # Primary cluster configuration
  primary_cluster_identifier = "payment-primary-cluster-${var.environment_suffix}"
  primary_instance_class     = "db.r5.large"
  primary_instance_count     = 2
  primary_subnet_ids         = module.vpc_primary.private_subnet_ids
  primary_security_group_id  = module.vpc_primary.aurora_security_group_id

  # Secondary cluster configuration
  secondary_cluster_identifier = "payment-secondary-cluster-${var.environment_suffix}"
  secondary_instance_class     = "db.r5.large"
  secondary_instance_count     = 1
  secondary_subnet_ids         = module.vpc_secondary.private_subnet_ids
  secondary_security_group_id  = module.vpc_secondary.aurora_security_group_id

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
}

# DynamoDB Global Table
module "dynamodb_global" {
  source = "./modules/dynamodb-global"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  environment_suffix = var.environment_suffix
  table_name         = "payment-sessions-${var.environment_suffix}"
  billing_mode       = "PAY_PER_REQUEST"
  hash_key           = "session_id"

  attributes = [
    {
      name = "session_id"
      type = "S"
    }
  ]

  replica_regions = ["us-east-1", "us-west-2"]
}

# IAM role for Lambda
module "lambda_iam_role" {
  source = "./modules/iam-lambda-role"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  role_name          = "payment-processor-lambda-role-${var.environment_suffix}"
  dynamodb_table_arn = module.dynamodb_global.table_arn
  aurora_cluster_arns = [
    module.aurora_global.primary_cluster_arn,
    module.aurora_global.secondary_cluster_arn
  ]
}

# Lambda functions in primary region
module "lambda_primary" {
  source = "./modules/lambda"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  function_name      = "payment-webhook-processor-primary-${var.environment_suffix}"
  handler            = "index.handler"
  runtime            = "nodejs18.x"
  memory_size        = 1024
  timeout            = 30

  source_path = "${path.module}/lambda/payment-processor"

  subnet_ids         = module.vpc_primary.private_subnet_ids
  security_group_ids = [module.vpc_primary.lambda_security_group_id]
  iam_role_arn       = module.lambda_iam_role.role_arn

  environment_variables = {
    AURORA_ENDPOINT     = module.aurora_global.primary_cluster_endpoint
    DYNAMODB_TABLE_NAME = module.dynamodb_global.table_name
  }
}

# Lambda functions in secondary region
module "lambda_secondary" {
  source = "./modules/lambda"

  providers = {
    aws = aws.secondary
  }

  environment_suffix = var.environment_suffix
  function_name      = "payment-webhook-processor-secondary-${var.environment_suffix}"
  handler            = "index.handler"
  runtime            = "nodejs18.x"
  memory_size        = 1024
  timeout            = 30

  source_path = "${path.module}/lambda/payment-processor"

  subnet_ids         = module.vpc_secondary.private_subnet_ids
  security_group_ids = [module.vpc_secondary.lambda_security_group_id]
  iam_role_arn       = module.lambda_iam_role.role_arn

  environment_variables = {
    AURORA_ENDPOINT     = module.aurora_global.secondary_cluster_endpoint
    DYNAMODB_TABLE_NAME = module.dynamodb_global.table_name
  }
}

# Route 53 Health Checks and Failover
module "route53_failover" {
  source = "./modules/route53"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  domain_name        = "payment-dr-${var.environment_suffix}.internal"

  primary_endpoint   = module.lambda_primary.function_url
  secondary_endpoint = module.lambda_secondary.function_url

  health_check_interval = 30
  health_check_timeout  = 10
  failure_threshold     = 3
}

# CloudWatch Alarms for primary Aurora cluster
module "cloudwatch_primary" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  cluster_identifier = module.aurora_global.primary_cluster_id
  alarm_prefix       = "dr-payment-primary-${var.environment_suffix}"
  region_name        = "primary"

  sns_topic_name  = "dr-payment-alerts-primary-${var.environment_suffix}"
  email_endpoints = var.alert_email_addresses
}

# CloudWatch Alarms for secondary Aurora cluster
module "cloudwatch_secondary" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.secondary
  }

  environment_suffix = var.environment_suffix
  cluster_identifier = module.aurora_global.secondary_cluster_id
  alarm_prefix       = "dr-payment-secondary-${var.environment_suffix}"
  region_name        = "secondary"

  sns_topic_name  = "dr-payment-alerts-secondary-${var.environment_suffix}"
  email_endpoints = var.alert_email_addresses
}

# ===========================
# OUTPUTS
# ===========================

output "environment_suffix" {
  description = "Environment suffix used for this deployment"
  value       = var.environment_suffix
}

output "primary_vpc_id" {
  description = "Primary region VPC ID"
  value       = module.vpc_primary.vpc_id
}

output "secondary_vpc_id" {
  description = "Secondary region VPC ID"
  value       = module.vpc_secondary.vpc_id
}

output "aurora_global_cluster_id" {
  description = "Aurora Global Database cluster identifier"
  value       = module.aurora_global.global_cluster_id
}

output "primary_aurora_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = module.aurora_global.primary_cluster_endpoint
  sensitive   = true
}

output "secondary_aurora_endpoint" {
  description = "Secondary Aurora cluster endpoint"
  value       = module.aurora_global.secondary_cluster_endpoint
  sensitive   = true
}

output "dynamodb_table_name" {
  description = "DynamoDB global table name"
  value       = module.dynamodb_global.table_name
}

output "primary_lambda_function_name" {
  description = "Primary Lambda function name"
  value       = module.lambda_primary.function_name
}

output "secondary_lambda_function_name" {
  description = "Secondary Lambda function name"
  value       = module.lambda_secondary.function_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.route53_failover.zone_id
}

output "route53_domain_name" {
  description = "Route 53 domain name for payment system"
  value       = module.route53_failover.domain_name
}

output "primary_sns_topic_arn" {
  description = "Primary region SNS topic ARN for alerts"
  value       = module.cloudwatch_primary.sns_topic_arn
}

output "secondary_sns_topic_arn" {
  description = "Secondary region SNS topic ARN for alerts"
  value       = module.cloudwatch_secondary.sns_topic_arn
}

output "lambda_iam_role_arn" {
  description = "IAM role ARN used by Lambda functions"
  value       = module.lambda_iam_role.role_arn
}

output "vpc_peering_connection_id" {
  description = "VPC peering connection ID between regions"
  value       = aws_vpc_peering_connection.primary_to_secondary.id
}

