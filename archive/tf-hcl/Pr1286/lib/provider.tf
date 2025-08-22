terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Primary region provider
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Environment = local.environment_suffix
      Project     = "financial-app"
      ManagedBy   = "terraform"
    }
  }
}

# Secondary region provider for multi-region setup
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      Environment = local.environment_suffix
      Project     = "financial-app"
      ManagedBy   = "terraform"
    }
  }
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for multi-region setup"
  type        = string
  default     = "us-west-2"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Random string for unique resource naming
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Local values for consistent naming
locals {
  environment_suffix = var.environment_suffix
  name_prefix        = "financial-app-${local.environment_suffix}-${random_string.suffix.result}"
}
