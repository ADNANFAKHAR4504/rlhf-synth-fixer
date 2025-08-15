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

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ID of the ALB security group"
  type        = string
}

variable "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  type        = string
}

variable "instance_profile_name" {
  description = "Name of the IAM instance profile"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of the KMS key"
  type        = string
}