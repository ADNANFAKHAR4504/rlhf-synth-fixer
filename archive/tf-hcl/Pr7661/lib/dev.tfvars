# Development Environment Configuration
aws_region         = "us-east-1"
project_name       = "fintech-app"
environment_suffix = "dev001"

# Network Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Compute Configuration
instance_type    = "t3.micro"
min_size         = 1
max_size         = 2
desired_capacity = 1

# Database Configuration
db_instance_class        = "db.t3.micro"
db_backup_retention_days = 1
db_multi_az              = false

# Storage Configuration
enable_s3_versioning = false
s3_lifecycle_days    = 30

# Security Configuration
enable_ssl = false