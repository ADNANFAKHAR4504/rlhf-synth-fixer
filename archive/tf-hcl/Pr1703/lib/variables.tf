variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = "synthtrainr901"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "application_name" {
  description = "Application name"
  type        = string
  default     = "myapp"
}

variable "bucket_names" {
  description = "List of S3 bucket names to create"
  type        = list(string)
  default     = ["storage", "logs", "backup"]
}