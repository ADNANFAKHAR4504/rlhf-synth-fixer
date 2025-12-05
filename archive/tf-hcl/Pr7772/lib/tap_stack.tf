module "vpc" {
  source = "./modules/vpc"

  project_name = local.project_name
  environment  = local.environment
  region       = local.region
  vpc_cidr     = var.vpc_cidr
  az_count     = var.az_count
  common_tags  = local.common_tags
}

# KMS Module
module "kms" {
  source = "./modules/kms"

  project_name = local.project_name
  environment  = local.environment
  region       = local.region
  common_tags  = local.common_tags
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  project_name = local.project_name
  environment  = local.environment
  region       = local.region
  company_name = var.company_name
  kms_key_arn  = module.kms.kms_key_arn
  common_tags  = local.common_tags

  enable_replication = var.environment == "staging"
  source_bucket_arn  = var.environment == "staging" ? data.aws_s3_bucket.prod_bucket[0].arn : null
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name      = local.project_name
  environment       = local.environment
  region            = local.region
  kms_key_arn       = module.kms.kms_key_arn
  s3_bucket_arn     = module.s3.s3_bucket_arn
  rds_resource_name = module.rds.db_instance_resource_id
  common_tags       = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  project_name            = local.project_name
  environment             = local.environment
  region                  = local.region
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  instance_class          = var.rds_instance_class
  allocated_storage       = var.rds_allocated_storage
  backup_retention_period = var.rds_backup_retention_period
  kms_key_id              = module.kms.kms_key_arn
  common_tags             = local.common_tags
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  project_name        = local.project_name
  environment         = local.environment
  region              = local.region
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  common_tags         = local.common_tags
  ssl_certificate_arn = var.ssl_certificate_arn
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  project_name           = local.project_name
  environment            = local.environment
  region                 = local.region
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  alb_target_group_arn   = module.alb.target_group_arn
  alb_security_group_id  = module.alb.alb_security_group_id
  ecs_task_role_arn      = module.iam.ecs_task_role_arn
  ecs_execution_role_arn = module.iam.ecs_execution_role_arn
  cpu                    = var.ecs_cpu
  memory                 = var.ecs_memory
  desired_count          = var.ecs_desired_count
  min_capacity           = var.ecs_min_capacity
  max_capacity           = var.ecs_max_capacity
  db_secret_arn          = module.rds.db_secret_arn
  common_tags            = local.common_tags
}

# SNS Module
module "sns" {
  source = "./modules/sns"

  project_name   = local.project_name
  environment    = local.environment
  region         = local.region
  email_endpoint = var.sns_email_endpoint
  kms_key_id     = module.kms.kms_key_arn
  common_tags    = local.common_tags
}

# CloudWatch Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  project_name            = local.project_name
  environment             = local.environment
  region                  = local.region
  ecs_cluster_name        = module.ecs.cluster_name
  ecs_service_name        = module.ecs.service_name
  rds_instance_id         = module.rds.db_instance_id
  alb_arn_suffix          = module.alb.alb_arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix
  sns_topic_arn           = module.sns.sns_topic_arn
  common_tags             = local.common_tags
}

# Data source for prod bucket (used for replication in staging)
data "aws_s3_bucket" "prod_bucket" {
  count  = var.environment == "staging" ? 1 : 0
  bucket = "${var.company_name}-payment-processor-prod-${local.region}"
}

# Outputs
# =============================================================================
# VPC Outputs
# =============================================================================
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = module.vpc.nat_gateway_ids
}

# =============================================================================
# ALB Outputs
# =============================================================================
output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.alb.alb_arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = module.alb.alb_zone_id
}

output "alb_target_group_arn" {
  description = "ARN of the ALB target group"
  value       = module.alb.target_group_arn
}

output "alb_security_group_id" {
  description = "Security group ID of the ALB"
  value       = module.alb.alb_security_group_id
}

output "alb_url" {
  description = "URL of the Application Load Balancer (HTTPS if certificate available, HTTP otherwise)"
  value       = module.alb.alb_url
}

