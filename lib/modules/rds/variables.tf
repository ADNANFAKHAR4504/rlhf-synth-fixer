variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "secure-infrastructure"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
  default     = ""
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
  default     = []
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
  default     = "admin"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for database access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "monitoring_role_arn" {
  description = "IAM role ARN for RDS enhanced monitoring"
  type        = string
  default     = ""
}
