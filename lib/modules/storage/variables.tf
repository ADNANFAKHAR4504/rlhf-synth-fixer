variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "prod-project-166"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "enable_encryption" {
  description = "Enable encryption for S3"
  type        = bool
  default     = true
}