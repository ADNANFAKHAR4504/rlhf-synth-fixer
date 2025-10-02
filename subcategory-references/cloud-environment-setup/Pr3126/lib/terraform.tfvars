aws_region = "us-east-1"
name_prefix = "hr-staging"
environment = "staging"
vpc_cidr = "10.0.0.0/16"
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
db_instance_class = "db.t3.micro"
db_allocated_storage = 20
db_engine_version = "8.0"
db_username = "admin"
db_password = "HR2023!TestPassword#Staging" # Test environment password
db_multi_az = false
tags = {
  Project = "HR-Tool"
  Environment = "staging"
  ManagedBy = "Terraform"
}