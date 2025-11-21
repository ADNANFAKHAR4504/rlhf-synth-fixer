environment        = "dev"
environment_suffix = "dev-101912540"
project_name       = "payment"
aws_region         = "us-east-1"

vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

lambda_memory_size = 256
lambda_timeout     = 30

rds_instance_class    = "db.t3.micro"
rds_allocated_storage = 20
rds_username          = "dbadmin"

log_retention_days = 7

common_tags = {
  Project     = "PaymentProcessing"
  ManagedBy   = "Terraform"
  Environment = "dev"
}
