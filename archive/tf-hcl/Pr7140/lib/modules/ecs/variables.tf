variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "region_name" {
  description = "Region name (primary or dr)"
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

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
  type        = list(string)
}

variable "container_image" {
  description = "Docker container image"
  type        = string
}

variable "task_cpu" {
  description = "CPU units for ECS task"
  type        = string
}

variable "task_memory" {
  description = "Memory for ECS task"
  type        = string
}

variable "db_endpoint" {
  description = "Database endpoint"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
