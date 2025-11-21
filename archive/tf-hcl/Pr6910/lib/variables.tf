variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string

  validation {
    condition     = length(var.environment_suffix) >= 4 && length(var.environment_suffix) <= 16
    error_message = "Environment suffix must be between 4 and 16 characters."
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "payment-processing"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "aurora_instance_class" {
  description = "Aurora instance class"
  type        = string
}

variable "aurora_instance_count" {
  description = "Number of Aurora instances"
  type        = number
  default     = 2
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 300
}

variable "alb_instance_type" {
  description = "Instance type for ALB targets (if using EC2)"
  type        = string
  default     = "t3.micro"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "enable_config_rules" {
  description = "Enable AWS Config rules for drift detection"
  type        = bool
  default     = false
}

variable "enable_step_functions" {
  description = "Enable Step Functions for orchestration"
  type        = bool
  default     = false
}

variable "enable_eventbridge" {
  description = "Enable EventBridge for environment synchronization"
  type        = bool
  default     = false
}

variable "bucket_names" {
  description = "List of S3 bucket names (without suffix)"
  type        = list(string)
  default     = ["data-processing", "archive", "logs"]
}
