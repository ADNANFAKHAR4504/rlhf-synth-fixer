# variables.tf - Input variables for secure AWS infrastructure

########################
# General Configuration
########################

variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project for resource naming"
  type        = string
  default     = "secure-trainr859"
}

variable "environment" {
  description = "Environment tag for all resources"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner tag for all resources"
  type        = string
  default     = "iac-team"
}

########################
# Network Configuration
########################

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "allowed_ssh_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/16"] # Restrict to VPC only by default
}

########################
# S3 Configuration
########################

variable "s3_bucket_names" {
  description = "Names of S3 buckets to create"
  type        = list(string)
  default     = ["secure-data-bucket-trainr859", "logs-bucket-trainr859"]
}

variable "s3_force_destroy" {
  description = "Allow destruction of non-empty S3 buckets"
  type        = bool
  default     = false
}

########################
# RDS Configuration
########################

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS instance"
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0"
}

variable "db_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

########################
# CloudTrail Configuration
########################

variable "cloudtrail_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
  default     = "cloudtrail-logs-trainr859"
}

variable "cloudtrail_include_global_service_events" {
  description = "Include global service events in CloudTrail"
  type        = bool
  default     = true
}

variable "cloudtrail_is_multi_region_trail" {
  description = "Enable multi-region CloudTrail"
  type        = bool
  default     = true
}

########################
# CloudWatch Configuration
########################

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 30
}

variable "cpu_alarm_threshold" {
  description = "CPU utilization threshold for CloudWatch alarms"
  type        = number
  default     = 80
}

variable "disk_space_alarm_threshold" {
  description = "Disk space utilization threshold for CloudWatch alarms"
  type        = number
  default     = 85
}

########################
# AWS Config Configuration
########################

variable "config_delivery_frequency" {
  description = "AWS Config delivery frequency"
  type        = string
  default     = "TwentyFour_Hours"
  validation {
    condition = contains([
      "One_Hour", "Three_Hours", "Six_Hours",
      "Twelve_Hours", "TwentyFour_Hours"
    ], var.config_delivery_frequency)
    error_message = "Config delivery frequency must be a valid option."
  }
}

variable "use_existing_config_resources" {
  description = "Skip creating AWS Config delivery channel and configuration recorder (use when existing Config resources already exist in the account/region)"
  type        = bool
  default     = true
}

variable "enable_config_rules" {
  description = "Enable AWS Config rules for compliance monitoring"
  type        = bool
  default     = true
}

########################
# Common Tags
########################

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

########################
# Security Configuration
########################

variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = true
}

variable "mfa_age" {
  description = "Maximum age for MFA tokens in seconds"
  type        = number
  default     = 3600
}

variable "password_policy_minimum_length" {
  description = "Minimum password length for IAM users"
  type        = number
  default     = 14
}

variable "password_policy_max_age" {
  description = "Maximum password age in days"
  type        = number
  default     = 90
}

########################
# Session Manager Configuration
########################

variable "enable_session_manager" {
  description = "Enable AWS Systems Manager Session Manager for secure access"
  type        = bool
  default     = true
}

variable "session_manager_log_retention_days" {
  description = "CloudWatch log retention for Session Manager sessions"
  type        = number
  default     = 30
}

########################
# Secrets Manager Configuration
########################

variable "secrets_rotation_days" {
  description = "Number of days between automatic secret rotations"
  type        = number
  default     = 30
  validation {
    condition     = var.secrets_rotation_days >= 1 && var.secrets_rotation_days <= 365
    error_message = "Secrets rotation days must be between 1 and 365."
  }
}

variable "enable_automatic_rotation" {
  description = "Enable automatic rotation for secrets"
  type        = bool
  default     = true
}

variable "secrets_recovery_window_days" {
  description = "Number of days to retain deleted secrets before permanent deletion"
  type        = number
  default     = 7
  validation {
    condition     = var.secrets_recovery_window_days >= 7 && var.secrets_recovery_window_days <= 30
    error_message = "Recovery window must be between 7 and 30 days."
  }
}

########################
# Lambda Configuration
########################

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 60
  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds."
  }
}

variable "lambda_runtime" {
  description = "Runtime for Lambda functions"
  type        = string
  default     = "python3.9"
  validation {
    condition = contains([
      "python3.8", "python3.9", "python3.10", "python3.11"
    ], var.lambda_runtime)
    error_message = "Lambda runtime must be a supported Python version."
  }
}