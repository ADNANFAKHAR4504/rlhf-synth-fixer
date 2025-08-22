variable "create_vpcs" {
  type        = bool
  description = "Whether to create VPC-dependent resources (controls counts for RDS)"
  default     = false
}

variable "primary_kms_key_arn" {
  type        = string
  description = "KMS key ARN for primary region RDS encryption"
}

variable "secondary_kms_key_arn" {
  type        = string
  description = "KMS key ARN for secondary region RDS encryption"
}

variable "primary_public_subnet_id" {
  type        = string
  description = "Primary region public subnet id"
  default     = null
}

variable "primary_private_subnet_id" {
  type        = string
  description = "Primary region private subnet id"
  default     = null
}

variable "secondary_public_subnet_id" {
  type        = string
  description = "Secondary region public subnet id"
  default     = null
}

variable "secondary_private_subnet_id" {
  type        = string
  description = "Secondary region private subnet id"
  default     = null
}

variable "primary_security_group_id" {
  type        = string
  description = "Primary region security group id"
  default     = null
}

variable "secondary_security_group_id" {
  type        = string
  description = "Secondary region security group id"
  default     = null
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "RDS master password"
  default     = ""
}

variable "resource_suffix" {
  type        = string
  description = "Suffix used to keep names stable across modules"
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to resources"
  default     = {}
}
