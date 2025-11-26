environment_suffix = "prod"
primary_region     = "us-east-1"
secondary_region   = "us-west-2"

organization_name = "turing-organization"
organizational_units = [
  "Security",
  "Production",
  "Development"
]

kms_key_rotation_days         = 365
cloudwatch_log_retention_days = 90
enable_cloudtrail             = true
enable_config                 = true

# Replace with actual AWS account IDs for your organization
trusted_account_ids = [
  "123456789012",
  "987654321098"
]

# Optional: MFA device ARN (required for MFA enforcement)
# mfa_device_arn = "arn:aws:iam::123456789012:mfa/user-name"

# Common tags for all resources
tags = {
  Environment = "production"
  CostCenter  = "security"
  Owner       = "security-team"
  ManagedBy   = "Terraform"
  Project     = "multi-account-security-framework"
}

config_conformance_pack_name = "security-conformance-pack"
