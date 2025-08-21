variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "vpc_name" {
  description = "Name of the VPC"
  type        = string
  default     = "secure-network"
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

variable "bucket_name" {
  description = "Name of the S3 bucket for logs"
  type        = string
  default     = "secure-webapp-logs"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "AWS Key Pair name for EC2 access"
  type        = string
  default     = null
}

########################
# Data Sources
########################
# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

########################
# Modules
########################
# VPC Module
module "vpc" {
  source = "./modules/vpc"

  vpc_name            = var.vpc_name
  vpc_cidr            = var.vpc_cidr
  availability_zones  = data.aws_availability_zones.available.names
  public_subnet_cidrs = var.public_subnet_cidrs
}

# Security Module
module "security" {
  source = "./modules/security"

  vpc_id           = module.vpc.vpc_id
  public_subnet_id = module.vpc.public_subnet_ids[0]
  bucket_arn       = module.storage.bucket_arn
}

# Storage Module
module "storage" {
  source = "./modules/storage"

  bucket_name = var.bucket_name
}

# Compute Module
module "compute" {
  source = "./modules/compute"

  vpc_id               = module.vpc.vpc_id
  public_subnet_id     = module.vpc.public_subnet_ids[0]
  security_group_id    = module.security.web_security_group_id
  iam_instance_profile = module.security.ec2_instance_profile_name
  instance_type        = var.instance_type
  key_name             = var.key_name
}

########################
# Outputs
########################
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = module.compute.instance_id
}

output "ec2_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = module.compute.public_ip
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = module.storage.bucket_name
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = module.security.web_security_group_id
}
