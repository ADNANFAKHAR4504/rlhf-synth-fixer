variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "allowed_s3_resources" {
  description = "List of S3 resource ARNs that ECS tasks can access"
  type        = list(string)
  default     = ["*"]
}
