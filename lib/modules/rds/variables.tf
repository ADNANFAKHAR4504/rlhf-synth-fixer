variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
}

variable "primary_subnet_ids" {
  description = "Primary region subnet IDs"
  type        = list(string)
}

variable "primary_db_sg_id" {
  description = "Primary database security group ID"
  type        = string
}

variable "primary_kms_key_arn" {
  description = "Primary KMS key ARN"
  type        = string
}

variable "instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "resource_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
}

# These variables are kept for compatibility but not used in simplified config
variable "secondary_region" {
  description = "Secondary AWS region (not used in simplified config)"
  type        = string
  default     = ""
}

variable "secondary_subnet_ids" {
  description = "Secondary region subnet IDs (not used in simplified config)"
  type        = list(string)
  default     = []
}

variable "secondary_db_sg_id" {
  description = "Secondary database security group ID (not used in simplified config)"
  type        = string
  default     = ""
}

variable "secondary_kms_key_arn" {
  description = "Secondary KMS key ARN (not used in simplified config)"
  type        = string
  default     = ""
}
