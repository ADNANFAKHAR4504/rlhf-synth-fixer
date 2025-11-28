# IAM Module Variables

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "oidc_provider_arn" {
  description = "ARN of the OIDC provider for IRSA"
  type        = string
}

variable "oidc_provider_id" {
  description = "ID of the OIDC provider (without https://)"
  type        = string
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
