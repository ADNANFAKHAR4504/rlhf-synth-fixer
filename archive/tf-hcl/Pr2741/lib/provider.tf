# Test-only provider configuration that doesn't require AWS credentials
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = ">= 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }
}

# AWS Provider configuration
provider "aws" {
  region = var.aws_region

  # Conditional configuration for testing vs deployment
  # If TERRAFORM_TEST_MODE is set, use fake credentials for unit tests
  # Otherwise use real credentials from environment or instance profile
  access_key                  = var.terraform_test_mode ? "test" : null
  secret_key                  = var.terraform_test_mode ? "test" : null
  skip_credentials_validation = var.terraform_test_mode
  skip_metadata_api_check     = var.terraform_test_mode
  skip_region_validation      = var.terraform_test_mode
  skip_requesting_account_id  = var.terraform_test_mode

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = terraform.workspace
      ManagedBy   = "Terraform"
    }
  }
} # Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "test-project"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "203.0.113.0/32"

  validation {
    condition     = can(cidrhost(var.allowed_ssh_cidr, 0))
    error_message = "The allowed_ssh_cidr must be a valid CIDR block."
  }
}

variable "sns_https_endpoint" {
  description = "HTTPS endpoint for SNS notifications"
  type        = string
  default     = "https://example.com/alerts"

  validation {
    condition     = startswith(var.sns_https_endpoint, "https://")
    error_message = "SNS endpoint must use HTTPS."
  }
}

variable "lambda_shutdown_schedule" {
  description = "Cron schedule for Lambda shutdown (8 PM IST = 14:30 UTC)"
  type        = string
  default     = "cron(30 14 * * ? *)"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  default     = "changeme123!"
  sensitive   = true
}

variable "terraform_test_mode" {
  description = "Enable test mode with fake AWS credentials"
  type        = bool
  default     = false
}

# Local values
locals {
  availability_zones = ["${var.aws_region}a", "${var.aws_region}b"]

  common_tags = {
    Project     = var.project_name
    Environment = terraform.workspace
    ManagedBy   = "Terraform"
  }
}

# Data sources - Using hardcoded AMI ID for testing to avoid API calls
locals {
  # Common Amazon Linux 2 AMI ID for us-east-1 - hardcoded for testing
  amazon_linux_ami_id = "ami-0c02fb55956c7d316"
}
