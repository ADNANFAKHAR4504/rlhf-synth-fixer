variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to support parallel deployments"
  type        = string
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "multi-env-saas"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "route53_zone_name" {
  description = "Route53 hosted zone name (optional)"
  type        = string
  default     = ""
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "rds_backup_retention" {
  description = "RDS backup retention period in days"
  type        = number
}

variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = string
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = string
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
}

variable "cloudwatch_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}
