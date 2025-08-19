variable "environment" {
  description = "Environment name"
  type        = string
}

variable "service" {
  description = "Service name for naming convention"
  type        = string
  default     = "app"
}

variable "resource" {
  description = "Resource name for naming convention"
  type        = string
  default     = "access"
}


variable "s3_bucket_arn" {
  description = "S3 bucket ARN for policy"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}