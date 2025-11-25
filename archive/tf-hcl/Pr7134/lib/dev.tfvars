environment_suffix = "dev"
region             = "us-east-1"

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

# RDS Configuration
rds_instance_class          = "db.t3.micro"
rds_backup_retention_period = 1
aurora_instance_count       = 1

# Lambda Configuration
lambda_memory_size = 128
lambda_timeout     = 30

# Tags
common_tags = {
  Environment = "dev"
  ManagedBy   = "Terraform"
  Project     = "multi-env-infra"
  CostCenter  = "engineering"
}
