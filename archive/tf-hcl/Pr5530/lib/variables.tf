# variables.tf

# General variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "fintech-startup"
}

variable "managed_by" {
  description = "Tool or team managing the infrastructure"
  type        = string
  default     = "terraform"
}

# Environment-specific configurations using locals and maps
locals {
  environment = terraform.workspace == "default" ? "dev" : terraform.workspace
  
  # Environment-specific CIDR blocks
  vpc_cidrs = {
    dev     = "10.0.0.0/16"
    staging = "10.1.0.0/16"
    prod    = "10.2.0.0/16"
  }
  
  # Environment-specific RDS instance classes
  rds_instance_classes = {
    dev     = "db.t3.micro"
    staging = "db.t3.small"
    prod    = "db.t3.micro"
  }
  
  # Environment-specific ECS scaling policies
  ecs_scaling = {
    dev = {
      min_capacity = 1
      max_capacity = 2
      desired_count = 1
    }
    staging = {
      min_capacity = 2
      max_capacity = 4
      desired_count = 2
    }
    prod = {
      min_capacity = 3
      max_capacity = 10
      desired_count = 3
    }
  }
  
  # Environment-specific log retention periods (in days)
  log_retention = {
    dev     = 7
    staging = 30
    prod    = 90
  }
  
  # Environment-specific RDS backup retention periods (in days)
  rds_backup_retention = {
    dev     = 1
    staging = 7
    prod    = 30
  }
  
  # Multi-AZ configuration for RDS
  rds_multi_az = {
    dev     = false
    staging = true
    prod    = true
  }
  
  # Common tags
  common_tags = {
    Environment = local.environment
    Project     = var.project_name
    ManagedBy   = var.managed_by
  }
  
  # Availability zones
  azs = ["${var.aws_region}a", "${var.aws_region}b"]
}

# Domain configuration
variable "domain_name" {
  description = "Base domain name for Route53 hosted zones"
  type        = string
  default     = "fintech-startup.local"
}

variable "container_image" {
  description = "Container image for the API service"
  type        = string
  default     = "nginx:latest"  # Replace with your actual container image
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 80
}

# Database configuration
variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "dbadmin"
}

# Existing Route53 hosted zone (if any)
variable "parent_hosted_zone_id" {
  description = "ID of the parent hosted zone (optional)"
  type        = string
  default     = null
}