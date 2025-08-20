variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}

variable "kms_key_main_arn" {
  description = "ARN of the main KMS key"
  type        = string
}

variable "kms_key_rds_arn" {
  description = "ARN of the RDS KMS key"
  type        = string
}

variable "db_subnet_ids" {
  description = "List of DB subnet IDs"
  type        = list(string)
}

variable "db_engine" {
  description = "DB engine"
  type        = string
}

variable "db_engine_version" {
  description = "DB engine version"
  type        = string
}

variable "db_instance_class" {
  description = "DB instance class"
  type        = string
}

variable "db_allocated_storage" {
  description = "DB allocated storage (GB)"
  type        = number
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_port" {
  description = "Database port"
  type        = number
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
}

variable "sg_db_id" {
  description = "ID of the DB security group"
  type        = string
}

variable "backup_retention_days" {
  description = "Backup retention in days"
  type        = number
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
}

variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights"
  type        = bool
}

variable "rds_monitoring_role_arn" {
  description = "ARN of the RDS monitoring role"
  type        = string
}

variable "logs_bucket_name" {
  description = "Name of the S3 bucket for logs"
  type        = string
}

variable "elb_service_account_arn" {
  description = "ARN of the ELB service account"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "aws_region_name" {
  description = "AWS region name"
  type        = string
}
