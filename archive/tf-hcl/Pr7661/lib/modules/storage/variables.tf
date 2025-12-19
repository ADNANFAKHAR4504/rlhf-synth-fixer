variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "enable_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
}

variable "lifecycle_days" {
  description = "Days before transitioning objects to cheaper storage"
  type        = number
}

variable "environment" {
  description = "Environment name"
  type        = string
}