# staging.tfvars - Staging Environment Configuration
# Usage: terraform apply -var-file="staging.tfvars"

# ================================
# GENERAL CONFIGURATION
# ================================

aws_region   = "us-west-2"
project_name = "healthcare-app"
environment  = "staging"
owner        = "healthcare-team"

# ================================
# COMPUTE CONFIGURATION
# ================================

min_size         = 1
max_size         = 3
desired_capacity = 2

# ================================
# DATABASE CONFIGURATION
# ================================

db_engine                 = "postgres"
db_engine_version        = "15.10"
db_instance_class        = "db.t3.small"
db_allocated_storage     = 50
db_max_allocated_storage = 200
db_backup_window         = "02:00-03:00"
db_maintenance_window    = "sun:03:00-sun:04:00"

# ================================
# SECURITY CONFIGURATION
# ================================

allowed_cidr_blocks  = ["10.0.0.0/8", "172.16.0.0/12"]  # More restrictive
enable_vpc_flow_logs = true

# ================================
# MONITORING CONFIGURATION
# ================================

log_retention_days = 14

# ================================
# STAGING ENVIRONMENT NOTES
# ================================
# 
# Automatic configuration through locals:
# - VPC CIDR: 10.2.0.0/16
# - Instance Type: t3.small (moderate capacity)
# - Backup Retention: 3 days (integration testing cycles)
# - Deletion Protection: false (testing environment)
#