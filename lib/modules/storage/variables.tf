# modules/storage/variables.tf
variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "bucket_name_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "myapp"
}

variable "bucket_byte_length" {
  description = "Number of bytes for random bucket suffix"
  type        = number
  default     = 4
}

variable "encryption_algorithm" {
  description = "Server-side encryption algorithm"
  type        = string
  default     = "AES256"
}

variable "bucket_tags" {
  description = "Additional tags for S3 bucket"
  type        = map(string)
  default     = {}
}

variable "bucket_force_destroy" {
  description = "Whether to force destroy the bucket even if it contains objects"
  type        = bool
  default     = false
}
