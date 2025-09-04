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

variable "regions" {
  description = "List of AWS regions to deploy to"
  type        = list(string)
  default     = ["us-east-1", "eu-central-1"]
}

variable "region_config" {
  description = "Region specific configuration"
  type = map(object({
    name      = string
    code      = string
    shortname = string
  }))
  default = {
    us_east_1 = {
      name      = "us-east-1"
      code      = "use1"
      shortname = "use1"
    }
    eu_central_1 = {
      name      = "eu-central-1"
      code      = "euc1"
      shortname = "euc1"
    }
  }
}

variable "environment" {
  description = "Environment name (dev, stage, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "stage", "prod"], var.environment)
    error_message = "Environment must be dev, stage, or prod."
  }
}

variable "active_color" {
  description = "Active color for blue-green deployment (blue or green)"
  type        = string
  validation {
    condition     = contains(["blue", "green"], var.active_color)
    error_message = "Active color must be either blue or green."
  }
  default = "blue"
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

variable "vpc_config" {
  description = "VPC configuration for each region"
  type = map(object({
    cidr = string
    azs  = list(string)
  }))
  default = {
    "us-east-1" = {
      cidr = "10.0.0.0/16"
      azs  = ["us-east-1a", "us-east-1b", "us-east-1c"]
    }
    "eu-central-1" = {
      cidr = "10.1.0.0/16"
      azs  = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
    }
  }
  validation {
    condition     = alltrue([for k, v in var.vpc_config : can(cidrhost(v.cidr, 0))])
    error_message = "All VPC CIDRs must be valid IPv4 CIDR blocks."
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

variable "kms_config" {
  description = "Configuration for KMS keys"
  type = object({
    deletion_window_in_days = number
    enable_key_rotation     = bool
  })
  default = {
    deletion_window_in_days = 7
    enable_key_rotation     = true
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

variable "blue_green_deployment" {
  description = "Configuration for blue-green deployment"
  type = object({
    enabled      = bool
    active_color = string
    weights = object({
      blue  = number
      green = number
    })
  })
  default = {
    enabled      = true
    active_color = "blue"
    weights = {
      blue  = 100
      green = 0
    }
  }

  validation {
    condition     = var.blue_green_deployment.weights.blue + var.blue_green_deployment.weights.green == 100
    error_message = "Blue and green weights must sum to 100."
  }

  validation {
    condition     = contains(["blue", "green"], var.blue_green_deployment.active_color)
    error_message = "Active color must be either 'blue' or 'green'."
  }
}

variable "waf_rate_limit" {
  description = "Number of requests allowed per 5-minute period per IP address"
  type        = number
  default     = 2000
}

###################
# DNS Variables
###################

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "example.com" # Change this to your actual domain in tfvars
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

variable "key_name" {
  description = "EC2 Key Pair name for SSH access"
  type        = string
  default     = null
}

###################
# Auto Scaling Group Variables
###################

variable "asg_min_size" {
  description = "Minimum number of instances in the Auto Scaling Group"
  type        = number
  default     = 1
}

variable "asg_max_size" {
  description = "Maximum number of instances in the Auto Scaling Group"
  type        = number
  default     = 6
}

variable "asg_desired_capacity" {
  description = "Desired number of instances in the Auto Scaling Group"
  type        = number
  default     = 2
}

variable "asg_health_check_grace_period" {
  description = "Time after instance launch before checking health"
  type        = number
  default     = 300
}

variable "asg_health_check_type" {
  description = "Type of health check (EC2 or ELB)"
  type        = string
  default     = "ELB"
  validation {
    condition     = contains(["EC2", "ELB"], var.asg_health_check_type)
    error_message = "Health check type must be either EC2 or ELB."
  }
}

###################
# Network Access Variables
###################

variable "allowed_ingress_cidrs" {
  description = "List of CIDR blocks allowed for ingress"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

variable "security_group_rules" {
  description = "Security group rule descriptions"
  type = object({
    https_ingress = string
    http_ingress  = string
  })
  default = {
    https_ingress = "HTTPS from allowed CIDRs"
    http_ingress  = "HTTP from allowed CIDRs"
  }
}
