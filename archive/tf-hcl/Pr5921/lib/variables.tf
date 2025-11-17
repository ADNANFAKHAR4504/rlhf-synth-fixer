variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid collisions"
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
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "payment-platform"
}

variable "ecs_task_count" {
  description = "Number of ECS tasks to run"
  type        = number
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "alb_health_check_interval" {
  description = "ALB health check interval in seconds"
  type        = number
  default     = 30
}

variable "s3_lifecycle_days" {
  description = "Days before transitioning S3 objects to IA"
  type        = number
  default     = 90
}
