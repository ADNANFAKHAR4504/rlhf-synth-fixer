terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # LocalStack configuration - uses dummy credentials for local testing only
  # These are standard LocalStack placeholder values, not real AWS credentials
  access_key                  = var.aws_access_key
  secret_key                  = var.aws_secret_key
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  # S3-specific LocalStack configuration
  s3_use_path_style = true

  # LocalStack endpoints
  endpoints {
    apigateway     = "http://localhost:4566"
    cloudformation = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    dynamodb       = "http://localhost:4566"
    ec2            = "http://localhost:4566"
    es             = "http://localhost:4566"
    elasticache    = "http://localhost:4566"
    firehose       = "http://localhost:4566"
    iam            = "http://localhost:4566"
    kinesis        = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    rds            = "http://localhost:4566"
    redshift       = "http://localhost:4566"
    route53        = "http://localhost:4566"
    s3             = "http://localhost:4566"
    secretsmanager = "http://localhost:4566"
    ses            = "http://localhost:4566"
    sns            = "http://localhost:4566"
    sqs            = "http://localhost:4566"
    ssm            = "http://localhost:4566"
    stepfunctions  = "http://localhost:4566"
    sts            = "http://localhost:4566"
    cloudtrail     = "http://localhost:4566"
  }

  default_tags {
    tags = {
      Environment = var.environment
      Owner       = var.owner
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "AWS access key (use 'test' for LocalStack)"
  type        = string
  default     = "test"
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS secret key (use 'test' for LocalStack)"
  type        = string
  default     = "test"
  sensitive   = true
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Resource owner"
  type        = string
  default     = "DevOps Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "IT-001"
}

variable "environment_suffix" {
  description = "Environment suffix for resource uniqueness (e.g., pr123, test456)"
  type        = string
  default     = ""
}

variable "resource_prefix" {
  description = "Prefix for all resources"
  type        = string
  default     = "corp-"
}

# Computed locals for naming
locals {
  # Create unique suffix with randomness if environment_suffix is provided
  unique_suffix = var.environment_suffix != "" ? var.environment_suffix : random_id.default_suffix.hex
  # Full resource prefix with unique suffix for uniqueness
  full_prefix = "${var.resource_prefix}${local.unique_suffix}-"
}

# Random ID for default suffix when environment_suffix is not provided
resource "random_id" "default_suffix" {
  byte_length = 4
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "corpdb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "admin"
}

variable "create_ec2_instance" {
  description = "Whether to create EC2 instance for testing"
  type        = bool
  default     = false
}

