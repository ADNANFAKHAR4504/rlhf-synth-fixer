# ECR Module Variables

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
