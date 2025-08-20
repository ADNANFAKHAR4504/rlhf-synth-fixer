# Primary AWS provider for general resources
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"

  default_tags {
    tags = local.common_tags
  }
}

locals {
  environment = "dev"
  owner       = "platform-team"

  common_tags = {
    Environment = local.environment
    Owner       = local.owner
    Project     = "multi-region-infrastructure"
    ManagedBy   = "terraform"
  }

  regions = {
    us_east_1      = { name = "us-east-1", cidr = "10.0.0.0/16" }
    eu_west_1      = { name = "eu-west-1", cidr = "10.1.0.0/16" }
    ap_southeast_1 = { name = "ap-southeast-1", cidr = "10.2.0.0/16" }
  }
}

# US East 1 Infrastructure
module "vpc_us_east_1" {
  source = "./modules/vpc"
  providers = {
    aws = aws.us_east_1
  }

  vpc_cidr    = local.regions.us_east_1.cidr
  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "iam_us_east_1" {
  source = "./modules/iam"
  providers = {
    aws = aws.us_east_1
  }

  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "compute_us_east_1" {
  source = "./modules/compute"
  providers = {
    aws = aws.us_east_1
  }

  environment           = local.environment
  region                = local.regions.us_east_1.name
  vpc_id                = module.vpc_us_east_1.vpc_id
  subnet_ids            = module.vpc_us_east_1.private_subnet_ids
  public_subnet_ids     = module.vpc_us_east_1.public_subnet_ids
  security_group_id     = module.vpc_us_east_1.web_security_group_id
  instance_profile_name = module.iam_us_east_1.ec2_instance_profile_name
  common_tags           = local.common_tags
}

module "database_us_east_1" {
  source = "./modules/database"
  providers = {
    aws = aws.us_east_1
  }

  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags

  # Database configuration
  is_primary                 = true
  private_subnet_ids         = module.vpc_us_east_1.private_subnet_ids
  database_security_group_id = module.vpc_us_east_1.database_security_group_id
}

module "logging_us_east_1" {
  source = "./modules/logging"
  providers = {
    aws = aws.us_east_1
  }

  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags
}

# =============================================================================
# OUTPUTS
# =============================================================================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc_us_east_1.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc_us_east_1.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc_us_east_1.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc_us_east_1.private_subnet_ids
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = module.vpc_us_east_1.internet_gateway_id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = module.vpc_us_east_1.web_security_group_id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = module.vpc_us_east_1.database_security_group_id
}

# IAM Outputs
output "ec2_instance_profile_name" {
  description = "EC2 instance profile name"
  value       = module.iam_us_east_1.ec2_instance_profile_name
}

output "ec2_role_arn" {
  description = "EC2 role ARN"
  value       = module.iam_us_east_1.ec2_role_arn
}

output "rds_monitoring_role_arn" {
  description = "RDS monitoring role ARN"
  value       = module.iam_us_east_1.rds_monitoring_role_arn
}

# Compute Outputs
output "launch_template_id" {
  description = "ID of the launch template"
  value       = module.compute_us_east_1.launch_template_id
}

output "launch_template_name" {
  description = "Name of the launch template"
  value       = module.compute_us_east_1.launch_template_name
}

output "autoscaling_group_id" {
  description = "ID of the autoscaling group"
  value       = module.compute_us_east_1.autoscaling_group_id
}

output "autoscaling_group_name" {
  description = "Name of the autoscaling group"
  value       = module.compute_us_east_1.autoscaling_group_name
}

output "load_balancer_id" {
  description = "ID of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_id
}

output "load_balancer_arn" {
  description = "ARN of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.compute_us_east_1.target_group_arn
}

output "target_group_name" {
  description = "Name of the target group"
  value       = module.compute_us_east_1.target_group_name
}

output "listener_arn" {
  description = "ARN of the load balancer listener"
  value       = module.compute_us_east_1.listener_arn
}

output "ami_id" {
  description = "ID of the Amazon Linux AMI used"
  value       = module.compute_us_east_1.ami_id
}

output "instance_type" {
  description = "Instance type used in the launch template"
  value       = module.compute_us_east_1.instance_type
}

# Database Outputs
output "database_instance_id" {
  description = "ID of the primary database instance"
  value       = module.database_us_east_1.database_instance_id
}

output "database_instance_arn" {
  description = "ARN of the primary database instance"
  value       = module.database_us_east_1.database_instance_arn
}

output "database_endpoint" {
  description = "Endpoint of the primary database instance"
  value       = module.database_us_east_1.database_endpoint
}

output "database_port" {
  description = "Port of the primary database instance"
  value       = module.database_us_east_1.database_port
}

output "database_name" {
  description = "Name of the primary database"
  value       = module.database_us_east_1.database_name
}

output "database_username" {
  description = "Username of the primary database"
  value       = module.database_us_east_1.database_username
}

output "database_identifier" {
  description = "Identifier of the primary database instance"
  value       = module.database_us_east_1.database_identifier
}

output "database_engine_version" {
  description = "Engine version of the database"
  value       = module.database_us_east_1.database_engine_version
}

output "database_instance_class" {
  description = "Instance class of the database"
  value       = module.database_us_east_1.database_instance_class
}

output "database_allocated_storage" {
  description = "Allocated storage of the database"
  value       = module.database_us_east_1.database_allocated_storage
}

output "database_encrypted" {
  description = "Whether the database storage is encrypted"
  value       = module.database_us_east_1.database_encrypted
}

output "subnet_group_id" {
  description = "ID of the database subnet group"
  value       = module.database_us_east_1.subnet_group_id
}

output "subnet_group_name" {
  description = "Name of the database subnet group"
  value       = module.database_us_east_1.subnet_group_name
}

output "parameter_group_id" {
  description = "ID of the database parameter group"
  value       = module.database_us_east_1.parameter_group_id
}

output "parameter_group_name" {
  description = "Name of the database parameter group"
  value       = module.database_us_east_1.parameter_group_name
}

output "ssm_parameter_name" {
  description = "Name of the SSM parameter storing the database password"
  value       = module.database_us_east_1.ssm_parameter_name
}

output "ssm_parameter_arn" {
  description = "ARN of the SSM parameter storing the database password"
  value       = module.database_us_east_1.ssm_parameter_arn
}

# Logging Outputs
output "application_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = module.logging_us_east_1.application_log_group_name
}

