# prod.tfvars - Production Environment Configuration
# Usage: terraform apply -var-file="prod.tfvars"

# ================================
# GENERAL CONFIGURATION
# ================================

aws_region   = "us-west-2"
project_name = "healthcare-app"
environment  = "prod"
owner        = "healthcare-team"

# ================================
# COMPUTE CONFIGURATION
# ================================

min_size         = 2
max_size         = 10
desired_capacity = 3

# ================================
# DATABASE CONFIGURATION
# ================================

db_engine                 = "postgres"
db_engine_version        = "15.10"
db_instance_class        = "db.t3.medium"
db_allocated_storage     = 100
db_max_allocated_storage = 1000
db_backup_window         = "01:00-02:00"
db_maintenance_window    = "sun:02:00-sun:03:00"

# ================================
# SECURITY CONFIGURATION
# ================================

allowed_cidr_blocks  = ["10.0.0.0/8"]  # Highly restrictive - adjust for your needs
enable_vpc_flow_logs = true

# ================================
# MONITORING CONFIGURATION
# ================================

log_retention_days = 30

# ================================
# PRODUCTION ENVIRONMENT NOTES
# ================================
# 
# Automatic configuration through locals:
# - VPC CIDR: 10.3.0.0/16
# - Instance Type: t3.medium (production capacity)
# - Backup Retention: 7 days (business continuity)
# - Deletion Protection: true (data safety)
# 
# Additional Production Considerations:
# - Multi-AZ RDS deployment enabled automatically
# - Performance Insights enabled for monitoring
# - ALB deletion protection enabled
# - Enhanced monitoring and logging
#