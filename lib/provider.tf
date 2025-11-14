terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {

  }
}

provider "aws" {
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "video-streaming"
      ManagedBy   = "terraform"
    }
  }
}

variable "environment" {
  type        = string
  description = "Environment name for resource naming"
  default     = "dev"
}

variable "db_master_username" {
  type        = string
  description = "Master username for Aurora database"
  default     = "admin"
}

variable "db_master_password" {
  type        = string
  description = "Master password for Aurora database"
  default     = "ChangeMe123!"
  sensitive   = true
}