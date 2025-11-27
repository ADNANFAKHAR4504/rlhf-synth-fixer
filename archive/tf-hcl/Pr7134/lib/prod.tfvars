environment_suffix = "prod"
region             = "us-east-1"

# VPC Configuration
vpc_cidr             = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.11.0/24"]

# RDS Configuration
rds_instance_class          = "db.m5.large"
rds_backup_retention_period = 30
aurora_instance_count       = 2

# Lambda Configuration
lambda_memory_size = 512
lambda_timeout     = 120

# Tags
common_tags = {
  Environment = "prod"
  ManagedBy   = "Terraform"
  Project     = "multi-env-infra"
  CostCenter  = "operations"
}
