variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment type (test or prod)"
  type        = string
  default     = "test"
  validation {
    condition     = contains(["test", "prod"], var.environment)
    error_message = "Environment must be test or prod"
  }
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "DR AWS region"
  type        = string
  default     = "us-west-2"
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

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
}

variable "replication_lag_threshold" {
  description = "Replication lag threshold in seconds for failover"
  type        = number
  default     = 60
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}
