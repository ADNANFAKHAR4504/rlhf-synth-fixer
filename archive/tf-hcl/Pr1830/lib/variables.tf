# variables.tf
variable "staging_region" {
  description = "AWS region for staging"
  default     = "ap-south-1"
}

variable "production_region" {
  description = "AWS region for production"
  default     = "us-east-1"
}

variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "IaC - AWS Nova Model Breaking"
}

variable "environment_names" {
  description = "Environment names for provider configuration"
  type        = map(string)
  default = {
    staging    = "staging"
    production = "production"
  }
}
