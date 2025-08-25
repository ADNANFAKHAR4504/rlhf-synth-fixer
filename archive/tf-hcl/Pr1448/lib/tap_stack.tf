########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging/production)"
  type        = string
  default     = "staging"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "myapp"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "default-cost-center"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "terraform-admin"
}

# Variables for SSL/TLS configuration (optional)
variable "domain_name" {
  description = "Domain name for SSL certificate (required for HTTPS)"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for DNS validation"
  type        = string
  default     = ""
}

# Database configuration variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0"
}

variable "allocated_storage" {
  description = "Allocated storage for RDS instance in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for RDS instance in GB"
  type        = number
  default     = 100
}

########################
# Data Sources
########################
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

########################
# Locals
########################
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    CostCenter  = var.cost_center
    Owner       = var.owner
    ManagedBy   = "Terraform"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }

  name_prefix = "${var.project_name}-${var.environment}"
}

########################
# Networking Module
########################
module "networking" {
  source             = "./modules/networking"
  name_prefix        = local.name_prefix
  common_tags        = local.common_tags
  environment        = var.environment
  availability_zones = data.aws_availability_zones.available.names
  vpc_cidr           = "10.0.0.0/16"
  az_count           = 3
}

########################
# IAM Module
########################
module "iam" {
  source = "./modules/iam"

  name_prefix = local.name_prefix
  common_tags = local.common_tags
}

########################
# Compute Module
########################
module "compute" {
  source = "./modules/compute"

  name_prefix           = local.name_prefix
  environment           = var.environment
  project_name          = var.project_name
  vpc_id                = module.networking.vpc_id
  vpc_cidr              = module.networking.vpc_cidr
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  instance_profile_name = module.iam.ec2_instance_profile_name
  ami_id                = data.aws_ami.amazon_linux_2.id
  instance_type         = "t3.micro"
  min_size              = 1
  max_size              = 10
  desired_capacity      = 1
  common_tags           = local.common_tags
}

########################
# Database Module
########################
module "database" {
  source                    = "./modules/database"
  name_prefix               = local.name_prefix
  common_tags               = local.common_tags
  vpc_id                    = module.networking.vpc_id
  vpc_cidr                  = module.networking.vpc_cidr
  db_subnet_group_name      = module.networking.db_subnet_group_name
  db_instance_class         = var.db_instance_class
  db_engine_version         = var.db_engine_version
  allocated_storage         = var.allocated_storage
  max_allocated_storage     = var.max_allocated_storage
  database_username         = "admin"
  database_name             = "myappdb"
  environment               = var.environment
  kms_key_arn               = "" # Database module will create its own KMS key if needed
  app_security_group_id     = module.compute.app_security_group_id
  bastion_security_group_id = "" # Optional - can be added later
  monitoring_role_arn       = module.iam.rds_monitoring_role_arn
}

########################
# SSL/TLS Module (Production only)
########################
module "ssl" {
  count  = var.environment == "production" && var.domain_name != "" ? 1 : 0
  source = "./modules/ssl"

  name_prefix                     = local.name_prefix
  common_tags                     = local.common_tags
  domain_name                     = var.domain_name
  route53_zone_id                 = var.route53_zone_id
  load_balancer_arn               = module.compute.load_balancer_arn
  target_group_arn                = module.compute.target_group_arn
  load_balancer_security_group_id = module.compute.load_balancer_security_group_id
}

########################
# Outputs
########################
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.networking.vpc_cidr
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = module.networking.database_subnet_ids
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.compute.load_balancer_dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = module.compute.load_balancer_zone_id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling group"
  value       = module.compute.autoscaling_group_name
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = module.iam.ec2_instance_profile_name
}

output "ec2_role_arn" {
  description = "ARN of the EC2 role"
  value       = module.iam.ec2_role_arn
}

output "autoscaling_role_arn" {
  description = "ARN of the Auto Scaling role"
  value       = module.iam.autoscaling_role_arn
}

output "database_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = module.database.database_endpoint
}

output "database_id" {
  description = "ID of the RDS instance"
  value       = module.database.database_id
}

output "database_password" {
  description = "The generated database password (sensitive)"
  value       = module.database.database_password
  sensitive   = true
}

output "ssm_parameter_name" {
  description = "SSM parameter name for the database password"
  value       = module.database.ssm_parameter_name
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for database encryption"
  value       = module.database.kms_key_arn
}

output "application_url" {
  description = "URL to access the application"
  value       = var.environment == "production" && var.domain_name != "" ? "https://${var.domain_name}" : "http://${module.compute.load_balancer_dns_name}"
}

# SSL/TLS outputs
output "ssl_certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = var.environment == "production" && var.domain_name != "" ? module.ssl[0].certificate_arn : null
}

# Additional outputs for integration tests
output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = module.compute.load_balancer_arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.compute.target_group_arn
}

output "ec2_role_name" {
  description = "Name of the EC2 role"
  value       = module.iam.ec2_role_name
}

output "autoscaling_role_name" {
  description = "Name of the Auto Scaling role"
  value       = module.iam.autoscaling_role_name
}

output "high_cpu_alarm_name" {
  description = "Name of the high CPU alarm"
  value       = module.compute.high_cpu_alarm_name
}

output "low_cpu_alarm_name" {
  description = "Name of the low CPU alarm"
  value       = module.compute.low_cpu_alarm_name
}
