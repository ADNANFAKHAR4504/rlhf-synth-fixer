terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
  }
}

# Primary region provider
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Environment = var.environment
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
      Environment = var.environment
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

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

# Random string for unique resource naming
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

locals {
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : "dev"
  name_prefix        = "financial-app-${local.environment_suffix}-${random_string.suffix.result}"
}
