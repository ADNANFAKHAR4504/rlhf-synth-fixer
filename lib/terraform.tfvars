# Terraform Variables Configuration
# Document Processing Migration to AWS

# Environment Configuration
environment_suffix = "dev"

# Region Configuration
source_region = "us-east-1"
target_region = "eu-west-1"

# Migration Configuration
migration_phase = "planning"
cutover_date    = "2025-12-31"

# Optional Features (set to true to enable)
enable_step_functions = true
enable_eventbridge    = true
enable_backup         = true

# Document Retention
document_retention_days = 90

# Monitoring Configuration
alarm_email                       = "ops@example.com"
replication_lag_threshold_seconds = 1
