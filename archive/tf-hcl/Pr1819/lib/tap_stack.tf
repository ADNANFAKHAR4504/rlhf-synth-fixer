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

  project_name = var.project_name
  environment  = var.environment
  iam_users    = ["testuser1", "testuser2"]
}

module "storage" {
  source = "./modules/storage"


  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
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

  project_name      = var.project_name
  flow_log_role_arn = module.iam.flow_log_role_arn
  vpc_id            = module.networking.vpc_id
}

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

output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = module.storage.kms_key_id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key"
  value       = module.storage.kms_key_arn
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

output "s3_logs_bucket_name" {
  description = "The name of the S3 logs bucket"
  value       = module.storage.s3_logs_bucket_name
}
