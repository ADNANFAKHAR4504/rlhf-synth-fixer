# tap_stack.tf - Main Terraform Configuration Entry Point
#
# This is a modular Terraform project for CloudWatch monitoring infrastructure.
# Resources are organized across multiple files for maintainability:
#
# - provider.tf: AWS provider and backend configuration
# - variables.tf: Input variables for configuration (including aws_region)
# - data.tf: Data sources for existing resources
# - alarms.tf: CloudWatch alarms for monitoring
# - canaries.tf: CloudWatch Synthetics canaries
# - logs.tf: CloudWatch log groups and metric filters
# - events.tf: CloudWatch Events rules
# - notifications.tf: SNS topics for alerting
# - kms.tf: KMS keys for encryption
# - dashboard.tf.disabled: CloudWatch dashboard (currently disabled)
# - cross_account.tf: Cross-account observability setup
# - ecs.tf: ECS task definitions and services
# - outputs.tf: Output values

# This file serves as a documentation and marker file for testing tools
# that expect a single entry point. The actual infrastructure definitions
# are in the modular files listed above.

# Key Resources:
# - CloudWatch Log Groups with 30-day retention (logs.tf)
# - Metric Filters for error pattern extraction (logs.tf)
# - CloudWatch Alarms with two-tier thresholds (alarms.tf)
# - Synthetics Canaries for endpoint monitoring (canaries.tf)
# - SNS Topics with KMS encryption (notifications.tf + kms.tf)
# - EventBridge Rules for ECS state changes (events.tf)
# - Cross-account monitoring links (cross_account.tf)

# Variables are declared in variables.tf
# Providers are configured in provider.tf
# See those files for configuration details
