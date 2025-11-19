variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "is_primary" {
  description = "Whether this is the primary region"
  type        = bool
}

variable "dr_role" {
  description = "DR role (primary or secondary)"
  type        = string
}

variable "global_cluster_identifier" {
  description = "Aurora global cluster identifier"
  type        = string
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "db_master_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_master_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
}

variable "sns_email" {
  description = "Email for SNS notifications"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS Topic ARN for notifications"
  type        = string
  default     = ""
}

variable "db_secret_arn" {
  description = "ARN of the Secrets Manager secret for database credentials"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cost_center" {
  description = "Cost center tag"
  type        = string
}
