# Development environment configuration
environment = "dev"
aws_region  = "us-west-2"

# Smaller instances for dev
instance_type    = "t3.micro"
min_capacity     = 1
max_capacity     = 2
desired_capacity = 1

# Smaller database for dev
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20
db_engine_version    = "13.15"

# Dev network settings
vpc_cidr           = "10.0.0.0/16"
enable_nat_gateway = false # Save costs in dev
enable_vpn_gateway = false

# Minimal monitoring for dev
enable_detailed_monitoring = false
log_retention_days         = 3

# Shorter backup retention for dev
backup_retention_period = 1
maintenance_window      = "sun:03:00-sun:04:00"
backup_window           = "02:00-03:00"

# Tags
owner       = "dev-team"
cost_center = "development"

# Availability zones for us-west-2
availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]

# Secrets configuration
db_master_username_secret_name = "tap-stack/db/master-username"
db_master_password_secret_name = "tap-stack/db/master-password"
api_key_secret_name            = "tap-stack/api-key"
