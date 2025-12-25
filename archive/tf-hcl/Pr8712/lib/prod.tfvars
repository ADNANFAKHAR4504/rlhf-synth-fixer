environment        = "prod"
environment_suffix = "prod"
project_name       = "payment"
aws_region         = "us-east-1"

vpc_cidr             = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.11.0/24"]

lambda_memory_size = 1024
lambda_timeout     = 90

rds_instance_class    = "db.t3.medium"
rds_allocated_storage = 100
rds_username          = "dbadmin"

log_retention_days = 90

common_tags = {
  Project     = "PaymentProcessing"
  ManagedBy   = "Terraform"
  Environment = "prod"
}
