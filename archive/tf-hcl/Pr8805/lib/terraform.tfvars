# Environment-specific configuration
environment_suffix = "prod"
environment        = "production"
aws_region         = "us-east-1"

# Compute configuration
instance_type  = "t3.large"
instance_count = 12

# Database configuration
db_instance_class        = "db.t3.medium"
db_backup_retention_days = 7

# Network configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Tagging
cost_center = "FinancialServices"
