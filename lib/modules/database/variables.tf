variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "vpc_id" {
  description = "VPC ID where the database will be created"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0"
  validation {
    condition     = contains(["8.0", "8.0.35", "8.0.34", "8.0.33", "8.0.32"], var.db_engine_version)
    error_message = "Engine version must be a valid MySQL 8.0 version."
  }
}

variable "allocated_storage" {
  description = "Allocated storage for RDS instance in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for RDS instance in GB"
  type        = number
  default     = 100
}

variable "database_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for database encryption"
  type        = string
  default     = ""
}

variable "app_security_group_id" {
  description = "Security group ID of the application instances"
  type        = string
}

variable "bastion_security_group_id" {
  description = "Security group ID of the bastion host (optional)"
  type        = string
  default     = ""
}

variable "monitoring_role_arn" {
  description = "ARN of the IAM role for RDS enhanced monitoring"
  type        = string
  default     = ""
}
