# tap_stack.tf - Main Terraform Configuration Entry Point
#
# This is a modular Terraform project for CloudWatch monitoring infrastructure.
# Resources are organized across multiple files for maintainability:
#
# - provider.tf: AWS provider and backend configuration
# - variables.tf: Input variables for configuration  
# - data.tf: Data sources for existing resources
# - alarms.tf: CloudWatch alarms for monitoring
# - canaries.tf: CloudWatch Synthetics canaries
# - logs.tf: CloudWatch log groups and metric filters
# - events.tf: CloudWatch Events rules
# - notifications.tf: SNS topics for alerting
# - kms.tf: KMS keys for encryption
# - dashboard.tf.disabled: CloudWatch dashboard (disabled)
# - cross_account.tf: Cross-account observability setup
# - ecs.tf: ECS task definitions and services
# - outputs.tf: Output values

# This file exists primarily as a marker for testing tools that expect
# a single entry point file. The actual infrastructure is defined in the
# modular files listed above.

# Variable declarations are in variables.tf
variable "aws_region" {
  description = "AWS region for CloudWatch resources"
  type        = string
  default     = "us-east-1"
}

# Main resources are defined in:
# - alarms.tf (CloudWatch alarms)
# - canaries.tf (Synthetics canaries)
# - logs.tf (Log groups and metric filters)
# - events.tf (EventBridge rules)
# - notifications.tf (SNS topics)
# - kms.tf (KMS encryption keys)
