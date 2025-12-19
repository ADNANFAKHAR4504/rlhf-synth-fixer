terraform {
  required_version = ">= 0.14"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment and configure for production use
  # backend "s3" {
  #   bucket         = "${var.environment}-tf-state-bucket"
  #   key            = "${var.environment}/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "${var.environment}-tf-state-lock"
  #   encrypt        = true
  # }
}

# Variables for cross-account configuration
variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be one of: dev, test, prod."
  }
}

variable "account_ids" {
  description = "AWS Account IDs for each environment"
  type        = map(string)
  default = {
    dev  = "111111111111"
    test = "222222222222"
    prod = "333333333333"
  }
}

variable "assume_role_name" {
  description = "Name of the IAM role to assume in target accounts"
  type        = string
  default     = "TerraformDeploymentRole"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
}

variable "purpose" {
  description = "Purpose of the resources"
  type        = string
}

variable "ip_allowlist" {
  description = "List of IP CIDRs allowed for SSH/RDP/HTTP access"
  type        = list(string)
  default     = ["203.0.113.0/24"]
}

variable "s3_block_public_access" {
  description = "Enable S3 block public access"
  type        = bool
  default     = true
}

variable "tags_common" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Provider configuration - Manual testing with direct credentials (no role assumption)
provider "aws" {
  region = "us-east-1"

  # Role assumption completely disabled for manual testing
  # For production use, uncomment and configure assume_role block

  default_tags {
    tags = local.common_tags
  }
}

# Additional provider for ACM certificates (CloudFront requires us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  # Using direct credentials - assume_role disabled for testing
  # assume_role {
  #   role_arn = "arn:aws:iam::${var.account_ids[var.environment]}:role/${var.assume_role_name}"
  # }

  default_tags {
    tags = local.common_tags
  }
}

# Local values for naming and tagging
locals {
  common_tags = merge(
    var.tags_common,
    {
      Environment = var.environment
      Owner       = var.owner
      Purpose     = var.purpose
      ManagedBy   = "terraform"
    }
  )

  name_prefix = var.environment
}