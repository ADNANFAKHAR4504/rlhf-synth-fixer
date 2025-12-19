terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  backend "s3" {

  }
}

provider "aws" {
  region = "ap-southeast-1"

  default_tags {
    tags = {
      Environment = "production"
      Project     = "payment-processing"
      Compliance  = "pci-dss"
      Owner       = "platform-team"
      CostCenter  = "infrastructure"
    }
  }
}

provider "random" {}

# Variables
variable "environment" {
  description = "Environment name for resource naming"
  type        = string
  default     = "production"
}

variable "alert_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = "kanakatla.k@turing.com"
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}