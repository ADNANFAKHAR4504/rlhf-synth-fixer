# Variables for environment-specific configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}

# Environment-specific variable overrides
locals {
  # Environment-specific configurations
  env_config = {
    staging = {
      instance_type    = "t3.micro"
      min_size        = 1
      max_size        = 2
      desired_capacity = 1
      vpc_cidr        = "10.0.0.0/16"
    }
    production = {
      instance_type    = "t3.small"
      min_size        = 2
      max_size        = 6
      desired_capacity = 3
      vpc_cidr        = "10.1.0.0/16"
    }
  }
  
  # Current environment settings
  current_config = local.env_config[local.current_env.environment]
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  # Consistent environment variable naming
  env_name_prefix = local.name_prefix
  environment     = local.current_env.environment
  region         = local.current_env.region
  
  # VPC Configuration
  vpc_cidr = local.current_config.vpc_cidr
  
  # Availability Zones (using first 2 AZs in region)
  availability_zones = data.aws_availability_zones.available.names
  
  # Tags
  tags = local.common_tags
}

# Security Group Module
module "security_groups" {
  source = "./modules/security"
  
  # Consistent environment variable naming
  env_name_prefix = local.name_prefix
  environment     = local.current_env.environment
  
  # VPC ID from VPC module
  vpc_id = module.vpc.vpc_id
  
  # Tags
  tags = local.common_tags
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"
  
  # Consistent environment variable naming
  env_name_prefix = local.name_prefix
  environment     = local.current_env.environment
  
  # Network Configuration
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnet_ids
  
  # Security Groups
  security_group_ids = [module.security_groups.alb_security_group_id]
  
  # Tags
  tags = local.common_tags
}

# Auto Scaling Group Module
module "asg" {
  source = "./modules/asg"
  
  # Consistent environment variable naming
  env_name_prefix = local.name_prefix
  environment     = local.current_env.environment
  
  # Instance Configuration
  instance_type = local.current_config.instance_type
  
  # Auto Scaling Configuration
  min_size         = local.current_config.min_size
  max_size         = local.current_config.max_size
  desired_capacity = local.current_config.desired_capacity
  
  # Network Configuration
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  
  # Security Groups
  security_group_ids = [module.security_groups.ec2_security_group_id]
  
  # Load Balancer
  target_group_arn = module.alb.target_group_arn
  
  # Tags
  tags = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"
  
  # Consistent environment variable naming
  env_name_prefix = local.name_prefix
  environment     = local.current_env.environment
  
  # Database Configuration
  instance_class = local.current_env.environment == "production" ? "db.t3.small" : "db.t3.micro"
  
  # Network Configuration
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  
  # Security Groups
  security_group_ids = [module.security_groups.rds_security_group_id]
  
  # Tags
  tags = local.common_tags
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Outputs for sharing between environments and modules
output "environment_info" {
  description = "Environment configuration information"
  value = {
    workspace   = terraform.workspace
    environment = local.current_env.environment
    region      = local.current_env.region
    name_prefix = local.name_prefix
  }
}

output "vpc_info" {
  description = "VPC information for sharing"
  value = {
    vpc_id              = module.vpc.vpc_id
    vpc_cidr            = module.vpc.vpc_cidr
    public_subnet_ids   = module.vpc.public_subnet_ids
    private_subnet_ids  = module.vpc.private_subnet_ids
    internet_gateway_id = module.vpc.internet_gateway_id
  }
  sensitive = false
}

output "security_group_info" {
  description = "Security group information for sharing"
  value = {
    alb_security_group_id = module.security_groups.alb_security_group_id
    ec2_security_group_id = module.security_groups.ec2_security_group_id
    rds_security_group_id = module.security_groups.rds_security_group_id
  }
}

output "load_balancer_info" {
  description = "Load balancer information for sharing"
  value = {
    alb_dns_name     = module.alb.alb_dns_name
    alb_zone_id      = module.alb.alb_zone_id
    target_group_arn = module.alb.target_group_arn
  }
}

output "auto_scaling_info" {
  description = "Auto Scaling Group information for sharing"
  value = {
    asg_name = module.asg.asg_name
    asg_arn  = module.asg.asg_arn
  }
}

output "database_info" {
  description = "RDS database information for sharing"
  value = {
    db_endpoint = module.rds.db_endpoint
    db_port     = module.rds.db_port
  }
  sensitive = true
}

# Cross-environment shared outputs
output "shared_config" {
  description = "Configuration that can be shared across environments"
  value = {
    account_id      = data.aws_caller_identity.current.account_id
    region          = data.aws_region.current.name
    environment     = local.current_env.environment
    workspace       = terraform.workspace
    resource_prefix = local.name_prefix
    common_tags     = local.common_tags
  }
}

# Environment-specific endpoints for deployment processes
output "deployment_endpoints" {
  description = "Endpoints for deployment processes"
  value = {
    load_balancer_url = "https://${module.alb.alb_dns_name}"
    health_check_url  = "https://${module.alb.alb_dns_name}/health"
    environment       = local.current_env.environment
    region           = local.current_env.region
  }
}

# Resource counts for monitoring and cost tracking
output "resource_summary" {
  description = "Summary of deployed resources"
  value = {
    vpc_count                = 1
    subnet_count            = length(module.vpc.public_subnet_ids) + length(module.vpc.private_subnet_ids)
    security_group_count    = 3
    load_balancer_count     = 1
    auto_scaling_group_count = 1
    database_count          = 1
    environment             = local.current_env.environment
    region                  = local.current_env.region
  }
}