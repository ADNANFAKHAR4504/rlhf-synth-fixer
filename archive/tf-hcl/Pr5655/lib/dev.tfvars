# dev.tfvars - Development environment configuration

# ================================
# ENVIRONMENT CONFIGURATION
# ================================

environment = "dev"
cost_center = "engineering"

# ================================
# RESOURCE SIZING (Cost-optimized)
# ================================

# ECS Configuration - Minimal resources for development
ecs_cpu_override          = 256
ecs_memory_override       = 512
ecs_desired_count_override = 2

# Database Configuration - Single AZ for cost savings
db_instance_class_override = "db.t3.medium"
backup_retention_days     = 1
enable_multi_az_override  = false

# ================================
# SECURITY CONFIGURATION
# ================================

# Disable deletion protection for easy teardown
enable_deletion_protection = false

# Relaxed monitoring for development
log_retention_days       = 7
secrets_rotation_days    = 90

# ================================
# DEVELOPMENT-SPECIFIC SETTINGS
# ================================

# Enable debugging capabilities
enable_execute_command = true
enable_xray_tracing   = true

# Disable WAF for development (cost optimization)
enable_waf = false

# ================================
# TAGS
# ================================

additional_tags = {
  Environment = "development"
  Purpose     = "testing"
  AutoShutdown = "enabled"
  CostOptimized = "true"
}