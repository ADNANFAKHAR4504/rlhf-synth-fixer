locals {
  # Region-specific availability zones
  region_azs = {
    "us-east-1" = ["us-east-1a", "us-east-1b", "us-east-1c"]
    "us-west-2" = ["us-west-2a", "us-west-2b", "us-west-2c"]
  }

  # Use provided AZs or default to region-specific ones
  effective_azs = length(var.availability_zones) > 0 ? var.availability_zones : local.region_azs[var.region]

  # Environment-specific configurations
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

  # Database configurations with MySQL 8.0.42
  db_configs = {
    staging = {
      instance_class              = "db.t3.micro"
      allocated_storage          = 20
      backup_retention           = 7
      multi_az                   = false
      deletion_protection        = false
      auto_minor_version_upgrade = true
      engine_version            = "8.0.42"
    }
    production = {
      instance_class              = "db.t3.medium"
      allocated_storage          = 100
      backup_retention           = 30
      multi_az                   = true
      deletion_protection        = true
      auto_minor_version_upgrade = false
      engine_version            = "8.0.42"
    }
  }
  
  
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

  # Current environment configurations using lookup
  current_instance_config = lookup(local.instance_configs, var.environment, local.instance_configs["staging"])
  current_db_config      = lookup(local.db_configs, var.environment, local.db_configs["staging"])
  current_network_config = lookup(local.network_configs, var.environment, local.network_configs["staging"])

  # Common tags
  common_tags = {
    Department  = var.department
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "Terraform"
    Region      = var.region
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }

  # Resource naming
  name_prefix = "${var.project}-${var.environment}"
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
  default = "staging"
}

variable "department" {
  description = "Department name for tagging"
  type        = string
  default     = "Engineering"
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "webapp"
}

variable "region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for cross-region deployments"
  type        = string
  default     = "us-west-2"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = []
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
  default     = "password"
  sensitive   = true
}