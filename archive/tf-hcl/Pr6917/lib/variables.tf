variable "environment_suffix" {
  description = "Unique suffix for resource names to enable parallel deployments"
  type        = string
  default     = "dev-new"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for multi-region resources"
  type        = string
  default     = "eu-west-1"
}

variable "cloudwatch_log_retention_days" {
  description = "Retention period for CloudWatch Logs"
  type        = number
  default     = 90
}

variable "kms_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7
}

# Organizational Unit variables - COMMENTED OUT
# These variables have been disabled because AWS Organizations resources are commented out
#
# variable "security_ou_name" {
#   description = "Name for Security Organizational Unit"
#   type        = string
#   default     = "Security"
# }
#
# variable "production_ou_name" {
#   description = "Name for Production Organizational Unit"
#   type        = string
#   default     = "Production"
# }
#
# variable "development_ou_name" {
#   description = "Name for Development Organizational Unit"
#   type        = string
#   default     = "Development"
# }

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project    = "SecurityFramework"
    ManagedBy  = "Terraform"
    Compliance = "PCI-DSS"
  }
}
