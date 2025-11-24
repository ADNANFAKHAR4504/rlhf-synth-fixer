variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
  default     = "dev"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "Disaster recovery AWS region"
  type        = string
  default     = "us-west-2"
}

variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default = {
    Application = "payment-processing"
    CostCenter  = "finance-ops"
    ManagedBy   = "terraform"
  }
}

variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "dr_vpc_cidr" {
  description = "CIDR block for DR VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora database"
  type        = string
  default     = "ChangeMe123456!"
  sensitive   = true
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS task"
  type        = string
  default     = "256"
}

variable "ecs_task_memory" {
  description = "Memory for ECS task"
  type        = string
  default     = "512"
}

variable "container_image" {
  description = "Docker container image for payment application"
  type        = string
  default     = "nginx:latest"
}

variable "health_check_interval" {
  description = "Route53 health check interval in seconds"
  type        = number
  default     = 30
}

variable "replication_lag_threshold" {
  description = "Aurora replication lag threshold in seconds for alarms"
  type        = number
  default     = 30
}
