###################
# Tags
###################

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
  default = {
    Environment = "dev"
    Project     = "iac-test-automations"
    Owner       = "DevOps Team"
    ManagedBy   = "terraform"
    CostCenter  = "Engineering"
    Purpose     = "testing"
  }
}

###################
# General Variables
###################

variable "aws_region_primary" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_region_secondary" {
  description = "Secondary AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "DevOps Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "Engineering"
}

###################
# Networking Variables
###################

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

###################
# Application Variables
###################

variable "app_port" {
  description = "Port on which application runs"
  type        = number
  default     = 8080
}

variable "health_check_path" {
  description = "Health check path for load balancer"
  type        = string
  default     = "/health"
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.medium"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 3
}

###################
# Database Variables
###################

variable "db_engine" {
  description = "Database engine"
  type        = string
  default     = "mysql"
}

variable "db_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "8.0"
}

variable "db_family" {
  description = "Database parameter group family"
  type        = string
  default     = "mysql8.0"
}

variable "db_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Initial database storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum database storage in GB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.db_password) >= 8
    error_message = "Database password must be at least 8 characters long."
  }
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 3306
}

variable "db_backup_retention_period" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Database backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Database maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

###################
# Security Variables
###################

variable "kms_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7
  validation {
    condition     = var.kms_deletion_window >= 7 && var.kms_deletion_window <= 30
    error_message = "KMS deletion window must be between 7 and 30 days."
  }
}

###################
# Monitoring Variables
###################

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = false
}

###################
# Auto Scaling Variables
###################

variable "scale_up_threshold" {
  description = "CPU utilization threshold for scaling up"
  type        = number
  default     = 70
}

variable "scale_down_threshold" {
  description = "CPU utilization threshold for scaling down"
  type        = number
  default     = 30
}

variable "scale_up_cooldown" {
  description = "Cooldown period after scaling up (seconds)"
  type        = number
  default     = 300
}

variable "scale_down_cooldown" {
  description = "Cooldown period after scaling down (seconds)"
  type        = number
  default     = 300
}

###################
# CloudFront Variables
###################

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cloudfront_price_class)
    error_message = "Price class must be PriceClass_100, PriceClass_200, or PriceClass_All."
  }
}

variable "cloudfront_allowed_methods" {
  description = "Allowed HTTP methods for CloudFront"
  type        = list(string)
  default     = ["GET", "HEAD", "OPTIONS"]
}

variable "cloudfront_cached_methods" {
  description = "HTTP methods to cache in CloudFront"
  type        = list(string)
  default     = ["GET", "HEAD"]
}

###################
# Blue-Green Deployment Variables
###################

variable "enable_blue_green" {
  description = "Enable blue-green deployment"
  type        = bool
  default     = true
}

variable "blue_green_deployment_config" {
  description = "Configuration for blue-green deployment"
  type = object({
    blue_weight  = number
    green_weight = number
  })
  default = {
    blue_weight  = 100
    green_weight = 0
  }
  validation {
    condition     = var.blue_green_deployment_config.blue_weight + var.blue_green_deployment_config.green_weight == 100
    error_message = "Blue and green weights must sum to 100."
  }
}

variable "deployment_target" {
  description = "Current deployment target (blue or green)"
  type        = string
  default     = "blue"
  validation {
    condition     = contains(["blue", "green"], var.deployment_target)
    error_message = "Deployment target must be either 'blue' or 'green'."
  }
}

variable "waf_rate_limit" {
  description = "Number of requests allowed per 5-minute period per IP address"
  type        = number
  default     = 2000
}

variable "blue_green_deployment" {
  description = "Configuration for blue-green deployment"
  type = object({
    enabled = bool
    weights = object({
      blue  = number
      green = number
    })
  })
  default = {
    enabled = true
    weights = {
      blue  = 100
      green = 0
    }
  }

  validation {
    condition     = var.blue_green_deployment.weights.blue + var.blue_green_deployment.weights.green == 100
    error_message = "Blue and green weights must sum to 100."
  }
}

###################
# DNS Variables
###################

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "create_dns_zone" {
  description = "Create Route53 zone for domain"
  type        = bool
  default     = false
}

variable "create_zone" {
  description = "Whether to create Route53 zone (if false, it is assumed to exist)"
  type        = bool
  default     = false
}

variable "key_pair_name" {
  description = "Name of the EC2 key pair to use for instances"
  type        = string
}

# Load balancer names
variable "aws_lb" {
  description = "Map of load balancer names"
  type = object({
    app_us_east_1 = string
    app_eu_central_1 = string
  })
  default = {
    app_us_east_1 = "app-us-east-1"
    app_eu_central_1 = "app-eu-central-1"
  }
}