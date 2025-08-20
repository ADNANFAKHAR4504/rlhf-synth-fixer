```hcl
# vars.tf

variable "aws_region" {
  description = "The AWS region to deploy the infrastructure to."
  type        = string
  default     = "us-east-1"
}

variable "author" {
  description = "The author of the infrastructure."
  type        = string
  default     = "ngwakoleslieelijah"
}

variable "created_date" {
  description = "The date the infrastructure was created."
  type        = string
  default     = "2025-08-14T21:08:49Z"
}

variable "availability_zones" {
  description = "The availability zones to deploy the infrastructure to."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "account_id" {
  description = "The AWS account ID."
  type        = string
  default     = "123456789012"
}

variable "project_name" {
  description = "The name of the project."
  type        = string
  default     = "IaC-AWS-Nova-Model-Breaking"
}

variable "environment" {
  description = "The environment to deploy the infrastructure to."
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "The CIDR blocks for the public subnets."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "The CIDR blocks for the private subnets."
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "db_username" {
  description = "The username for the database."
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "The password for the database."
  type        = string
  sensitive   = true
  default     = "password"
}

variable "ami_id" {
  description = "The ID of the AMI to use for the EC2 instances."
  type        = string
  default     = "ami-0c520850203c586f6"
}

variable "instance_type" {
  description = "The type of EC2 instance to use."
  type        = string
  default     = "t2.micro"
}

# main.tf

module "networking" {
  source = "./modules/networking"

  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

module "security" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.networking.vpc_id
  vpc_cidr     = var.vpc_cidr
}

module "iam" {
  source = "./modules/iam"

  project_name       = var.project_name
  environment        = var.environment
  s3_data_bucket_arn = module.storage.s3_data_bucket_arn
  iam_users          = ["testuser1", "testuser2"]
}

module "storage" {
  source = "./modules/storage"

  providers = {
    aws.us-west-2      = aws.us-west-2
    aws.ap-northeast-1 = aws.ap-northeast-1
  }

  project_name            = var.project_name
  environment             = var.environment
  vpc_id                  = module.networking.vpc_id
  private_route_table_ids = module.networking.private_route_table_ids
  aws_region              = var.aws_region
}

module "database" {
  source = "./modules/database"

  project_name       = var.project_name
  environment        = var.environment
  private_subnet_ids = module.networking.private_subnet_ids
  rds_sg_id          = module.security.rds_sg_id
  db_username        = var.db_username
  db_password        = var.db_password
}

module "compute" {
  source = "./modules/compute"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  ec2_sg_id             = module.security.ec2_sg_id
  alb_sg_id             = module.security.alb_sg_id
  instance_profile_name = module.iam.ec2_instance_profile_name
  ami_id                = var.ami_id
  instance_type         = var.instance_type
}

module "monitoring" {
  source = "./modules/monitoring"

  project_name             = var.project_name
  cloudtrail_bucket_name   = module.storage.s3_data_bucket_name
  flow_log_role_arn        = module.iam.flow_log_role_arn
  flow_log_destination_arn = module.monitoring.flow_log_destination_arn
  vpc_id                   = module.networking.vpc_id
}

# outputs

output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

output "private_route_table_ids" {
  description = "The IDs of the private route tables"
  value       = module.networking.private_route_table_ids
}

output "ec2_sg_id" {
  description = "The ID of the EC2 security group"
  value       = module.security.ec2_sg_id
}

output "alb_sg_id" {
  description = "The ID of the ALB security group"
  value       = module.security.alb_sg_id
}

output "rds_sg_id" {
  description = "The ID of the RDS security group"
  value       = module.security.rds_sg_id
}

output "vpc_endpoint_sg_id" {
  description = "The ID of the VPC endpoint security group"
  value       = module.security.vpc_endpoint_sg_id
}

output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = module.storage.kms_key_id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key"
  value       = module.storage.kms_key_arn
}

output "s3_data_bucket_name" {
  description = "The name of the S3 data bucket"
  value       = module.storage.s3_data_bucket_name
}

output "s3_data_bucket_arn" {
  description = "The ARN of the S3 data bucket"
  value       = module.storage.s3_data_bucket_arn
}

output "vpc_endpoint_s3_id" {
  description = "The ID of the S3 VPC endpoint"
  value       = module.storage.vpc_endpoint_s3_id
}

output "ec2_instance_profile_name" {
  description = "The name of the EC2 instance profile"
  value       = module.iam.ec2_instance_profile_name
}

output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = module.compute.alb_dns_name
}

output "rds_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = module.database.rds_endpoint
}

output "cloudtrail_arn" {
  description = "The ARN of the CloudTrail"
  value       = module.monitoring.cloudtrail_arn
}
```
