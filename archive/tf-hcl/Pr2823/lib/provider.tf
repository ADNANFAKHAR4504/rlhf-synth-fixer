# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  # backend "s3" {}
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "test"
  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be one of: dev, test, prod."
  }
}

variable "environment_suffix" {
  description = "Suffix for resource names to ensure uniqueness across deployments"
  type        = string
  default     = ""
}

variable "assume_role_arn" {
  description = "ARN of the role to assume"
  type        = string
  default     = ""
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "test-user"
}

variable "purpose" {
  description = "Purpose of the resources"
  type        = string
  default     = "testing"
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  dynamic "assume_role" {
    for_each = var.assume_role_arn != "" ? [1] : []
    content {
      role_arn = var.assume_role_arn
    }
  }

  default_tags {
    tags = {
      Environment       = var.environment
      EnvironmentSuffix = var.environment_suffix
      Owner             = var.owner
      Purpose           = var.purpose
      ManagedBy         = "Terraform"
    }
  }
}
