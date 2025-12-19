# Staging Environment Configuration
aws_region         = "us-east-1"
project_name       = "fintech-app"
environment_suffix = "stg001"

# Network Configuration
vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Compute Configuration
instance_type    = "t3.small"
min_size         = 2
max_size         = 4
desired_capacity = 2

# Database Configuration
db_instance_class        = "db.t3.small"
db_backup_retention_days = 7
db_multi_az              = true

# Storage Configuration
enable_s3_versioning = false
s3_lifecycle_days    = 60

# Security Configuration
enable_ssl = true
# ssl_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"