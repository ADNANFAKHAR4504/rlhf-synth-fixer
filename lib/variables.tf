# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

variable "db_master_username" {
  description = "Master username for Aurora PostgreSQL"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora PostgreSQL - MUST be provided via environment variable or tfvars"
  type        = string
  sensitive   = true
  # ✅ SECURITY FIX: No default password - force users to provide secure passwords
}

variable "container_image" {
  description = "Container image for ECS tasks"
  type        = string
  default     = "nginx:latest"
}

variable "active_environment" {
  description = "Active environment for traffic routing (blue or green)"
  type        = string
  default     = "blue"

  validation {
    condition     = contains(["blue", "green"], var.active_environment)
    error_message = "active_environment must be either 'blue' or 'green'"
  }
}

variable "source_db_username" {
  description = "Username for source Oracle database"
  type        = string
  default     = "oracle_user"
  sensitive   = true
}

variable "source_db_password" {
  description = "Password for source Oracle database - MUST be provided via environment variable or tfvars"
  type        = string
  sensitive   = true
  # ✅ SECURITY FIX: No default password
}

variable "source_db_host" {
  description = "Hostname for source Oracle database"
  type        = string
  default     = "source-oracle.example.com"
}

variable "source_db_port" {
  description = "Port for source Oracle database"
  type        = number
  default     = 1521
}

variable "source_db_name" {
  description = "Database name for source Oracle"
  type        = string
  default     = "ORCL"
}

# ✅ NEW: RDS instance class variable for cost optimization
variable "rds_instance_class" {
  description = "RDS instance class - smaller for dev/test, larger for production"
  type        = string
  default     = "db.t4g.medium"
}

# ✅ NEW: VPC CIDR configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ✅ NEW: ECS task resource configuration
variable "ecs_task_cpu" {
  description = "CPU units for ECS task (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "ecs_task_memory" {
  description = "Memory in MB for ECS task"
  type        = number
  default     = 1024
}

# ✅ NEW: Enable Multi-AZ for production
variable "enable_multi_az_dms" {
  description = "Enable Multi-AZ for DMS replication instance (recommended for production)"
  type        = bool
  default     = false
}
