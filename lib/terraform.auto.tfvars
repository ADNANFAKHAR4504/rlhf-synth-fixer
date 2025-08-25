# Non-interactive defaults for CI/bootstrap runs
region      = "us-east-1"
alarm_email = "sudhakar.s@turing.com"
tags = {
  Environment = "pr2151"
  Owner       = "sudhakar01"
}

# Prevent conflicts in accounts where these are already set up
enable_guardduty   = false
enable_aws_config  = false