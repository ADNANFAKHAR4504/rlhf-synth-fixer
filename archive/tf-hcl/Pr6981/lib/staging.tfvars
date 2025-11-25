environment        = "staging"
environment_suffix = "staging"
project_name       = "payment"
aws_region         = "us-east-1"

vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]

lambda_memory_size = 512
lambda_timeout     = 60

rds_instance_class    = "db.t3.small"
rds_allocated_storage = 50
rds_username          = "dbadmin"

log_retention_days = 30

common_tags = {
  Project     = "PaymentProcessing"
  ManagedBy   = "Terraform"
  Environment = "staging"
}
