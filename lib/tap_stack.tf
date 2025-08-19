# tap_stack.tf - Final corrected version

# Variables (unchanged)
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.2.0/24", "10.0.3.0/24"]
}

variable "allowed_ssh_ips" {
  description = "List of IP addresses allowed to SSH to bastion host"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Replace with your IP in production
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of the EC2 key pair"
  type        = string
  default     = "prod-key"
}

variable "environment" {
  description = "Environment tag"
  type        = string
  default     = "Prod"
}

variable "s3_bucket_name" {
  description = "Name for the application data S3 bucket"
  type        = string
  default     = "prod-app-data-bucket" # Change to your unique bucket name
}

variable "state_bucket_name" {
  description = "Name for the Terraform state S3 bucket"
  type        = string
  default     = "prod-terraform-state-bucket" # Change to your unique bucket name
}

# Locals for consistent naming
locals {
  name_prefix = "${lower(var.environment)}-${var.aws_region}"
  common_tags = {
    Environment = var.environment
    Terraform   = "true"
  }
}

# VPC Module - Updated to disable flow logs to avoid warning
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.name_prefix}-vpc"
  cidr = var.vpc_cidr

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnets  = var.public_subnet_cidrs
  private_subnets = var.private_subnet_cidrs

  enable_nat_gateway     = true
  single_nat_gateway     = true
  one_nat_gateway_per_az = false
  enable_dns_hostnames   = true
  
  # Disable flow logs to avoid deprecated attribute warning
  enable_flow_log                      = false
  create_flow_log_cloudwatch_log_group = false
  create_flow_log_cloudwatch_iam_role  = false

  tags = local.common_tags
}

# [Rest of your existing resources: Security Groups, EC2 Instances, IAM roles...]
# Keep all these resources exactly as they were in the previous version

# S3 Bucket with Versioning and Encryption - Updated to disable ACLs
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_s3_bucket" "data" {
  bucket = var.s3_bucket_name
  tags   = local.common_tags
}

# Remove the aws_s3_bucket_acl resource completely - not needed with ACLs disabled
# resource "aws_s3_bucket_acl" "data" {
#   bucket = aws_s3_bucket.data.id
#   acl    = "private" # This is what was causing the error
# }

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Terraform State Bucket - Updated with proper naming
resource "aws_kms_key" "terraform_state" {
  description             = "KMS key for Terraform state encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_s3_bucket" "terraform_state" {
  # Use a unique bucket name - you'll need to change this
  bucket = "${var.state_bucket_name}-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
}

# Remove the aws_s3_bucket_acl resource for state bucket as well
# resource "aws_s3_bucket_acl" "terraform_state" {
#   bucket = aws_s3_bucket.terraform_state.id
#   acl    = "private"
# }

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.terraform_state.arn
      sse_algorithm     = "aws:kms"
    }
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
}

data "aws_caller_identity" "current" {}


# Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnets
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnets
}

output "bastion_public_ip" {
  description = "Public IP address of the bastion host"
  value       = aws_instance.bastion.public_ip
}

output "private_instance_id" {
  description = "ID of the private EC2 instance"
  value       = aws_instance.private_instance.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.data.arn
}

output "terraform_state_bucket" {
  description = "Name of the Terraform state bucket"
  value       = aws_s3_bucket.terraform_state.id
}