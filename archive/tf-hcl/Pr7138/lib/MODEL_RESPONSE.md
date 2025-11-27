# Environment Configuration
environment_suffix = "prod"
primary_region     = "us-east-1"
secondary_region   = "us-west-2"

# Organization Configuration
organization_name = "turing-organization"
organizational_units = [
  "Security",
  "Production",
  "Development"
]

# KMS Configuration
kms_key_rotation_days = 365

# CloudWatch Configuration
cloudwatch_log_retention_days = 90

# CloudTrail Configuration
enable_cloudtrail = true

# Cross-Account Configuration
trusted_account_ids = [
  "123456789012",
  "987654321098"
]

# Tags
tags = {
  Environment = "production"
  CostCenter  = "security"
  Owner       = "security-team"
}
