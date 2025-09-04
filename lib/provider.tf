terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }

  backend "s3" {
    bucket               = "your-terraform-state-bucket" # Replace with your actual bucket name
    key                  = "tap-stack/terraform.tfstate"
    region               = "us-east-1"
    workspace_key_prefix = "workspaces"

    # State locking
    dynamodb_table = "terraform-state-lock"

    # Encryption
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = terraform.workspace
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "X"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "203.0.113.0/32" # Replace with your office IP

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
  default     = "changeme123!" # Use AWS Secrets Manager in production
  sensitive   = true
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

# Data sources
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# S3 bucket and DynamoDB table for Terraform state (create these manually first)
# Uncomment these resources if you want Terraform to manage the state backend resources
# 
# resource "aws_s3_bucket" "terraform_state" {
#   bucket = "your-terraform-state-bucket"
# }
# 
# resource "aws_s3_bucket_versioning" "terraform_state" {
#   bucket = aws_s3_bucket.terraform_state.id
#   versioning_configuration {
#     status = "Enabled"
#   }
# }
# 
# resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
#   bucket = aws_s3_bucket.terraform_state.id
#   rule {
#     apply_server_side_encryption_by_default {
#       sse_algorithm = "AES256"
#     }
#   }
# }
# 
# resource "aws_dynamodb_table" "terraform_state_lock" {
#   name         = "terraform-state-lock"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "LockID"
#   
#   attribute {
#     name = "LockID"
#     type = "S"
#   }
# }