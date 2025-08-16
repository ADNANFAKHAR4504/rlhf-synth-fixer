########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}
variable "bucket_region" {
  description = "Region for the S3 bucket"
  type        = string
  default     = "us-west-2"
}

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "devs3-bucket"
}

variable "bucket_tags" {
  description = "Tags to apply to the S3 bucket"
  type        = map(string)
  default = {
    Project     = "ExampleProject"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
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

output "bucket_name" {
  value = aws_s3_bucket.this.bucket
}

output "bucket_tags" {
  value = aws_s3_bucket.this.tags
}
*/
# Main Terraform configuration that orchestrates the tap_stack module
module "tap_stack" {
  source = "./modules/tap_stack"

  # Environment configuration
  environment  = var.environment
  project_name = var.project_name
  aws_region   = var.aws_region

  # Infrastructure sizing based on environment
  instance_type    = var.instance_type
  min_capacity     = var.min_capacity
  max_capacity     = var.max_capacity
  desired_capacity = var.desired_capacity

  # Database configuration
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_engine_version    = var.db_engine_version

  # Security and networking
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = var.enable_nat_gateway
  enable_vpn_gateway = var.enable_vpn_gateway

  # Monitoring and logging
  enable_detailed_monitoring = var.enable_detailed_monitoring
  log_retention_days         = var.log_retention_days

  # Backup and maintenance
  backup_retention_period = var.backup_retention_period
  maintenance_window      = var.maintenance_window
  backup_window           = var.backup_window

  # Tags
  owner       = var.owner
  cost_center = var.cost_center

  # Secrets
  db_master_username_secret_name = var.db_master_username_secret_name
  db_master_password_secret_name = var.db_master_password_secret_name
  api_key_secret_name            = var.api_key_secret_name
}
