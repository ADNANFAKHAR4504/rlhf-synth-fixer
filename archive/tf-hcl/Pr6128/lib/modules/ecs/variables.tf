variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "Public subnet IDs"
  type        = list(string)
}

variable "task_count" {
  description = "Number of ECS tasks"
  type        = number
}

variable "task_cpu" {
  description = "Task CPU units"
  type        = string
}

variable "task_memory" {
  description = "Task memory in MB"
  type        = string
}

variable "container_image" {
  description = "Container image URI"
  type        = string
}

variable "container_port" {
  description = "Container port"
  type        = number
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
}

variable "database_url" {
  description = "Database connection URL"
  type        = string
  sensitive   = true
}

variable "certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
  default     = ""
}

variable "health_check_bucket" {
  description = "S3 bucket containing health_check.py script"
  type        = string
}

variable "health_check_script_key" {
  description = "S3 key for health_check.py script"
  type        = string
  default     = "scripts/health_check.py"
}

variable "transaction_logs_bucket" {
  description = "S3 bucket for transaction logs"
  type        = string
}
