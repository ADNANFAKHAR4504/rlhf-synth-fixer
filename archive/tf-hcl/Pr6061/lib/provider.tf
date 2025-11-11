terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
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
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "production"
      Project     = "monitoring"
      ManagedBy   = "Terraform"
      Owner       = "DevOps"
    }
  }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "kanakatla.k@turing.com"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "adminuser"
}