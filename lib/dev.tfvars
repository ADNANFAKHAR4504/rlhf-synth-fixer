# Development environment configuration

###################
# General Configuration
###################
aws_region   = "us-west-2"
environment  = "dev"
owner        = "Development Team"
cost_center  = "Engineering"

###################
# Networking Configuration
###################
vpc_cidr = "10.0.0.0/16"

###################
# Application Configuration
###################
app_port           = 8080
health_check_path  = "/health"
instance_type      = "t3.small"  # Smaller for dev
min_size          = 1            # Minimal for dev
max_size          = 3            # Lower max for dev
desired_capacity  = 2            # Lower desired for dev
key_pair_name     = "dev-key-pair"

###################
# Database Configuration
###################
db_engine                    = "mysql"
db_engine_version           = "8.0"
db_family                   = "mysql8.0"
db_instance_class           = "db.t3.micro"  # Smallest for dev
db_allocated_storage        = 20
db_max_allocated_storage    = 50             # Lower max for dev
db_name                     = "devappdb"
db_username                 = "devadmin"
db_password                 = "DevPassword123!"
db_port                     = 3306
db_backup_retention_period  = 3              # Shorter retention for dev
db_backup_window           = "03:00-04:00"
db_maintenance_window      = "sun:04:00-sun:05:00"

###################
# Security Configuration
###################
kms_deletion_window = 7

###################
# Monitoring Configuration
###################
log_retention_days        = 7   # Shorter retention for dev
enable_detailed_monitoring = false

###################
# Auto Scaling Configuration
###################
scale_up_threshold   = 80   # Higher threshold for dev
scale_down_threshold = 20   # Lower threshold for dev
scale_up_cooldown   = 300
scale_down_cooldown = 300