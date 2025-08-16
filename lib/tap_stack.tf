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

########################
# Data Sources
########################
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
  source = "./modules/networking"

  name_prefix = local.name_prefix
  vpc_cidr    = "10.0.0.0/16"
  az_count    = 3
  common_tags = local.common_tags
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
  desired_capacity      = 2
  common_tags           = local.common_tags
}

########################
# Database Module
########################
module "database" {
  source = "./modules/database"

  name_prefix             = local.name_prefix
  environment             = var.environment
  vpc_id                  = module.networking.vpc_id
  vpc_cidr                = module.networking.vpc_cidr
  db_subnet_group_name    = module.networking.db_subnet_group_name
  database_name           = "myappdb"
  database_username       = "admin"
  database_password       = "MyAppDB2024!" # Use AWS Secrets Manager in production
  db_instance_class       = "db.t3.micro"
  allocated_storage       = 20
  max_allocated_storage   = 100
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  common_tags             = local.common_tags
}

########################
# Outputs
########################
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
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
  value       = module.database.db_instance_endpoint
}

output "database_id" {
  description = "The RDS instance ID"
  value       = module.database.db_instance_id
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${module.compute.load_balancer_dns_name}"
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
