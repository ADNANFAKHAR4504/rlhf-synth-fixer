# dev.tfvars - Development Environment Configuration
# Usage: terraform apply -var-file="dev.tfvars"

# ================================
# GENERAL CONFIGURATION
# ================================

aws_region   = "us-west-2"
project_name = "healthcare-app"
environment  = "dev"
owner        = "healthcare-team"

# ================================
# COMPUTE CONFIGURATION
# ================================

min_size         = 1
max_size         = 2
desired_capacity = 1

# ================================
# DATABASE CONFIGURATION
# ================================

db_engine                 = "postgres"
db_engine_version        = "15.10"
db_instance_class        = "db.t3.micro"
db_allocated_storage     = 20
db_max_allocated_storage = 50
db_backup_window         = "03:00-04:00"
db_maintenance_window    = "sun:04:00-sun:05:00"

# ================================
# SECURITY CONFIGURATION
# ================================

allowed_cidr_blocks  = ["0.0.0.0/0"]  # Open for development testing
enable_vpc_flow_logs = true

# ================================
# MONITORING CONFIGURATION
# ================================

log_retention_days = 7

# ================================
# DEVELOPMENT ENVIRONMENT NOTES
# ================================
# 
# Automatic configuration through locals:
# - VPC CIDR: 10.1.0.0/16
# - Instance Type: t3.micro (cost-effective)
# - Backup Retention: 1 day (minimal retention)
# - Deletion Protection: false (easy teardown)
#