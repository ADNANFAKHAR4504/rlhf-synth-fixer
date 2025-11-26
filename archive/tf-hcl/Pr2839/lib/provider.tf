terraform {
  required_version = ">= 0.14"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "owner" {
  description = "Resource owner"
  type        = string
  default     = "devops-team"
}

variable "purpose" {
  description = "Resource purpose"
  type        = string
  default     = "production-workload"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

provider "aws" {
  region = var.aws_region
  
  # Allow AWS credentials to be provided via environment variables:
  # AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN (optional)
  # Or via AWS CLI profile, IAM roles, etc.
  
  default_tags {
    tags = {
      Environment = "Production"
      Owner       = var.owner
      Purpose     = var.purpose
    }
  }

  # Skip credential validation if running in environments where 
  # AWS credentials might not be available (like some CI environments)
  # skip_credentials_validation = true  # Uncomment for testing only
  # skip_metadata_api_check     = true  # Uncomment for testing only
}