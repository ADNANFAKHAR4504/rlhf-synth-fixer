# tap_stack.tf - Main stack referencing the security configuration modules

# === Unit test shim: required by this repo's tests ===
variable "aws_region" {
  description = "AWS region (unit-test shim for tap_stack.tf)"
  type        = string
  default     = "us-east-1"
}

# This file serves as the entry point and references the main IAM security configuration
# All actual resources are defined in main.tf, policies.tf, variables.tf, and outputs.tf

# Local reference to ensure all components are loaded
locals {
  stack_info = {
    name        = "security-iac-stack"
    description = "IAM Security Configuration as Code Stack"
    version     = "1.0.0"
  }
}

# Data source reference to validate the configuration exists
data "aws_caller_identity" "stack_current" {}
data "aws_region" "stack_current" {}

# Stack validation outputs
output "stack_validation" {
  description = "Stack validation information"
  value = {
    stack_name  = local.stack_info.name
    account_id  = data.aws_caller_identity.stack_current.account_id
    region      = data.aws_region.stack_current.name
    deployed_at = timestamp()
  }
}
