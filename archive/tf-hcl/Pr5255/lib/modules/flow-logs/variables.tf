variable "bucket_name" {
  description = "Name of S3 bucket for flow logs"
  type        = string
}

variable "name_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "vpc_configs" {
  description = "Map of VPC configurations"
  type = map(object({
    vpc_id      = string
    name_prefix = string
  }))
}

variable "transition_days" {
  description = "Days before transitioning to Glacier"
  type        = number
  default     = 30
}

variable "expiration_days" {
  description = "Days before expiring logs"
  type        = number
  default     = 365
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
