# tap_stack.tf
# Multi-region resilient AWS infrastructure with failure recovery automation
# Modular architecture with Aurora Multi-AZ, Auto Scaling, and Load Balancer

# ============================================================================
# VARIABLES
# ============================================================================
variable "aws_region" {
  description = "Primary AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name for resource tagging"
  type        = string
  default     = "financial-app"
}

variable "db_master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora database"
  type        = string
  default     = "ChangeMe123456!" # Change this in production!
  sensitive   = true
}

variable "notification_email" {
  description = "Email address for notifications (optional)"
  type        = string
  default     = ""
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================================
# LOCAL VALUES
# ============================================================================

locals {
  name_prefix = "${var.app_name}-${var.environment}"

  common_tags = {
    Environment = var.environment
    Application = var.app_name
    ManagedBy   = "Terraform"
    Region      = var.aws_region
  }
}

# ============================================================================
# VPC MODULE
# ============================================================================

module "vpc" {
  source = "./modules/vpc"

  name_prefix           = local.name_prefix
  vpc_cidr              = "10.0.0.0/16"
  availability_zones    = slice(data.aws_availability_zones.available.names, 0, 2)
  private_subnet_count  = 2
  public_subnet_count   = 2
  database_subnet_count = 2
  enable_nat_gateway    = true
  nat_gateway_count     = 2

  tags = local.common_tags
}

# ============================================================================
# S3 MODULE
# ============================================================================

module "s3" {
  source = "./modules/s3"

  name_prefix         = local.name_prefix
  region              = var.aws_region
  primary_bucket_name = "${var.app_name}-data-${var.aws_region}-${data.aws_caller_identity.current.account_id}"
  cfn_bucket_name     = "${var.app_name}-cfn-templates-${data.aws_caller_identity.current.account_id}"
  enable_versioning   = true
  enable_lifecycle    = true

  tags = local.common_tags
}

# ============================================================================
# SNS MODULE
# ============================================================================

module "sns" {
  source = "./modules/sns"

  name_prefix    = local.name_prefix
  account_id     = data.aws_caller_identity.current.account_id
  email_endpoint = var.notification_email

  tags = local.common_tags
}

# ============================================================================
# IAM MODULE
# ============================================================================

module "iam" {
  source = "./modules/iam"

  name_prefix        = local.name_prefix
  region             = var.aws_region
  account_id         = data.aws_caller_identity.current.account_id
  primary_bucket_arn = module.s3.primary_bucket_arn
  sns_topic_arn      = module.sns.topic_arn

  tags = local.common_tags

  depends_on = [module.s3, module.sns]
}

# ============================================================================
# RDS AURORA MODULE (Multi-AZ)
# ============================================================================

module "rds" {
  source = "./modules/rds"

  name_prefix                 = local.name_prefix
  database_subnet_ids         = module.vpc.database_subnet_ids
  database_security_group_id  = module.vpc.database_security_group_id
  database_name               = "financialdb"
  master_username             = var.db_master_username
  master_password             = var.db_master_password
  engine_version              = "8.0.mysql_aurora.3.04.0"
  instance_class              = "db.t3.medium"
  instance_count              = 2 # Multi-AZ deployment
  availability_zones          = slice(data.aws_availability_zones.available.names, 0, 2)
  backup_retention_period     = 7
  skip_final_snapshot         = true
  deletion_protection         = false
  enable_performance_insights = false
  monitoring_interval         = 60
  monitoring_role_arn         = module.iam.rds_monitoring_role_arn

  tags = local.common_tags

  depends_on = [module.vpc, module.iam]
}

# ============================================================================
# CLOUDWATCH MODULE
# ============================================================================

module "cloudwatch" {
  source = "./modules/cloudwatch"

  name_prefix          = local.name_prefix
  lambda_function_name = module.lambda.function_name
  primary_bucket_name  = module.s3.primary_bucket_id
  sns_topic_arn        = module.sns.topic_arn
  alb_target_group_arn = module.compute.target_group_arn
  alb_arn_suffix       = module.compute.alb_arn_suffix

  tags = local.common_tags

  depends_on = [module.s3, module.sns, module.compute, module.lambda]
}

# ============================================================================
# EVENTBRIDGE MODULE
# ============================================================================

module "eventbridge" {
  source = "./modules/eventbridge"

  name_prefix         = local.name_prefix
  lambda_function_arn = module.lambda.function_arn
  schedule_expression = "rate(5 minutes)"

  tags = local.common_tags

  depends_on = [module.lambda]
}

# ============================================================================
# LAMBDA MODULE
# ============================================================================

module "lambda" {
  source = "./modules/lambda"

  function_name      = "${local.name_prefix}-failover-automation"
  lambda_role_arn    = module.iam.lambda_failover_role_arn
  primary_bucket_id  = module.s3.primary_bucket_id
  secondary_region   = var.secondary_region
  environment        = var.environment
  sns_topic_arn      = module.sns.topic_arn
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.vpc.lambda_security_group_id]
  timeout            = 300
  memory_size        = 512

  tags = local.common_tags

  depends_on = [module.iam, module.s3, module.sns, module.vpc]
}

