variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for RDS"
  type        = list(string)
}

variable "database_security_group_id" {
  description = "Security group ID for RDS"
  type        = string
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "database_username" {
  description = "Database username"
  type        = string
  default     = "dbadmin"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage in GB"
  type        = number
  default     = 100
}

variable "is_primary" {
  description = "Whether this is a primary database instance"
  type        = bool
  default     = true
}

variable "source_db_identifier" {
  description = "Source database identifier for read replicas"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}

variable "kms_key_id" {
  description = "KMS key ID for database encryption"
  type        = string
  default     = ""
}
