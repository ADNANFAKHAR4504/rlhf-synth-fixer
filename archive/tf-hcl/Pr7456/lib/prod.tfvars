# prod.tfvars - Production Environment Configuration
# Usage: terraform apply -var-file="prod.tfvars"

# General Configuration
aws_region         = "us-east-1" # Production region
environment_suffix = "prod"
project_name       = "payment-platform"
team               = "fintech-team"

# Database Configuration
db_engine            = "postgres"
db_engine_version    = "15.10"
db_instance_class    = "db.r6g.large"
db_allocated_storage = 100

# Security Configuration
allowed_cidr_blocks = ["10.3.0.0/16"] # Production VPC CIDR