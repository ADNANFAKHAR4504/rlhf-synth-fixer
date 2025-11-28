## Terraform variables for local runs (do NOT commit secrets)

# AWS region used by the aws provider
aws_region = "us-east-1"

# Environment suffix used in names and tags (dev/staging/prod)
environment = "dev"

# Optional: list of notification emails (leave empty to skip subscription creation)
# notification_emails = []

# Optional: SSM parameter prefix (adjust if you store params under a different path)
# ssm_prefix = "/webhook-processor"
