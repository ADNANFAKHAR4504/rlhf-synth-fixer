variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "database_subnet_ids" {
  description = "List of database subnet IDs"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "engine" {
  description = "RDS engine"
  type        = string
}

variable "engine_version" {
  description = "RDS engine version"
  type        = string
}

variable "allocated_storage" {
  description = "RDS allocated storage"
  type        = number
}

variable "backup_retention_period" {
  description = "RDS backup retention period"
  type        = number
}

variable "maintenance_window" {
  description = "RDS maintenance window"
  type        = string
}

variable "backup_window" {
  description = "RDS backup window"
  type        = string
}

variable "master_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID for RDS"
  type        = string
}
