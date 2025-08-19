variable "environment" {
  description = "Environment name"
  type        = string
}

variable "service" {
  description = "Service name for naming convention"
  type        = string
  default     = "security"
}

variable "resource" {
  description = "Resource name for naming convention"
  type        = string
  default     = "kms"
}

variable "deletion_window_in_days" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}