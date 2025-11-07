# staging.tfvars - Staging environment configuration

# ================================
# ENVIRONMENT CONFIGURATION
# ================================

environment = "staging"
cost_center = "engineering"

# ================================
# RESOURCE SIZING (Production-like)
# ================================

# ECS Configuration - Production-like sizing
ecs_cpu_override          = 512
ecs_memory_override       = 1024
ecs_desired_count_override = 3

# Database Configuration - Multi-AZ for testing HA scenarios
db_instance_class_override = "db.t3.medium"
backup_retention_days     = 3
enable_multi_az_override  = true

# ================================
# SECURITY CONFIGURATION
# ================================

# Enable deletion protection for staging stability
enable_deletion_protection = false

# Production-like monitoring
log_retention_days       = 14
secrets_rotation_days    = 60

# ================================
# STAGING-SPECIFIC SETTINGS
# ================================

# Enable debugging capabilities for troubleshooting
enable_execute_command = true
enable_xray_tracing   = true

# Enable WAF for testing security policies
enable_waf     = true
waf_rate_limit = 1000

# ================================
# SSL/TLS CONFIGURATION
# ================================

# Uncomment and configure for HTTPS testing
# certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/staging-cert-id"
# domain_name     = "staging.example.com"

# ================================
# TAGS
# ================================

additional_tags = {
  Environment     = "staging"
  Purpose        = "integration-testing"
  DataClassification = "test-data"
  BackupRequired = "true"
}