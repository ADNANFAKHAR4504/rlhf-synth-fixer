########################
# Variables
########################
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "iac-aws-nova-model-breaking"
}

variable "author" {
  description = "Author of the project"
  type        = string
  default     = "ngwakoleslieelijah"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "created_date" {
  description = "Creation date"
  type        = string
  default     = "2025-08-14T21:08:49Z"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
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
  sensitive   = true
}

########################
# S3 Bucket
########################

/* resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
  tags   = var.bucket_tags
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

########################
# Outputs
########################

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.networking.vpc_cidr
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.rds_endpoint
  sensitive   = true
}

output "s3_data_bucket_name" {
  description = "Name of the S3 data bucket"
  value       = module.storage.s3_data_bucket_name
}

output "s3_logs_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = module.storage.s3_logs_bucket_name
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = module.monitoring.cloudtrail_arn
}