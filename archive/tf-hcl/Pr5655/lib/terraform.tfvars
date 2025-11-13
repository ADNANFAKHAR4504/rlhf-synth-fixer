# terraform.tfvars - Default configuration values

# ================================
# PROJECT CONFIGURATION
# ================================

project_name = "tap-fintech"
environment  = "dev"
cost_center  = "engineering"
aws_region   = "us-east-1"

# ================================
# DOMAIN AND SSL CONFIGURATION
# ================================

# Uncomment and configure for production deployments with custom domain
# domain_name     = "example.com"
# certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# ================================
# APPLICATION CONFIGURATION
# ================================

health_check_path     = "/health"
container_image_tag   = "latest"
enable_https_redirect = true

# ================================
# SECURITY CONFIGURATION
# ================================

# CIDR blocks allowed to access the ALB (0.0.0.0/0 for public access)
allowed_cidr_blocks = ["0.0.0.0/0"]

# Enable WAF for additional protection (recommended for production)
enable_waf       = false
waf_rate_limit   = 2000

# ================================
# MONITORING CONFIGURATION
# ================================

log_retention_days       = 30
enable_container_insights = true
enable_execute_command   = true
enable_xray_tracing     = true

# ================================
# DATABASE CONFIGURATION
# ================================

enable_performance_insights = true
enable_enhanced_monitoring  = true
secrets_rotation_days      = 30

# ================================
# ENVIRONMENT-SPECIFIC OVERRIDES
# ================================

# Uncomment to override default environment-specific settings

# ECS Configuration Overrides
# ecs_cpu_override          = 512
# ecs_memory_override       = 1024
# ecs_desired_count_override = 3

# Database Configuration Overrides
# db_instance_class_override = "db.t3.large"
# backup_retention_days     = 7
# enable_multi_az_override  = true

# Security Overrides
# enable_deletion_protection = true

# ================================
# ADDITIONAL TAGS
# ================================

additional_tags = {
  Owner       = "platform-team"
  Application = "payment-processing"
  Compliance  = "pci-dss"
  Backup      = "required"
  Monitoring  = "enhanced"
}