# main.tf - Main entry point for zero-trust security infrastructure
# This module implements PCI-DSS compliant security controls for AWS

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for current AWS region
data "aws_region" "current" {}

# Data source for AWS Organizations (conditional)
data "aws_organizations_organization" "current" {
  count = var.enable_organization_policies ? 1 : 0
}

# Note: This is a modular Terraform configuration with resources organized across multiple files:
# - provider.tf: AWS provider and backend configuration
# - variables.tf: Input variables and validation rules
# - locals.tf: Local values and naming conventions
# - iam.tf: IAM roles, policies, and permission boundaries
# - kms.tf: KMS keys for encryption (S3, RDS, EBS)
# - scp.tf: Service Control Policies (when organization access available)
# - cloudwatch.tf: CloudWatch monitoring, alarms, and dashboards
# - config.tf: AWS Config rules for compliance monitoring
# - session-manager.tf: Systems Manager Session Manager configuration
# - tagging.tf: Tag enforcement policies and auto-tagging Lambda
# - audit-role.tf: Cross-account audit role for security team
# - outputs.tf: Output values for deployed resources

