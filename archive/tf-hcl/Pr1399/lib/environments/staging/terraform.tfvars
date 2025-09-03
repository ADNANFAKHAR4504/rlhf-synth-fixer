# Staging environment configuration
environment = "staging"
aws_region  = "us-west-2"

# Medium instances for staging
instance_type    = "t3.small"
min_capacity     = 1
max_capacity     = 3
desired_capacity = 2

# Medium database for staging
db_instance_class    = "db.t3.small"
db_allocated_storage = 50
db_engine_version    = "13.15"

# Staging network settings
vpc_cidr           = "10.1.0.0/16"
enable_nat_gateway = true
enable_vpn_gateway = false

# Standard monitoring for staging
enable_detailed_monitoring = true
log_retention_days         = 7

# Standard backup retention for staging
backup_retention_period = 7
maintenance_window      = "sun:03:00-sun:04:00"
backup_window           = "02:00-03:00"

# Tags
owner       = "staging-team"
cost_center = "staging"
