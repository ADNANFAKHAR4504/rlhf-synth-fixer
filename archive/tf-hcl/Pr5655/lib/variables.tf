# variables.tf - Input variable definitions

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tap-fintech"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "cost_center" {
  description = "Cost center for resource tagging"
  type        = string
  default     = "engineering"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener (optional)"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for Route53 records (optional)"
  type        = string
  default     = ""
}

variable "health_check_path" {
  description = "Health check path for ALB target groups"
  type        = string
  default     = "/health"
}

variable "container_image_tag" {
  description = "Container image tag to deploy"
  type        = string
  default     = "latest"
}

variable "enable_https_redirect" {
  description = "Enable HTTP to HTTPS redirect"
  type        = bool
  default     = true
}

variable "enable_deletion_protection" {
  description = "Override deletion protection setting"
  type        = bool
  default     = null
}

variable "custom_vpc_cidr" {
  description = "Custom VPC CIDR block (overrides environment defaults)"
  type        = string
  default     = ""
}

variable "backup_retention_days" {
  description = "Override backup retention period"
  type        = number
  default     = null
  
  validation {
    condition = var.backup_retention_days == null || (var.backup_retention_days >= 1 && var.backup_retention_days <= 35)
    error_message = "Backup retention must be between 1 and 35 days."
  }
}

variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights"
  type        = bool
  default     = true
}

variable "enable_enhanced_monitoring" {
  description = "Enable RDS Enhanced Monitoring"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
  
  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch retention value."
  }
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights"
  type        = bool
  default     = true
}

variable "enable_execute_command" {
  description = "Enable ECS Exec for debugging"
  type        = bool
  default     = true
}

variable "enable_xray_tracing" {
  description = "Enable X-Ray tracing"
  type        = bool
  default     = true
}

variable "secrets_rotation_days" {
  description = "Automatic secrets rotation interval in days"
  type        = number
  default     = 30
  
  validation {
    condition     = var.secrets_rotation_days >= 1 && var.secrets_rotation_days <= 365
    error_message = "Secrets rotation must be between 1 and 365 days."
  }
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Environment-specific overrides
variable "ecs_cpu_override" {
  description = "Override ECS task CPU (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = null
  
  validation {
    condition = var.ecs_cpu_override == null || contains([256, 512, 1024, 2048, 4096], var.ecs_cpu_override)
    error_message = "ECS CPU must be one of: 256, 512, 1024, 2048, 4096."
  }
}

variable "ecs_memory_override" {
  description = "Override ECS task memory (512, 1024, 2048, 4096, 8192, 16384, 30720)"
  type        = number
  default     = null
}

variable "ecs_desired_count_override" {
  description = "Override ECS service desired count"
  type        = number
  default     = null
  
  validation {
    condition     = var.ecs_desired_count_override == null || var.ecs_desired_count_override >= 1
    error_message = "ECS desired count must be at least 1."
  }
}

variable "db_instance_class_override" {
  description = "Override RDS instance class"
  type        = string
  default     = ""
}

variable "enable_multi_az_override" {
  description = "Override Multi-AZ setting for RDS"
  type        = bool
  default     = null
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access ALB"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_waf" {
  description = "Enable AWS WAF for ALB"
  type        = bool
  default     = false
}

variable "waf_rate_limit" {
  description = "WAF rate limit per IP (requests per 5 minutes)"
  type        = number
  default     = 2000
}