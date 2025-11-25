environment_suffix = "staging"
region             = "us-east-1"

# VPC Configuration
vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]

# RDS Configuration
rds_instance_class          = "db.t3.small"
rds_backup_retention_period = 7
aurora_instance_count       = 2

# Lambda Configuration
lambda_memory_size = 256
lambda_timeout     = 60

# Tags
common_tags = {
  Environment = "staging"
  ManagedBy   = "Terraform"
  Project     = "multi-env-infra"
  CostCenter  = "engineering"
}
