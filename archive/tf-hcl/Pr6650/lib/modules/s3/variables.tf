variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "primary_kms_key_arn" {
  description = "KMS key ARN for primary region"
  type        = string
}

variable "secondary_kms_key_arn" {
  description = "KMS key ARN for secondary region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cost_center" {
  description = "Cost center tag"
  type        = string
}
