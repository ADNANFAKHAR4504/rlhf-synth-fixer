# S3 Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "primary_bucket_name" {
  description = "Name of the primary data bucket"
  type        = string
}

variable "cfn_bucket_name" {
  description = "Name of the CloudFormation templates bucket"
  type        = string
}

variable "enable_versioning" {
  description = "Enable versioning for primary bucket"
  type        = bool
  default     = true
}

variable "enable_lifecycle" {
  description = "Enable lifecycle rules for primary bucket"
  type        = bool
  default     = true
}

variable "transition_to_ia_days" {
  description = "Number of days before transitioning to IA"
  type        = number
  default     = 90
}

variable "transition_to_glacier_days" {
  description = "Number of days before transitioning to Glacier"
  type        = number
  default     = 180
}

variable "expiration_days" {
  description = "Number of days before expiration"
  type        = number
  default     = 365
}

variable "noncurrent_version_expiration_days" {
  description = "Number of days before noncurrent version expiration"
  type        = number
  default     = 90
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

