variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "alb_target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}

variable "task_cpu" {
  description = "ECS task CPU units"
  type        = string
}

variable "task_memory" {
  description = "ECS task memory in MB"
  type        = string
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
}

variable "cloudwatch_log_group_name" {
  description = "CloudWatch log group name"
  type        = string
}
