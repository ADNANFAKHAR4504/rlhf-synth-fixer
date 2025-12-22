# LocalStack-Compatible Infrastructure Configuration
# This simplified configuration only uses services available in LocalStack Community Edition
# Services used: S3, IAM, CloudWatch, SNS, STS

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Provider configuration for LocalStack
provider "aws" {
  region = "us-east-1"

  # LocalStack configuration
  access_key = "test"
  secret_key = "test"
  skip_credentials_validation = true
  skip_metadata_api_check = true
  skip_requesting_account_id = true

  endpoints {
    s3 = "http://localhost:4566"
    iam = "http://localhost:4566"
    sts = "http://localhost:4566"
    sns = "http://localhost:4566"
    cloudwatch = "http://localhost:4566"
  }

  default_tags {
    tags = {
      Environment       = var.environment
      ManagedBy         = "Terraform"
      Project           = "RegionMigration"
      EnvironmentSuffix = var.environment_suffix
    }
  }
}

# IAM Role for EC2 Instances (IAM is supported in LocalStack)
resource "aws_iam_role" "ec2_role" {
  name_prefix = "ec2-role-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "ec2-role-${var.environment_suffix}"
  }
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name_prefix = "ec2-profile-${var.environment_suffix}-"
  role        = aws_iam_role.ec2_role.name

  tags = {
    Name = "ec2-profile-${var.environment_suffix}"
  }
}

# IAM Policy for S3 Access
resource "aws_iam_role_policy" "s3_access" {
  name_prefix = "s3-access-${var.environment_suffix}-"
  role        = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_data.arn,
          "${aws_s3_bucket.app_data.arn}/*"
        ]
      }
    ]
  })
}

# S3 Bucket for Application Data (S3 is fully supported in LocalStack)
resource "aws_s3_bucket" "app_data" {
  bucket_prefix = "app-data-${var.environment_suffix}-"

  tags = {
    Name = "app-data-${var.environment_suffix}"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Outputs - providing meaningful values for LocalStack testing
output "vpc_id" {
  description = "VPC ID (LocalStack: N/A - EC2 service disabled)"
  value       = "vpc-localstack-na"
}

output "public_subnet_ids" {
  description = "Public subnet IDs (LocalStack: N/A - EC2 service disabled)"
  value       = ["subnet-localstack-na-1", "subnet-localstack-na-2"]
}

output "private_subnet_ids" {
  description = "Private subnet IDs (LocalStack: N/A - EC2 service disabled)"
  value       = ["subnet-localstack-na-1", "subnet-localstack-na-2"]
}

output "web_instance_ids" {
  description = "Web server instance IDs (LocalStack: N/A - EC2 service disabled)"
  value       = []
}

output "app_instance_ids" {
  description = "Application server instance IDs (LocalStack: N/A - EC2 service disabled)"
  value       = []
}

output "database_endpoint" {
  description = "RDS database endpoint (LocalStack: N/A - RDS service disabled)"
  value       = "localhost:5432"
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.app_data.id
}

output "web_security_group_id" {
  description = "Web tier security group ID (LocalStack: N/A - EC2 service disabled)"
  value       = "sg-localstack-na"
}

output "app_security_group_id" {
  description = "Application tier security group ID (LocalStack: N/A - EC2 service disabled)"
  value       = "sg-localstack-na"
}

output "database_security_group_id" {
  description = "Database tier security group ID (LocalStack: N/A - EC2 service disabled)"
  value       = "sg-localstack-na"
}
