terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
  backend "s3" {

  }
}

provider "aws" {
  region = "ap-southeast-1"

  default_tags {
    tags = {
      Environment = "dev"
      Team        = "platform-engineering"
      CostCenter  = "engineering-ops"
      ManagedBy   = "terraform"
      Project     = "payment-observability"
    }
  }
}

variable "environment" {
  description = "Environment name for resource naming"
  type        = string
  default     = "dev"
}

variable "critical_alert_email" {
  description = "Email address for critical alerts"
  type        = string
  default     = "kanakatla.k@turing.com"
}

variable "warnings_alert_email" {
  description = "Email address for warning alerts"
  type        = string
  default     = "kanakatla.k@turing.com"
}