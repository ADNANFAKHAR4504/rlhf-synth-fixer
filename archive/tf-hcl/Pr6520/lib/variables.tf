variable "environment_suffix" {
  description = "Unique suffix to append to resource names for environment isolation"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "container_image" {
  description = "Docker image for payment processor"
  type        = string
  default     = "nginx:latest" # Replace with actual payment processor image
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 8080
}

variable "task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 2048
}

variable "desired_count_blue" {
  description = "Desired number of tasks for blue environment"
  type        = number
  default     = 2
}

variable "desired_count_green" {
  description = "Desired number of tasks for green environment"
  type        = number
  default     = 0
}

variable "db_master_username" {
  description = "Master username for Aurora PostgreSQL"
  type        = string
  default     = "paymentadmin"
  sensitive   = true
}

variable "db_instance_class" {
  description = "Instance class for Aurora PostgreSQL"
  type        = string
  default     = "db.r5.large"
}

variable "db_backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "autoscaling_min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "autoscaling_max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "autoscaling_target_cpu" {
  description = "Target CPU utilization percentage for auto-scaling"
  type        = number
  default     = 70
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}
