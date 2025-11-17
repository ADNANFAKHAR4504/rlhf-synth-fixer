variable "environment_suffix" {
  description = "Suffix for resource names to support multiple environments"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (for NAT gateways)"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "ecr_repository_urls" {
  description = "ECR repository URLs for each service"
  type = object({
    payment_service   = string
    auth_service      = string
    analytics_service = string
  })
  default = {
    payment_service   = "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/payment-service"
    auth_service      = "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/auth-service"
    analytics_service = "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/analytics-service"
  }
}

variable "container_image_tags" {
  description = "Image tags for each service"
  type = object({
    payment_service   = string
    auth_service      = string
    analytics_service = string
  })
  default = {
    payment_service   = "latest"
    auth_service      = "latest"
    analytics_service = "latest"
  }
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights"
  type        = bool
  default     = true
}

variable "task_cpu" {
  description = "CPU units for ECS tasks"
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Memory for ECS tasks in MiB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired number of tasks per service"
  type        = number
  default     = 2
}

variable "autoscaling_min_capacity" {
  description = "Minimum number of tasks for autoscaling"
  type        = number
  default     = 2
}

variable "autoscaling_max_capacity" {
  description = "Maximum number of tasks for autoscaling"
  type        = number
  default     = 10
}

variable "autoscaling_cpu_threshold" {
  description = "CPU utilization threshold for autoscaling"
  type        = number
  default     = 70
}

variable "autoscaling_memory_threshold" {
  description = "Memory utilization threshold for autoscaling"
  type        = number
  default     = 70
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 5
}

variable "health_check_healthy_threshold" {
  description = "Number of consecutive successful health checks"
  type        = number
  default     = 2
}

variable "health_check_unhealthy_threshold" {
  description = "Number of consecutive failed health checks"
  type        = number
  default     = 3
}
