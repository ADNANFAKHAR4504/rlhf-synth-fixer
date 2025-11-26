variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  type        = string
  default     = null
}

variable "subnet_ids" {
  description = "List of subnet IDs for DB subnet group (used if db_subnet_group_name is null)"
  type        = list(string)
  default     = []
}

variable "vpc_security_group_ids" {
  description = "List of VPC security group IDs"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
  
  validation {
    condition = contains([
      "db.t3.micro", "db.t3.small", "db.t3.medium", "db.t3.large",
      "db.t3.xlarge", "db.t3.2xlarge", "db.m5.large", "db.m5.xlarge",
      "db.m5.2xlarge", "db.m5.4xlarge", "db.m5.8xlarge", "db.m5.12xlarge",
      "db.m5.16xlarge", "db.m5.24xlarge", "db.r5.large", "db.r5.xlarge"
    ], var.instance_class)
    error_message = "Instance class must be a valid RDS instance type."
  }
}

variable "engine_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0.42"
  
  validation {
    condition     = can(regex("^8\\.0\\.[0-9]+$", var.engine_version))
    error_message = "Engine version must be a valid MySQL 8.0.x version."
  }
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
  
  validation {
    condition     = var.allocated_storage >= 20 && var.allocated_storage <= 65536
    error_message = "Allocated storage must be between 20 and 65536 GB."
  }
}

variable "backup_retention" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
  
  validation {
    condition     = var.backup_retention >= 0 && var.backup_retention <= 35
    error_message = "Backup retention must be between 0 and 35 days."
  }
}

variable "multi_az" {
  description = "Enable multi-AZ deployment"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "webapp"
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_name)) && length(var.db_name) <= 64
    error_message = "Database name must start with a letter, contain only alphanumeric characters and underscores, and be max 64 characters."
  }
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_username)) && length(var.db_username) <= 16
    error_message = "Username must start with a letter, contain only alphanumeric characters and underscores, and be max 16 characters."
  }
}

variable "db_password" {
  description = "Database master password (if null, will be auto-generated)"
  type        = string
  default     = null
  sensitive   = true
  
  validation {
    condition = var.db_password == null || (
      length(var.db_password) >= 8 && 
      length(var.db_password) <= 128 &&
      can(regex("^[a-zA-Z0-9!#$%&*()_+=$${}<>:?-]*$", var.db_password))
    )
    error_message = "Password must be 8-128 characters and contain only allowed characters."
  }
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (if null, uses default)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}