# ============================================================================
# COMPUTE MODULE (Auto Scaling + Load Balancer)
# ============================================================================

module "compute" {
  source = "./modules/compute"

  name_prefix                  = local.name_prefix
  vpc_id                       = module.vpc.vpc_id
  public_subnet_ids            = module.vpc.public_subnet_ids
  private_subnet_ids           = module.vpc.private_subnet_ids
  alb_security_group_id        = module.vpc.alb_security_group_id
  web_server_security_group_id = module.vpc.web_server_security_group_id
  instance_profile_name        = module.iam.ec2_instance_profile_name
  instance_type                = "t3.micro"
  min_size                     = 2
  max_size                     = 6
  desired_capacity             = 2
  enable_deletion_protection   = false
  region                       = var.aws_region
  db_endpoint                  = module.rds.cluster_endpoint
  db_name                      = "financialdb"

  tags = local.common_tags

  depends_on = [module.vpc, module.iam, module.rds]
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_id" {
  description = "ID of the primary VPC"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = module.vpc.database_subnet_ids
}

output "primary_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = module.s3.primary_bucket_id
}

output "primary_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = module.s3.primary_bucket_arn
}

output "cloudformation_bucket_name" {
  description = "Name of the CloudFormation templates bucket"
  value       = module.s3.cfn_bucket_id
}

output "aurora_cluster_endpoint" {
  description = "Writer endpoint of Aurora cluster"
  value       = module.rds.cluster_endpoint
  sensitive   = true
}

output "aurora_reader_endpoint" {
  description = "Reader endpoint of Aurora cluster"
  value       = module.rds.cluster_reader_endpoint
  sensitive   = true
}

output "alb_dns_name" {
  description = "DNS name of Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "alb_url" {
  description = "URL to access the application"
  value       = "http://${module.compute.alb_dns_name}"
}

output "autoscaling_group_name" {
  description = "Name of Auto Scaling Group"
  value       = module.compute.autoscaling_group_name
}

output "lambda_function_name" {
  description = "Name of the failover Lambda function"
  value       = module.lambda.function_name
}

output "lambda_function_arn" {
  description = "ARN of the failover Lambda function"
  value       = module.lambda.function_arn
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge health check rule"
  value       = module.eventbridge.rule_name
}

output "cloudwatch_log_group_lambda" {
  description = "CloudWatch log group for Lambda function"
  value       = module.cloudwatch.lambda_log_group_name
}

output "cloudwatch_log_group_application" {
  description = "CloudWatch log group for application logs"
  value       = module.cloudwatch.application_log_group_name
}

output "sns_topic_arn" {
  description = "ARN of SNS topic for failover notifications"
  value       = module.sns.topic_arn
}

output "cloudwatch_alarms" {
  description = "CloudWatch alarm names"
  value       = module.cloudwatch.alarm_names
}

# ============================================================================
# ARCHITECTURE SUMMARY
# ============================================================================

output "architecture_summary" {
  description = "Summary of deployed architecture"
  value = {
    multi_az_database   = "Aurora MySQL with ${module.rds.cluster_identifier} deployed across multiple AZs"
    auto_scaling        = "ASG with ${module.compute.autoscaling_group_name} (min: 2, max: 6, desired: 2)"
    load_balancer       = "Application Load Balancer at ${module.compute.alb_dns_name}"
    failover_automation = "Lambda function ${module.lambda.function_name} monitoring every 5 minutes"
    high_availability   = "Multi-AZ VPC with NAT Gateways across 2 availability zones"
    primary_region      = "${var.aws_region}"
  }
}