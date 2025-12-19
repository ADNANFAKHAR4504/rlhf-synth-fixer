# Production Environment Configuration
aws_region         = "us-east-1"
project_name       = "fintech-app"
environment_suffix = "prod001"

# Network Configuration
vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Compute Configuration
instance_type    = "t3.medium"
min_size         = 3
max_size         = 10
desired_capacity = 3

# Database Configuration
db_instance_class        = "db.t3.medium"
db_backup_retention_days = 30
db_multi_az              = true

# Storage Configuration
enable_s3_versioning = true
s3_lifecycle_days    = 90

# Security Configuration
enable_ssl = true
# ssl_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"