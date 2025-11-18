variable "environment_suffix" {
  description = "Unique suffix for resource naming to support multiple environments"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "trusted_account_ids" {
  description = "List of AWS account IDs allowed to assume roles"
  type        = list(string)
  default     = []
}

variable "owner_tag" {
  description = "Owner tag for all resources"
  type        = string
  default     = "SecurityTeam"
}

variable "environment_tag" {
  description = "Environment tag for all resources"
  type        = string
  default     = "Production"
}

variable "cost_center_tag" {
  description = "Cost center tag for all resources"
  type        = string
  default     = "Security-001"
}