output "ssl_enabled" {
  description = "Whether SSL/HTTPS is enabled for the ALB"
  value       = module.alb.ssl_enabled
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener (null if no SSL certificate)"
  value       = module.alb.https_listener_arn
}

# =============================================================================
# ECS Outputs
# =============================================================================
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = module.ecs.cluster_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.ecs.service_name
}

output "ecs_task_definition_arn" {
  description = "ARN of the ECS task definition"
  value       = module.ecs.task_definition_arn
}

output "ecs_security_group_id" {
  description = "Security group ID for ECS tasks"
  value       = module.ecs.ecs_security_group_id
}

# =============================================================================
# RDS Outputs
# =============================================================================
output "rds_endpoint" {
  description = "Connection endpoint for the RDS instance"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = module.rds.db_instance_id
}

output "rds_instance_resource_id" {
  description = "RDS instance resource ID"
  value       = module.rds.db_instance_resource_id
}

output "rds_secret_arn" {
  description = "ARN of the database password secret"
  value       = module.rds.db_secret_arn
  sensitive   = true
}

output "rds_security_group_id" {
  description = "Security group ID for the RDS instance"
  value       = module.rds.db_security_group_id
}

# =============================================================================
# S3 Outputs
# =============================================================================
output "s3_bucket_id" {
  description = "ID of the main S3 bucket"
  value       = module.s3.s3_bucket_id
}

output "s3_bucket_arn" {
  description = "ARN of the main S3 bucket"
  value       = module.s3.s3_bucket_arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = module.s3.s3_bucket_domain_name
}

# =============================================================================
# IAM Outputs
# =============================================================================
output "ecs_task_role_arn" {
  description = "ARN of ECS task role"
  value       = module.iam.ecs_task_role_arn
}

output "ecs_execution_role_arn" {
  description = "ARN of ECS execution role"
  value       = module.iam.ecs_execution_role_arn
}

output "monitoring_role_arn" {
  description = "ARN of monitoring role"
  value       = module.iam.monitoring_role_arn
}

# =============================================================================
# KMS Outputs
# =============================================================================
output "kms_key_id" {
  description = "ID of the KMS key"
  value       = module.kms.kms_key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = module.kms.kms_key_arn
}

output "kms_alias_arn" {
  description = "ARN of the KMS alias"
  value       = module.kms.kms_alias_arn
}

# =============================================================================
# SNS Outputs
# =============================================================================
output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = module.sns.sns_topic_arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic for alerts"
  value       = module.sns.sns_topic_name
}

# =============================================================================
# Environment and Common Outputs
# =============================================================================
output "environment" {
  description = "Environment name"
  value       = local.environment
}

output "project_name" {
  description = "Project name"
  value       = local.project_name
}

output "region" {
  description = "AWS region"
  value       = local.region
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# =============================================================================
# Testing and Integration Outputs
# =============================================================================
output "application_endpoint" {
  description = "Full endpoint URL for the application"
  value       = module.alb.alb_url
}

output "health_check_url" {
  description = "Health check endpoint URL"
  value       = "${module.alb.alb_url}/health"
}

output "security_group_summary" {
  description = "Summary of all security groups created"
  value = {
    alb_security_group_id = module.alb.alb_security_group_id
    ecs_security_group_id = module.ecs.ecs_security_group_id
    rds_security_group_id = module.rds.db_security_group_id
  }
}

output "resource_summary" {
  description = "Summary of all major resources for testing"
  value = {
    vpc_id           = module.vpc.vpc_id
    alb_dns_name     = module.alb.alb_dns_name
    ecs_cluster_name = module.ecs.cluster_name
    ecs_service_name = module.ecs.service_name
    rds_instance_id  = module.rds.db_instance_id
    s3_bucket_name   = module.s3.s3_bucket_id
    sns_topic_name   = module.sns.sns_topic_name
    environment      = local.environment
    region           = local.region
  }
}
