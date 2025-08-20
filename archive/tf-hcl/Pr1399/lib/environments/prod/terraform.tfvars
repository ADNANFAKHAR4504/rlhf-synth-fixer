# Production environment configuration
environment = "prod"
aws_region  = "us-west-2"

# Larger instances for production
instance_type    = "t3.medium"
min_capacity     = 2
max_capacity     = 10
desired_capacity = 3

# Larger database for production
db_instance_class    = "db.t3.medium"
db_allocated_storage = 100
db_engine_version    = "13.15"

# Production network settings
vpc_cidr           = "10.2.0.0/16"
enable_nat_gateway = true
enable_vpn_gateway = true

# Full monitoring for production
enable_detailed_monitoring = true
log_retention_days         = 30

# Longer backup retention for production
backup_retention_period = 30
maintenance_window      = "sun:03:00-sun:04:00"
backup_window           = "02:00-03:00"

# Tags
owner       = "platform-team"
cost_center = "production"
