variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple deployments"
  type        = string
  default     = ""
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
}

variable "services" {
  description = "Service configurations"
  type = map(object({
    cpu               = number
    memory            = number
    port              = number
    desired_count     = number
    health_check_path = string
  }))
  default = {
    web = {
      cpu               = 256
      memory            = 512
      port              = 3000
      desired_count     = 2
      health_check_path = "/health"
    }
    api = {
      cpu               = 512
      memory            = 1024
      port              = 8080
      desired_count     = 3
      health_check_path = "/api/health"
    }
    worker = {
      cpu               = 1024
      memory            = 2048
      port              = 0
      desired_count     = 2
      health_check_path = ""
    }
  }
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = map(number)
  default = {
    dev  = 7
    prod = 30
  }
}

variable "alb_arn" {
  description = "Existing ALB ARN"
  type        = string
}

variable "vpc_id" {
  description = "Existing VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Existing private subnet IDs"
  type        = list(string)
}