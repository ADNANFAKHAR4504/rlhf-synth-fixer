variable "aws_region" {
    default = "us-east-1"
}

locals {
  # Environment-specific configurations using lookup for maximum flexibility
  # This approach allows easy switching between environments and adding new ones
  
  # Instance configurations per environment
  instance_configs = {
    staging = {
      instance_type    = "t3.micro"
      min_size        = 1
      max_size        = 2
      desired_capacity = 1
      volume_size     = 20
    }
    production = {
      instance_type    = "t3.medium"
      min_size        = 2
      max_size        = 6
      desired_capacity = 3
      volume_size     = 50
    }
  }

  # Database configurations per environment
  db_configs = {
    staging = {
      instance_class    = "db.t3.micro"
      allocated_storage = 20
      backup_retention  = 7
      multi_az         = false
      deletion_protection = false
    }
    production = {
      instance_class    = "db.t3.medium"
      allocated_storage = 100
      backup_retention  = 30
      multi_az         = true
      deletion_protection = true
    }
  }

  # Network configurations per environment
  network_configs = {
    staging = {
      vpc_cidr = "10.0.0.0/16"
      public_subnets = [
        "10.0.1.0/24",
        "10.0.2.0/24"
      ]
      private_subnets = [
        "10.0.10.0/24",
        "10.0.20.0/24"
      ]
      database_subnets = [
        "10.0.30.0/24",
        "10.0.40.0/24"
      ]
    }
    production = {
      vpc_cidr = "10.1.0.0/16"
      public_subnets = [
        "10.1.1.0/24",
        "10.1.2.0/24",
        "10.1.3.0/24"
      ]
      private_subnets = [
        "10.1.10.0/24",
        "10.1.20.0/24",
        "10.1.30.0/24"
      ]
      database_subnets = [
        "10.1.40.0/24",
        "10.1.50.0/24",
        "10.1.60.0/24"
      ]
    }
  }

  # Current environment configuration using lookup
  # This is the key pattern - lookup(map, key, default) allows flexible environment switching
  current_instance_config = lookup(local.instance_configs, var.environment, local.instance_configs["staging"])
  current_db_config      = lookup(local.db_configs, var.environment, local.db_configs["staging"])
  current_network_config = lookup(local.network_configs, var.environment, local.network_configs["staging"])

  # Common tags applied to all resources
  common_tags = {
    Department  = var.department
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "Terraform"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }

  # Resource naming convention
  name_prefix = "${var.project}-${var.environment}"
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "department" {
  description = "Department name for tagging"
  type        = string
  default     = "Engineering"
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "WebApp"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}