# Auto-loaded Terraform variables for LocalStack deployment
# This file is automatically detected when PROVIDER=localstack

# Enable LocalStack mode to disable unsupported services
is_localstack = true

# Use environment suffix for unique naming
environment_suffix = "ls"

# Disable CloudTrail creation (not needed for LocalStack)
create_cloudtrail = false
