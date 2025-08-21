########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

# Root level variables for common configuration
locals {
  env = terraform.workspace

  common_tags = {
    "Application": "multi-env",
    "Purpose": "rlhf"
    "ManagedBy": "HCL",
    "Owner": "Turing"
  }

  env_type = {
    default = "default"
    testing = "staging"
    development = "development"
    production = "production"
  }

  service = {
    default = "rlhf"
    testing = "rlhf"
    development = "rlhf"
    production = "rlhf"
  }

  resource = {
    default = "rlhfhcl"
    testing = "rlhfhcl"
    development = "rlhfhcl"
    production = "rlhfhcl"
  }
}
