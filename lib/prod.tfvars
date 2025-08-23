# Production environment configuration

###################
# General Configuration
###################
aws_region   = "us-west-2"
environment  = "prod"
owner        = "Production Team"
cost_center  = "Engineering"

###################
# Networking Configuration
###################
vpc_cidr = "10.1.0.0/16"  # Different CIDR for prod

###################
# Application Configuration
###################
app_port           = 8080
health_check_path  = "/health"
instance_type      = "t3.large"  # Larger for prod
min_size          = 3            # Higher minimum for prod
max_size          = 20           # Higher max for prod
desired_capacity  = 5            # Higher desired for prod
key_pair_name     = "prod-key-pair"

###################
# Database Configuration
###################
db_engine                    = "mysql"
db_engine_version           = "8.0"
db_family                   = "mysql8.0"
db_instance_class           = "db.t3.medium"  # Larger for prod
db_allocated_storage        = 100
db_max_allocated_storage    = 1000           # Higher max for prod
db_name                     = "prodappdb"
db_username                 = "prodadmin"
db_password                 = "ProdSecurePassword123!"
db_port                     = 3306
db_backup_retention_period  = 30             # Longer retention for prod
db_backup_window           = "03:00-04:00"
db_maintenance_window      = "sun:04:00-sun:05:00"

###################
# Security Configuration
###################
kms_deletion_window = 30  # Longer window for prod

###################
# Monitoring Configuration
###################
log_retention_days        = 90   # Longer retention for prod
enable_detailed_monitoring = true # Enable detailed monitoring for prod

###################
# Auto Scaling Configuration
###################
scale_up_threshold   = 70   # Standard threshold for prod
scale_down_threshold = 30   # Standard threshold for prod
scale_up_cooldown   = 300
scale_down_cooldown = 600   # Longer cooldown for prod stability