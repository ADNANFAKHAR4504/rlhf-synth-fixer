# dev.tfvars - Development Environment Configuration
# Usage: terraform apply -var-file="dev.tfvars"

# General Configuration
aws_region         = "eu-west-1" # Development region
environment_suffix = "dev"
project_name       = "payment-platform"
team               = "fintech-team"

# Database Configuration
db_engine            = "postgres"
db_engine_version    = "15.10"
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20

# Security Configuration
allowed_cidr_blocks = ["10.1.0.0/16"] # Dev VPC CIDR