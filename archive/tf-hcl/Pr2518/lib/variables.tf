# Variables for AWS provider configuration

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# Uncomment these variables if using static credentials (not recommended for production)
# variable "aws_access_key_id" {
#   description = "AWS Access Key ID"
#   type        = string
#   sensitive   = true
# }

# variable "aws_secret_access_key" {
#   description = "AWS Secret Access Key"
#   type        = string
#   sensitive   = true
# }

# Uncomment this variable if using assume role
# variable "aws_assume_role_arn" {
#   description = "ARN of the AWS IAM role to assume"
#   type        = string
# }

# Environment-specific variables
variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Project   = "IAC-Test-Automations"
  }
}
