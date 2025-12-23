variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string
  default     = "dev"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "migration_phase" {
  description = "Current migration phase (setup, testing, cutover, complete)"
  type        = string
  default     = "setup"
}

variable "cost_center" {
  description = "Cost center tag for billing"
  type        = string
  default     = "engineering"
}

# VPC Configuration
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

# Aurora Configuration
variable "aurora_engine_version" {
  description = "Aurora PostgreSQL engine version (matching source PostgreSQL 13.x)"
  type        = string
  default     = "13.9"
}

variable "aurora_instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "aurora_instance_count" {
  description = "Number of Aurora instances (minimum 2 for Multi-AZ)"
  type        = number
  default     = 2
}

variable "aurora_master_username" {
  description = "Master username for Aurora cluster"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "aurora_master_password" {
  description = "Master password for Aurora cluster"
  type        = string
  sensitive   = true
  default     = "ChangeMe123!"
}

variable "aurora_database_name" {
  description = "Initial database name"
  type        = string
  default     = "inventory"
}

variable "aurora_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

variable "aurora_preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "aurora_preferred_maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# DMS Configuration
variable "dms_replication_instance_class" {
  description = "DMS replication instance class (sized for 500GB migration)"
  type        = string
  default     = "dms.c5.2xlarge"
}

variable "dms_allocated_storage" {
  description = "DMS replication instance storage in GB"
  type        = number
  default     = 500
}

variable "dms_source_endpoint_host" {
  description = "On-premises source database host"
  type        = string
  default     = "source-db.example.com"
}

variable "dms_source_endpoint_port" {
  description = "On-premises source database port"
  type        = number
  default     = 5432
}

variable "dms_source_database_name" {
  description = "Source database name"
  type        = string
  default     = "inventory"
}

variable "dms_source_username" {
  description = "Source database username"
  type        = string
  sensitive   = true
  default     = "dms_user"
}

variable "dms_source_password" {
  description = "Source database password"
  type        = string
  sensitive   = true
  default     = "ChangeMe123!"
}

# S3 Configuration
variable "s3_lifecycle_ia_transition_days" {
  description = "Days before transitioning to Infrequent Access"
  type        = number
  default     = 90
}

variable "s3_lifecycle_glacier_transition_days" {
  description = "Days before transitioning to Glacier"
  type        = number
  default     = 180
}

variable "s3_lifecycle_expiration_days" {
  description = "Days before expiring old versions"
  type        = number
  default     = 365
}

# CloudWatch Configuration
variable "alarm_replication_lag_threshold" {
  description = "Replication lag alarm threshold in seconds"
  type        = number
  default     = 300
}

variable "alarm_cpu_threshold" {
  description = "CPU utilization alarm threshold percentage"
  type        = number
  default     = 80
}

variable "alarm_email_endpoints" {
  description = "Email addresses for alarm notifications"
  type        = list(string)
  default     = []
}