output "application_log_group_arn" {
  description = "ARN of the application CloudWatch log group"
  value       = module.logging_us_east_1.application_log_group_arn
}

output "rds_log_group_name" {
  description = "Name of the RDS CloudWatch log group"
  value       = module.logging_us_east_1.rds_log_group_name
}

output "rds_log_group_arn" {
  description = "ARN of the RDS CloudWatch log group"
  value       = module.logging_us_east_1.rds_log_group_arn
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = module.logging_us_east_1.dashboard_name
}

output "dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = module.logging_us_east_1.dashboard_arn
}

output "log_retention_days" {
  description = "Log retention period in days"
  value       = module.logging_us_east_1.log_retention_days
}

# Environment Information
output "environment" {
  description = "Environment name"
  value       = local.environment
}

output "region" {
  description = "Primary region"
  value       = local.regions.us_east_1.name
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# Summary Outputs
output "infrastructure_summary" {
  description = "Summary of the deployed infrastructure"
  value = {
    environment       = local.environment
    region            = local.regions.us_east_1.name
    vpc_id            = module.vpc_us_east_1.vpc_id
    vpc_cidr          = module.vpc_us_east_1.vpc_cidr_block
    public_subnets    = length(module.vpc_us_east_1.public_subnet_ids)
    private_subnets   = length(module.vpc_us_east_1.private_subnet_ids)
    load_balancer_dns = module.compute_us_east_1.load_balancer_dns_name
    database_endpoint = module.database_us_east_1.database_endpoint
    autoscaling_group = module.compute_us_east_1.autoscaling_group_name
    dashboard_name    = module.logging_us_east_1.dashboard_name
  }
}
