# terraform.tfvars - Default Configuration for Development Environment
# Copy this file and customize for your specific environment

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

# Instance configuration is handled by locals in tap_stack.tf
# based on environment, but you can override here if needed
# instance_type    = "t3.micro"     # Overrides local config
min_size         = 1
max_size         = 2
desired_capacity = 1

# ================================
# DATABASE CONFIGURATION
# ================================

db_engine                   = "postgres"
db_engine_version          = "15.10"
db_instance_class          = "db.t3.micro"
db_allocated_storage       = 20
db_max_allocated_storage   = 50
# backup_retention_period is handled by locals based on environment
db_backup_window           = "03:00-04:00"
db_maintenance_window      = "sun:04:00-sun:05:00"
# enable_deletion_protection is handled by locals based on environment

# ================================
# SECURITY CONFIGURATION
# ================================

allowed_cidr_blocks = ["0.0.0.0/0"]  # Restrict this in production
enable_vpc_flow_logs = true

# ================================
# MONITORING CONFIGURATION
# ================================

log_retention_days = 7

# ================================
# ENVIRONMENT-SPECIFIC NOTES
# ================================
# 
# This configuration is for the development environment:
# - VPC CIDR: 10.1.0.0/16 (defined in locals)
# - Instance Type: t3.micro (defined in locals)
# - Backup Retention: 1 day (defined in locals)
# - Deletion Protection: false (defined in locals)
# 
# The actual CIDR blocks and other environment-specific 
# configurations are managed through the locals block 
# in tap_stack.tf to ensure consistency and prevent
# configuration drift between environments.
#