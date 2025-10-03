# Ideal Webhook Processor Infrastructure - Terraform HCL

Complete and improved Terraform infrastructure code for a production-ready webhook processing system deployed in us-east-2.

## Key Improvements
- Added environment suffix support for multi-environment deployments
- Simplified resource naming with shortened prefix to avoid AWS limits
- Enhanced IAM policies with least privilege principle
- Fixed Lambda deployment dependencies
- Added proper tagging and resource organization

## Infrastructure Code

### Provider Configuration
```hcl
# provider.tf
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

### Variables
```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "webhook-processor"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Suffix for environment to avoid resource conflicts"
  type        = string
  default     = ""
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 512
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "webhook-processor"
    ManagedBy   = "terraform"
  }
}
```

### Main Configuration
```hcl
# main.tf
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.id

  # Use environment suffix if provided, otherwise generate one
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : "default"
  # Shortened resource prefix to avoid AWS naming limits
  resource_prefix = "wh-${local.env_suffix}"

  common_tags = merge(
    var.tags,
    {
      Terraform         = "true"
      AccountId         = local.account_id
      Region            = local.region
      EnvironmentSuffix = local.env_suffix
    }
  )
}
```