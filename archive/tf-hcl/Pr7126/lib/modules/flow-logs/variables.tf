variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "retention_days" {
  description = "Number of days before transitioning to Glacier"
  type        = number
  default     = 30
}

variable "vpc_configurations" {
  description = "List of VPC configurations for flow logs"
  type = list(object({
    vpc_id      = string
    vpc_name    = string
    environment = string
  }))
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
