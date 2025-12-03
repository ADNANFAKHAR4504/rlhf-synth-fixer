# staging.tfvars - Staging Environment Configuration
# Usage: terraform apply -var-file="staging.tfvars"

# General Configuration
aws_region         = "us-west-2" # Staging region
environment_suffix = "staging"
project_name       = "payment-platform"
team               = "fintech-team"

# Database Configuration
db_engine            = "postgres"
db_engine_version    = "15.10"
db_instance_class    = "db.t3.small"
db_allocated_storage = 50

# Security Configuration
allowed_cidr_blocks = ["10.2.0.0/16"] # Staging VPC CIDR